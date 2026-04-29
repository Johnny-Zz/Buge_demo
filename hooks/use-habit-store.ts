"use client"

import { create } from "zustand"

export interface Habit {
  id: string
  icon: string
  content: string
}

interface HabitStore {
  habits: Habit[]
  addHabit: (habit: Omit<Habit, "id">) => void
  updateHabit: (habitId: string, updates: Partial<Omit<Habit, "id">>) => void
  removeHabit: (habitId: string) => void
  setHabits: (habits: Habit[]) => void
}

const DEFAULT_HABITS: Habit[] = [
  {
    id: "habit-1",
    icon: "🎯",
    content: "晚间运动习惯：健身通常安排在 21:00-22:00",
  },
]

export const useHabitStore = create<HabitStore>((set) => ({
  habits: DEFAULT_HABITS,
  addHabit: (habit) =>
    set((state) => ({
      habits: [
        ...state.habits,
        {
          id: `habit-${Date.now()}`,
          icon: habit.icon,
          content: habit.content,
        },
      ],
    })),
  updateHabit: (habitId, updates) =>
    set((state) => ({
      habits: state.habits.map((habit) =>
        habit.id === habitId ? { ...habit, ...updates } : habit,
      ),
    })),
  removeHabit: (habitId) =>
    set((state) => ({
      habits: state.habits.filter((habit) => habit.id !== habitId),
    })),
  setHabits: (habits) => set({ habits }),
}))
