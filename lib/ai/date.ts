import type { AiTask } from "@/lib/ai/types"

export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const [hours, minutes] = time.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes + minutesToAdd
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440
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

  return {
    taskName: task.taskName.trim(),
    date: task.date.trim(),
    startTime: task.startTime.trim(),
    endTime: task.endTime.trim(),
    location: normalizedLocation,
  }
}
