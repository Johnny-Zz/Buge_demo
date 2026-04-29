import type { AiScene, AiTask } from "@/lib/ai/types"
import { z } from "zod"

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const hhmmSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const optionalTimeSchema = z.union([hhmmSchema, z.literal(""), z.null()]).optional()
const optionalEndTimeSchema = z.union([hhmmSchema, z.literal(""), z.null()]).optional()
const optionalLocationSchema = z.union([z.string(), z.null()]).optional()
const aiTaskShape = {
  taskName: z.string().trim().min(1),
  date: isoDateSchema,
  taskType: z.enum(["event", "deadline"]).optional().default("event"),
  startTime: optionalTimeSchema,
  endTime: optionalEndTimeSchema,
  location: optionalLocationSchema,
  sourceMessageId: z.string().trim().min(1).optional(),
  isExpired: z.boolean().optional().default(false),
}

function createAiTaskSchema({ requireSourceMessageId }: { requireSourceMessageId: boolean }) {
  return z
    .object({
      ...aiTaskShape,
      sourceMessageId: requireSourceMessageId
        ? z.string().trim().min(1)
        : aiTaskShape.sourceMessageId,
    })
    .superRefine((task, ctx) => {
      const startTime =
        typeof task.startTime === "string" ? task.startTime.trim() : ""
      const endTime =
        typeof task.endTime === "string" ? task.endTime.trim() : ""

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
    })
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
  const normalizedSourceMessageId =
    typeof task.sourceMessageId === "string" ? task.sourceMessageId.trim() : ""
  const effectiveStartTime = normalizedStartTime || normalizedEndTime
  const effectiveEndTime =
    normalizedTaskType === "deadline"
      ? normalizedEndTime || effectiveStartTime
      : normalizedEndTime || undefined

  return {
    taskName: task.taskName.trim(),
    date: task.date.trim(),
    startTime: effectiveStartTime,
    endTime: effectiveEndTime,
    location: normalizedLocation,
    taskType: normalizedTaskType,
    sourceMessageId: normalizedSourceMessageId || undefined,
    endTimeInferred:
      normalizedTaskType === "deadline" ? false : !normalizedEndTime,
    isExpired: task.isExpired ?? false,
  }
}
