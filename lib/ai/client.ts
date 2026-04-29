import { getClientNowIso, getClientTimezone, isoDateToMmDd, mmDdToIso, normalizeAiTask } from "@/lib/ai/date"
import type { AiScene, AiTask, ChatRouteRequest, ChatRouteResponse } from "@/lib/ai/types"
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

export function buildAiContext({
  habits = [],
  tasks = [],
  courses = [],
  nowIso = getClientNowIso(),
  timezone = getClientTimezone(),
}: BuildAiContextOptions): ChatRouteRequest["context"] {
  return {
    nowIso,
    timezone,
    habits: habits.map((habit) => ({
      id: habit.id,
      content: habit.content,
    })),
    tasks: tasks.map((task) => ({
      title: task.title,
      date: mmDdToIso(task.date, nowIso),
      time: task.time,
      endTime: task.endTime,
    })),
    courses: courses.map((course) => ({
      name: course.name,
      dayOfWeek: course.dayOfWeek,
      startTime: course.startTime,
      endTime: course.endTime,
      location: course.location,
    })),
  }
}

export async function callBugeAi(request: ChatRouteRequest): Promise<AiTask | AiTask[]> {
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
    isExpired: normalized.isExpired ?? false,
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
