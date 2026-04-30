import type { AiTask } from "@/lib/ai/types"

export const DEADLINE_PREP_MINUTES = 30

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const totalMinutes = timeToMinutes(time) + minutesToAdd
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440
  const nextHours = String(Math.floor(normalizedMinutes / 60)).padStart(2, "0")
  const nextMinutes = String(normalizedMinutes % 60).padStart(2, "0")
  return `${nextHours}:${nextMinutes}`
}

export function subtractMinutesFromTimeClamped(
  time: string,
  minutesToSubtract: number,
): string {
  const normalizedMinutes = Math.max(0, timeToMinutes(time) - minutesToSubtract)
  const nextHours = String(Math.floor(normalizedMinutes / 60)).padStart(2, "0")
  const nextMinutes = String(normalizedMinutes % 60).padStart(2, "0")
  return `${nextHours}:${nextMinutes}`
}

export function isoDateToMmDd(isoDate: string): string {
  return isoDate.slice(5)
}

export function mmDdToIso(mmDd: string, nowIso: string): string {
  const year = new Date(nowIso).getFullYear()
  return `${year}-${mmDd}`
}

export function getClientTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai"
}

export function getClientNowIso(): string {
  return new Date().toISOString()
}

export function normalizeAiTask(task: AiTask): AiTask {
  const normalizedLocation = task.location?.trim() || ""
  const normalizedTaskType = task.taskType ?? "event"
  const normalizedStartTime = task.startTime.trim()
  const normalizedEndTime = task.endTime?.trim() || undefined
  const normalizedSourceMessageId = task.sourceMessageId?.trim() || undefined
  const shouldExpandDeadlineWindow =
    normalizedTaskType === "deadline" ||
    (normalizedEndTime !== undefined && normalizedStartTime === normalizedEndTime)
  const deadlineEndTime = normalizedEndTime || normalizedStartTime
  const effectiveStartTime =
    shouldExpandDeadlineWindow && deadlineEndTime
      ? normalizedStartTime && normalizedStartTime !== deadlineEndTime
        ? normalizedStartTime
        : subtractMinutesFromTimeClamped(deadlineEndTime, DEADLINE_PREP_MINUTES)
      : normalizedStartTime
  const effectiveEndTime =
    shouldExpandDeadlineWindow && deadlineEndTime
      ? deadlineEndTime
      : normalizedEndTime

  return {
    taskName: task.taskName.trim(),
    date: task.date.trim(),
    startTime: effectiveStartTime,
    endTime: effectiveEndTime,
    location: normalizedLocation,
    taskType: normalizedTaskType,
    reminder: shouldExpandDeadlineWindow ? "30m" : task.reminder,
    sourceMessageId: normalizedSourceMessageId,
    endTimeInferred: task.endTimeInferred ?? !effectiveEndTime,
    isExpired: task.isExpired ?? false,
  }
}
