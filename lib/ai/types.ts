export type AiScene = "quick_task" | "group_parse" | "habit_schedule"
export type AiTaskType = "event" | "deadline"
export type AiReminder = "30m"

export interface AiTask {
  taskName: string
  date: string
  startTime: string
  endTime?: string
  location?: string
  taskType?: AiTaskType
  reminder?: AiReminder
  sourceMessageId?: string
  endTimeInferred?: boolean
  isExpired?: boolean
}

export interface HabitContext {
  id: string
  content: string
}

export interface TaskContext {
  title: string
  date: string
  time: string
  endTime?: string
}

export interface CourseContext {
  name: string
  dayOfWeek: number
  startTime: string
  endTime: string
  location: string
}

export interface ChatRouteRequest {
  scene: AiScene
  input: string
  context: {
    nowIso: string
    timezone: string
    habits?: HabitContext[]
    tasks?: TaskContext[]
    courses?: CourseContext[]
    currentSchedule?: {
      date: string
      tasks?: TaskContext[]
      courses?: CourseContext[]
    }
  }
}

export type ChatRouteResponse =
  | { ok: true; scene: AiScene; data: AiTask | AiTask[] }
  | { ok: false; error: { code: string; message: string } }
