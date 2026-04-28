"use client"

import { create } from "zustand"

export interface Course {
  id: string
  name: string
  startTime: string  // "08:00"
  endTime: string    // "09:40"
  location: string
  dayOfWeek: number  // 1 = Monday, 2 = Tuesday, etc.
}

// Helper to convert time string to minutes for comparison
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// Sort courses by start time
function sortCoursesByTime(courses: Course[]): Course[] {
  return [...courses].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

// Check if two courses have overlapping time blocks
export function checkCourseConflict(newCourse: { startTime: string; endTime: string; dayOfWeek?: number }, existingCourses: Course[], excludeId?: string): Course | null {
  const newStart = timeToMinutes(newCourse.startTime)
  const newEnd = timeToMinutes(newCourse.endTime)
  const dayOfWeek = newCourse.dayOfWeek ?? 1
  
  for (const course of existingCourses) {
    if (excludeId && course.id === excludeId) continue
    if (course.dayOfWeek !== dayOfWeek) continue
    
    const existingStart = timeToMinutes(course.startTime)
    const existingEnd = timeToMinutes(course.endTime)
    
    // Check for overlap: new starts before existing ends AND new ends after existing starts
    if (newStart < existingEnd && newEnd > existingStart) {
      return course // Return the conflicting course
    }
  }
  return null
}

interface CourseStore {
  courses: Course[]
  addCourse: (course: Course) => void
  updateCourse: (courseId: string, updates: Partial<Course>) => void
  removeCourse: (courseId: string) => void
  setCourses: (courses: Course[]) => void
  getTodayCourses: () => Course[]
}

// Default mock courses for today (Monday = 1)
const DEFAULT_COURSES: Course[] = [
  {
    id: "course-1",
    name: "数学分析 II",
    startTime: "08:00",
    endTime: "09:40",
    location: "教学楼417室",
    dayOfWeek: 1,
  },
  {
    id: "course-2",
    name: "网络空间安全数学基础",
    startTime: "14:00",
    endTime: "15:40",
    location: "教学楼324室",
    dayOfWeek: 1,
  },
]

export const useCourseStore = create<CourseStore>((set, get) => ({
  courses: DEFAULT_COURSES,
  
  addCourse: (course) =>
    set((state) => {
      if (state.courses.some((c) => c.id === course.id)) {
        return state
      }
      return { courses: sortCoursesByTime([...state.courses, course]) }
    }),
    
  updateCourse: (courseId, updates) =>
    set((state) => ({
      courses: state.courses.map((c) =>
        c.id === courseId ? { ...c, ...updates } : c
      ),
    })),
    
  removeCourse: (courseId) =>
    set((state) => ({
      courses: state.courses.filter((c) => c.id !== courseId),
    })),
    
  setCourses: (courses) => set({ courses: sortCoursesByTime(courses) }),
  
  // Get today's courses (assuming today is Monday = 1)
  getTodayCourses: () => {
    const today = 1 // Monday for demo
    return get().courses.filter((c) => c.dayOfWeek === today)
  },
}))
