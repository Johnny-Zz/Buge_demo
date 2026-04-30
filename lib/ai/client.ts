import { getClientNowIso, getClientTimezone, isoDateToMmDd, mmDdToIso, normalizeAiTask } from "@/lib/ai/date"
import type { AiAgentCommand, AiScene, AiTask, ChatRouteRequest, ChatRouteResponse } from "@/lib/ai/types"
import type { Course } from "@/hooks/use-course-store"
import type { Habit } from "@/hooks/use-habit-store"
import type { Task } from "@/hooks/use-task-store"

interface BuildAiContextOptions {
  habits?: Habit[]
  tasks?: Task[]
  courses?: Course[]
  nowIso?: string
  timezone?: string
}

function formatIsoDateForTimezone(nowIso: string, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const parts = formatter.formatToParts(new Date(nowIso))
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (year && month && day) {
    return `${year}-${month}-${day}`
  }

  return formatter.format(new Date(nowIso))
}

function getDayOfWeekForTimezone(nowIso: string, timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  })
  const weekday = formatter.format(new Date(nowIso))
  const weekDayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  }

  const fallbackWeekday = new Date(nowIso).getDay()
  return weekDayMap[weekday] ?? (fallbackWeekday === 0 ? 7 : fallbackWeekday)
}

export function buildAiContext({
  habits = [],
  tasks = [],
  courses = [],
  nowIso = getClientNowIso(),
  timezone = getClientTimezone(),
}: BuildAiContextOptions): ChatRouteRequest["context"] {
  const currentScheduleDate = formatIsoDateForTimezone(nowIso, timezone)
  const currentScheduleDayOfWeek = getDayOfWeekForTimezone(nowIso, timezone)
  const currentScheduleTasks = tasks
    .filter((task) => mmDdToIso(task.date, nowIso) === currentScheduleDate)
    .map((task) => ({
      id: task.id,
      title: task.title,
      date: mmDdToIso(task.date, nowIso),
      time: task.time,
      endTime: task.endTime,
    }))
  const currentScheduleCourses = courses
    .filter((course) => course.dayOfWeek === currentScheduleDayOfWeek)
    .map((course) => ({
      id: course.id,
      name: course.name,
      dayOfWeek: course.dayOfWeek,
      startTime: course.startTime,
      endTime: course.endTime,
      location: course.location,
    }))

  return {
    nowIso,
    timezone,
    habits: habits.map((habit) => ({
      id: habit.id,
      content: habit.content,
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      date: mmDdToIso(task.date, nowIso),
      time: task.time,
      endTime: task.endTime,
    })),
    courses: courses.map((course) => ({
      id: course.id,
      name: course.name,
      dayOfWeek: course.dayOfWeek,
      startTime: course.startTime,
      endTime: course.endTime,
      location: course.location,
    })),
    currentSchedule: {
      date: currentScheduleDate,
      tasks: currentScheduleTasks,
      courses: currentScheduleCourses,
    },
  }
}

export async function callBugeAi(request: ChatRouteRequest): Promise<AiAgentCommand | AiTask[]> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  const raw = await response.text()
  let payload: ChatRouteResponse | null = null

  try {
    payload = JSON.parse(raw) as ChatRouteResponse
  } catch {
    if (!response.ok) {
      throw new Error(raw || "AI 服务暂时不可用")
    }

    throw new Error("AI 响应不是合法 JSON")
  }

  if (!payload) {
    throw new Error("AI 解析失败")
  }

  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? "AI 解析失败" : payload.error.message)
  }

  return payload.data
}

export function aiTaskToStoreTask(task: AiTask, idPrefix = "ai"): Task {
  const normalized = normalizeAiTask(task)

  return {
    id: `${idPrefix}-${normalized.taskName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: normalized.taskName,
    date: isoDateToMmDd(normalized.date),
    time: normalized.startTime,
    endTime: normalized.endTime,
    location: normalized.location || undefined,
    priority: "P1",
    reminder: normalized.reminder,
    isExpired: normalized.isExpired ?? false,
    sourceMessageId: normalized.sourceMessageId,
  }
}

export function createChatRouteRequest(
  scene: AiScene,
  input: string,
  context: ChatRouteRequest["context"],
): ChatRouteRequest {
  return {
    scene,
    input,
    context,
  }
}
