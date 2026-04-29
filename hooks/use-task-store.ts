"use client"

import { create } from "zustand"

export const DEFAULT_TASK_DURATION_MINUTES = 60
export const BUFFER_WARNING_MINUTES = 10

// Helper to convert time string to minutes for comparison
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + (minutes || 0)
}

export function getTaskEndMinutes(startTime: string, endTime?: string): number {
  const startMinutes = timeToMinutes(startTime)

  if (!endTime) {
    return startMinutes + DEFAULT_TASK_DURATION_MINUTES
  }

  return timeToMinutes(endTime)
}

export function hasTimeOverlap(
  rangeA: { startTime: string; endTime?: string },
  rangeB: { startTime: string; endTime?: string },
): boolean {
  const startA = timeToMinutes(rangeA.startTime)
  const endA = getTaskEndMinutes(rangeA.startTime, rangeA.endTime)
  const startB = timeToMinutes(rangeB.startTime)
  const endB = getTaskEndMinutes(rangeB.startTime, rangeB.endTime)

  return startA < endB && endA > startB
}

export function getTimeGapMinutes(
  rangeA: { startTime: string; endTime?: string },
  rangeB: { startTime: string; endTime?: string },
): number | null {
  if (hasTimeOverlap(rangeA, rangeB)) {
    return null
  }

  const startA = timeToMinutes(rangeA.startTime)
  const endA = getTaskEndMinutes(rangeA.startTime, rangeA.endTime)
  const startB = timeToMinutes(rangeB.startTime)
  const endB = getTaskEndMinutes(rangeB.startTime, rangeB.endTime)

  if (endA <= startB) {
    return startB - endA
  }

  if (endB <= startA) {
    return startA - endB
  }

  return null
}

export function hasTightBuffer(
  rangeA: { startTime: string; endTime?: string },
  rangeB: { startTime: string; endTime?: string },
  bufferMinutes = BUFFER_WARNING_MINUTES,
): boolean {
  const gapMinutes = getTimeGapMinutes(rangeA, rangeB)
  return gapMinutes !== null && gapMinutes < bufferMinutes
}

export function getOverlappingTaskIds(tasks: Task[]): Set<string> {
  const overlappingTaskIds = new Set<string>()

  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const taskA = tasks[i]
      const taskB = tasks[j]

      if (taskA.date !== taskB.date) {
        continue
      }

      if (
        hasTimeOverlap(
          { startTime: taskA.time, endTime: taskA.endTime },
          { startTime: taskB.time, endTime: taskB.endTime },
        )
      ) {
        overlappingTaskIds.add(taskA.id)
        overlappingTaskIds.add(taskB.id)
      }
    }
  }

  return overlappingTaskIds
}

// Sort tasks by date and time
export function sortTasksByTime(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // First compare by date
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date)
    }
    // Then by time
    return timeToMinutes(a.time) - timeToMinutes(b.time)
  })
}

// Check if a new task conflicts with existing tasks (same date, overlapping time)
export function checkTaskConflict(
  newTask: { date: string; time: string; endTime?: string },
  existingTasks: Task[],
  excludeId?: string
): Task | null {
  for (const task of existingTasks) {
    if (excludeId && task.id === excludeId) continue
    if (task.date !== newTask.date) continue

    if (
      hasTimeOverlap(
        { startTime: newTask.time, endTime: newTask.endTime },
        { startTime: task.time, endTime: task.endTime },
      )
    ) {
      return task
    }
  }
  return null
}

// Check for buffer time warning (gap less than 10 minutes but not overlapping)
export function checkTaskBufferWarning(
  newTask: { date: string; time: string; endTime?: string },
  existingTasks: Task[],
  excludeId?: string
): { task: Task; type: 'before' | 'after' } | null {
  for (const task of existingTasks) {
    if (excludeId && task.id === excludeId) continue
    if (task.date !== newTask.date) continue

    if (
      hasTightBuffer(
        { startTime: newTask.time, endTime: newTask.endTime },
        { startTime: task.time, endTime: task.endTime },
      )
    ) {
      const newStart = timeToMinutes(newTask.time)
      const existingStart = timeToMinutes(task.time)

      if (existingStart < newStart) {
        return { task, type: 'after' }
      }

      return { task, type: 'before' }
    }
  }
  return null
}

