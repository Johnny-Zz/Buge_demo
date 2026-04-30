import { normalizeAiTask } from "@/lib/ai/date"
import type { AiAgentCommand, AiScene, AiTask } from "@/lib/ai/types"
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

function normalizeIncomingAgentCommand(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value
  }

  const normalizedCommand = { ...(value as Record<string, unknown>) }

  if (
    (typeof normalizedCommand.targetId !== "string" || !normalizedCommand.targetId.trim()) &&
    typeof normalizedCommand.taskId === "string"
  ) {
    normalizedCommand.targetId = normalizedCommand.taskId
    normalizedCommand.targetType = normalizedCommand.targetType || "task"
  }

  if (
    (typeof normalizedCommand.targetId !== "string" || !normalizedCommand.targetId.trim()) &&
    typeof normalizedCommand.courseId === "string"
  ) {
    normalizedCommand.targetId = normalizedCommand.courseId
    normalizedCommand.targetType = normalizedCommand.targetType || "course"
  }

  if (
    (typeof normalizedCommand.message !== "string" || !normalizedCommand.message.trim()) &&
    typeof normalizedCommand.reply === "string"
  ) {
    normalizedCommand.message = normalizedCommand.reply
  }

  return normalizedCommand
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

const taskContextSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  date: z.string().trim().min(1),
  time: z.string().trim().min(1),
  endTime: z.string().trim().optional(),
})

const courseContextSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
  location: z.string().trim().min(1),
})

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

export const GroupTaskEnvelopeSchema = z.object({
  tasks: z.array(GroupAiTaskSchema),
})

export const AgentCommandEnvelopeSchema = z.preprocess(
  normalizeIncomingAgentCommand,
  z
  .object({
    action: z.enum(["create", "update", "delete", "query", "chat"]),
    targetType: z.enum(["task", "course"]).optional(),
    targetId: z.string().trim().min(1).optional(),
    message: optionalLooseStringSchema,
    task: AiTaskSchema.optional(),
  })
  .superRefine((command, ctx) => {
    if (command.action === "create" && !command.task) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "create 动作必须提供 task",
        path: ["task"],
      })
    }

    if (command.action === "update") {
      if (!command.targetId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "update 动作必须提供 targetId",
          path: ["targetId"],
        })
      }

      if (!command.task) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "update 动作必须提供 task",
          path: ["task"],
        })
      }
    }

    if (command.action === "delete" && !command.targetId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "delete 动作必须提供 targetId",
        path: ["targetId"],
      })
    }

    if (
      (command.action === "query" || command.action === "chat") &&
      !command.message?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "query/chat 动作必须提供 message",
        path: ["message"],
      })
    }
  }),
)

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
    tasks: z.array(taskContextSchema).optional(),
    courses: z.array(courseContextSchema).optional(),
    currentSchedule: z
      .object({
        date: z.string().trim().min(1),
        tasks: z.array(taskContextSchema).optional(),
        courses: z.array(courseContextSchema).optional(),
      })
      .optional(),
  }),
})

export function getEnvelopeSchema(scene: AiScene) {
  return scene === "group_parse" ? GroupTaskEnvelopeSchema : AgentCommandEnvelopeSchema
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

export function normalizeAgentCommand(command: z.infer<typeof AgentCommandEnvelopeSchema>): AiAgentCommand {
  return {
    action: command.action,
    targetType: command.targetType,
    targetId: command.targetId?.trim() || undefined,
    message: command.message?.trim() || undefined,
    task: command.task ? normalizeTaskShape(command.task) : undefined,
  }
}
