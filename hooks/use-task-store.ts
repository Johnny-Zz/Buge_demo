"use client"

import { create } from "zustand"

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
      return { tasks: [...state.tasks, task] }
    }),
  addTasks: (tasks) =>
    set((state) => {
      const newTasks = tasks.filter(
        (task) => !state.tasks.some((t) => t.id === task.id)
      )
      return { tasks: [...state.tasks, ...newTasks] }
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