export interface Attachment {
  id: string
  name: string
  type: "image" | "document" | "link"
  preview?: string // URL or placeholder
}

export interface Task {
  id: string
  title: string
  date: string  // Format: "04-22", "04-23"
  time: string
  endTime?: string
  location?: string
  sourceMessageId?: string
  isExpired?: boolean
  priority: "P0" | "P1" | "P2"
  hasWarning?: boolean
  warningText?: string
  insight?: string
  notes?: string
  attachments?: Attachment[]
}

interface TaskStore {
  tasks: Task[]
  inboxTasks: Task[]
  processedMessageIds: string[]
  addTask: (task: Task) => void
  addTasks: (tasks: Task[]) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  removeTask: (taskId: string) => void
  clearTasks: () => void
  hasTask: (taskId: string) => boolean
  findTaskByTitle: (title: string) => Task | undefined
  markMessageAsProcessed: (messageId: string) => void
  // Inbox methods
  addToInbox: (task: Task) => void
  removeFromInbox: (taskId: string) => void
  updateInboxTask: (taskId: string, updates: Partial<Task>) => void
  moveFromInboxToSchedule: (taskId: string, scheduleData?: { date: string; time: string }) => void
  clearInbox: () => void
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  inboxTasks: [],
  processedMessageIds: [],
  addTask: (task) =>
    set((state) => {
      // Prevent duplicates
      if (state.tasks.some((t) => t.id === task.id)) {
        return state
      }
      // Auto-sort when adding
      return { tasks: sortTasksByTime([...state.tasks, task]) }
    }),
  addTasks: (tasks) =>
    set((state) => {
      const newTasks = tasks.filter(
        (task) => !state.tasks.some((t) => t.id === task.id)
      )
      return { tasks: sortTasksByTime([...state.tasks, ...newTasks]) }
    }),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    })),
  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    })),
  clearTasks: () => set({ tasks: [] }),
  hasTask: (taskId) => get().tasks.some((t) => t.id === taskId),
  findTaskByTitle: (title) => get().tasks.find((t) => t.title === title),
  markMessageAsProcessed: (messageId) =>
    set((state) => {
      const normalizedMessageId = messageId.trim()

      if (!normalizedMessageId || state.processedMessageIds.includes(normalizedMessageId)) {
        return state
      }

      return {
        processedMessageIds: [...state.processedMessageIds, normalizedMessageId],
      }
    }),
  // Inbox methods
  addToInbox: (task) =>
    set((state) => {
      if (state.inboxTasks.some((t) => t.id === task.id)) {
        return state
      }
      return { inboxTasks: [...state.inboxTasks, task] }
    }),
  removeFromInbox: (taskId) =>
    set((state) => ({
      inboxTasks: state.inboxTasks.filter((t) => t.id !== taskId),
    })),
  updateInboxTask: (taskId, updates) =>
    set((state) => ({
      inboxTasks: state.inboxTasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    })),
  moveFromInboxToSchedule: (taskId, scheduleData) =>
    set((state) => {
      const task = state.inboxTasks.find((t) => t.id === taskId)
      if (!task) return state
      const updatedTask = scheduleData 
        ? { ...task, date: scheduleData.date, time: scheduleData.time }
        : task
      return {
        inboxTasks: state.inboxTasks.filter((t) => t.id !== taskId),
        tasks: [...state.tasks, updatedTask],
        processedMessageIds:
          updatedTask.sourceMessageId &&
          !state.processedMessageIds.includes(updatedTask.sourceMessageId)
            ? [...state.processedMessageIds, updatedTask.sourceMessageId]
            : state.processedMessageIds,
      }
    }),
  clearInbox: () => set({ inboxTasks: [] }),
}))
