"use client"

import { create } from "zustand"

// Helper to convert time string to minutes for comparison
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + (minutes || 0)
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
  const newStart = timeToMinutes(newTask.time)
  // Assume 1 hour duration if no endTime provided
  const newEnd = newTask.endTime ? timeToMinutes(newTask.endTime) : newStart + 60
  
  for (const task of existingTasks) {
    if (excludeId && task.id === excludeId) continue
    if (task.date !== newTask.date) continue
    
    const existingStart = timeToMinutes(task.time)
    // Assume 1 hour duration for existing tasks
    const existingEnd = task.endTime ? timeToMinutes(task.endTime) : existingStart + 60
    
    // Check for overlap
    if (newStart < existingEnd && newEnd > existingStart) {
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
  const BUFFER_MINUTES = 10
  const newStart = timeToMinutes(newTask.time)
  const newEnd = newTask.endTime ? timeToMinutes(newTask.endTime) : newStart + 60
  
  for (const task of existingTasks) {
    if (excludeId && task.id === excludeId) continue
    if (task.date !== newTask.date) continue
    
    const existingStart = timeToMinutes(task.time)
    const existingEnd = task.endTime ? timeToMinutes(task.endTime) : existingStart + 60
    
    // Check if gap before new task is less than 10 min (existing ends right before new starts)
    if (existingEnd <= newStart && newStart - existingEnd < BUFFER_MINUTES) {
      return { task, type: 'after' }
    }
    
    // Check if gap after new task is less than 10 min (new ends right before existing starts)
    if (newEnd <= existingStart && existingStart - newEnd < BUFFER_MINUTES) {
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
  addTask: (task: Task) => void
  addTasks: (tasks: Task[]) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  removeTask: (taskId: string) => void
  clearTasks: () => void
  hasTask: (taskId: string) => boolean
  findTaskByTitle: (title: string) => Task | undefined
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
      }
    }),
  clearInbox: () => set({ inboxTasks: [] }),
}))
