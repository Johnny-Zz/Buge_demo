import { normalizeAiTask } from "@/lib/ai/date"
import type { AiScene, AiTask } from "@/lib/ai/types"
import { z } from "zod"

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const hhmmSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const optionalTimeSchema = z.union([hhmmSchema, z.literal(""), z.null()]).optional()
const optionalEndTimeSchema = z.union([hhmmSchema, z.literal(""), z.null()]).optional()

function toOptionalLooseString(value: unknown) {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === "string") {
    return value.trim()
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return undefined
}

function normalizeIncomingAiTask(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value
  }

  const normalizedTask = { ...(value as Record<string, unknown>) }

  if (
    (typeof normalizedTask.taskName !== "string" || !normalizedTask.taskName.trim()) &&
    typeof normalizedTask.title === "string"
  ) {
    normalizedTask.taskName = normalizedTask.title
  }

  return normalizedTask
}

const optionalLooseStringSchema = z.preprocess(
  toOptionalLooseString,
  z.string().optional(),
)
const aiTaskShape = {
  taskName: z.string().trim().min(1),
  date: isoDateSchema,
  taskType: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().toLowerCase() === "deadline"
        ? "deadline"
        : "event",
    z.enum(["event", "deadline"]),
  ),
  startTime: optionalTimeSchema,
  endTime: optionalEndTimeSchema,
  location: optionalLooseStringSchema,
  reminder: optionalLooseStringSchema,
  priority: optionalLooseStringSchema,
  sourceMessageId: optionalLooseStringSchema,
  isExpired: z.preprocess(
    (value) => value === true || value === "true",
    z.boolean(),
  ),
}

function createAiTaskSchema({ requireSourceMessageId }: { requireSourceMessageId: boolean }) {
  return z.preprocess(
    normalizeIncomingAiTask,
    z
    .object(aiTaskShape)
    .passthrough()
    .superRefine((task, ctx) => {
      const startTime =
        typeof task.startTime === "string" ? task.startTime.trim() : ""
      const endTime =
        typeof task.endTime === "string" ? task.endTime.trim() : ""
      const sourceMessageId =
        typeof task.sourceMessageId === "string" ? task.sourceMessageId.trim() : ""

      if (requireSourceMessageId && !sourceMessageId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "group_parse 任务必须提供 sourceMessageId",
          path: ["sourceMessageId"],
        })
      }

      if (task.taskType === "deadline") {
        if (!startTime && !endTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "deadline 任务至少需要一个截止时间",
            path: ["startTime"],
          })
        }
        return
      }

      if (!startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "普通任务必须提供 startTime",
          path: ["startTime"],
        })
      }
    }),
  )
}

export const AiTaskSchema = createAiTaskSchema({ requireSourceMessageId: false })
export const GroupAiTaskSchema = createAiTaskSchema({ requireSourceMessageId: true })

export const SingleTaskEnvelopeSchema = z.object({
  task: AiTaskSchema,
})

export const GroupTaskEnvelopeSchema = z.object({
  tasks: z.array(GroupAiTaskSchema),
})

export const ChatRouteRequestSchema = z.object({
  scene: z.enum(["quick_task", "group_parse", "habit_schedule"]),
  input: z.string().trim().min(1),
  context: z.object({
    nowIso: z.string().trim().min(1),
    timezone: z.string().trim().min(1),
    habits: z
      .array(
        z.object({
          id: z.string().trim().min(1),
          content: z.string().trim().min(1),
        }),
      )
      .optional(),
    tasks: z
      .array(
        z.object({
          title: z.string().trim().min(1),
          date: z.string().trim().min(1),
          time: z.string().trim().min(1),
          endTime: z.string().trim().optional(),
        }),
      )
      .optional(),
    courses: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          dayOfWeek: z.number().int().min(1).max(7),
          startTime: z.string().trim().min(1),
          endTime: z.string().trim().min(1),
          location: z.string().trim().min(1),
        }),
      )
      .optional(),
    currentSchedule: z
      .object({
        date: z.string().trim().min(1),
        tasks: z
          .array(
            z.object({
              title: z.string().trim().min(1),
              date: z.string().trim().min(1),
              time: z.string().trim().min(1),
              endTime: z.string().trim().optional(),
            }),
          )
          .optional(),
        courses: z
          .array(
            z.object({
              name: z.string().trim().min(1),
              dayOfWeek: z.number().int().min(1).max(7),
              startTime: z.string().trim().min(1),
              endTime: z.string().trim().min(1),
              location: z.string().trim().min(1),
            }),
          )
          .optional(),
      })
      .optional(),
  }),
})

export function getEnvelopeSchema(scene: AiScene) {
  return scene === "group_parse" ? GroupTaskEnvelopeSchema : SingleTaskEnvelopeSchema
}

export function normalizeTaskShape(
  task: z.infer<typeof AiTaskSchema> | z.infer<typeof GroupAiTaskSchema>,
): AiTask {
  const normalizedTaskType = task.taskType ?? "event"
  const normalizedStartTime =
    typeof task.startTime === "string" ? task.startTime.trim() : ""
  const normalizedEndTime =
    typeof task.endTime === "string" ? task.endTime.trim() : ""
  const normalizedLocation =
    typeof task.location === "string" ? task.location.trim() : ""
  const normalizedReminder =
    typeof task.reminder === "string" ? task.reminder.trim() : ""
  const normalizedSourceMessageId =
    typeof task.sourceMessageId === "string" ? task.sourceMessageId.trim() : ""
  return normalizeAiTask({
    taskName: task.taskName.trim(),
    date: task.date.trim(),
    startTime: normalizedStartTime || normalizedEndTime,
    endTime:
      normalizedTaskType === "deadline"
        ? normalizedEndTime || normalizedStartTime
        : normalizedEndTime || undefined,
    location: normalizedLocation,
    taskType: normalizedTaskType,
    reminder: normalizedReminder === "30m" ? "30m" : undefined,
    sourceMessageId: normalizedSourceMessageId || undefined,
    endTimeInferred:
      normalizedTaskType === "deadline" ? false : !normalizedEndTime,
    isExpired: task.isExpired ?? false,
  })
}
