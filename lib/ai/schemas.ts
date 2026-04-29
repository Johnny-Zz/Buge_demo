import type { AiScene, AiTask } from "@/lib/ai/types"
import { z } from "zod"

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const hhmmSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const optionalEndTimeSchema = z.union([hhmmSchema, z.literal(""), z.null()]).optional()
const optionalLocationSchema = z.union([z.string(), z.null()]).optional()

export const AiTaskSchema = z.object({
  taskName: z.string().trim().min(1),
  date: isoDateSchema,
  startTime: hhmmSchema,
  endTime: optionalEndTimeSchema,
  location: optionalLocationSchema,
  isExpired: z.boolean().optional().default(false),
})

export const SingleTaskEnvelopeSchema = z.object({
  task: AiTaskSchema,
})

export const GroupTaskEnvelopeSchema = z.object({
  tasks: z.array(AiTaskSchema),
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
  }),
})

export function getEnvelopeSchema(scene: AiScene) {
  return scene === "group_parse" ? GroupTaskEnvelopeSchema : SingleTaskEnvelopeSchema
}

export function normalizeTaskShape(task: z.infer<typeof AiTaskSchema>): AiTask {
  const normalizedEndTime =
    typeof task.endTime === "string" ? task.endTime.trim() : ""
  const normalizedLocation =
    typeof task.location === "string" ? task.location.trim() : ""

  return {
    taskName: task.taskName.trim(),
    date: task.date.trim(),
    startTime: task.startTime.trim(),
    endTime: normalizedEndTime || undefined,
    location: normalizedLocation,
    endTimeInferred: !normalizedEndTime,
    isExpired: task.isExpired ?? false,
  }
}
