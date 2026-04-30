export type AiScene = "quick_task" | "group_parse" | "habit_schedule"
export type AiTaskType = "event" | "deadline"
export type AiReminder = "30m"
export type AiAction = "create" | "update" | "delete" | "query" | "chat"
export type AiTargetType = "task" | "course"

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
  id: string
  title: string
  date: string
  time: string
  endTime?: string
}

export interface CourseContext {
  id: string
  name: string
  dayOfWeek: number
  startTime: string
  endTime: string
  location: string
}

export interface AiAgentCommand {
  action: AiAction
  targetType?: AiTargetType
  targetId?: string
  message?: string
  task?: AiTask
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
  | { ok: true; scene: AiScene; data: AiAgentCommand | AiTask[] }
  | { ok: false; error: { code: string; message: string } }
