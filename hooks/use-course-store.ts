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

function hasCourseTimeOverlap(
  rangeA: { startTime: string; endTime: string },
  rangeB: { startTime: string; endTime: string },
): boolean {
  const startA = timeToMinutes(rangeA.startTime)
  const endA = timeToMinutes(rangeA.endTime)
  const startB = timeToMinutes(rangeB.startTime)
  const endB = timeToMinutes(rangeB.endTime)
  const isInstantA = startA === endA
  const isInstantB = startB === endB

  if (isInstantA && isInstantB) {
    return startA === startB
  }

  if (isInstantA) {
    return startA >= startB && startA <= endB
  }

  if (isInstantB) {
    return startB >= startA && startB <= endA
  }

  return startA < endB && endA > startB
}

// Sort courses by start time
function sortCoursesByTime(courses: Course[]): Course[] {
  return [...courses].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

// Check if two courses have overlapping time blocks
export function checkCourseConflict(newCourse: { startTime: string; endTime: string; dayOfWeek?: number }, existingCourses: Course[], excludeId?: string): Course | null {
  const dayOfWeek = newCourse.dayOfWeek ?? 1
  
  for (const course of existingCourses) {
    if (excludeId && course.id === excludeId) continue
    if (course.dayOfWeek !== dayOfWeek) continue

    if (
      hasCourseTimeOverlap(
        { startTime: newCourse.startTime, endTime: newCourse.endTime },
        { startTime: course.startTime, endTime: course.endTime },
      )
    ) {
      return course // Return the conflicting course
    }
  }
  return null
}

// Check for buffer time warning (gap less than 10 minutes but not overlapping)
export function checkCourseBufferWarning(
  newTask: { startTime: string; endTime: string; dayOfWeek: number },
  existingCourses: Course[],
  excludeId?: string
): { course: Course; type: 'before' | 'after' } | null {
  const BUFFER_MINUTES = 10
  const newStart = timeToMinutes(newTask.startTime)
  const newEnd = timeToMinutes(newTask.endTime)
  
  for (const course of existingCourses) {
    if (excludeId && course.id === excludeId) continue
    if (course.dayOfWeek !== newTask.dayOfWeek) continue
    
    const existingStart = timeToMinutes(course.startTime)
    const existingEnd = timeToMinutes(course.endTime)
    
    // Check if gap before new task is less than 10 min (course ends right before new starts)
    if (existingEnd <= newStart && newStart - existingEnd < BUFFER_MINUTES) {
      return { course, type: 'after' }
    }
    
    // Check if gap after new task is less than 10 min (new ends right before course starts)
    if (newEnd <= existingStart && existingStart - newEnd < BUFFER_MINUTES) {
      return { course, type: 'before' }
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

// Realistic university course schedule (anonymized)
const DEFAULT_COURSES: Course[] = [
  { id: "c1", name: "高等数学", dayOfWeek: 1, startTime: "08:00", endTime: "09:40", location: "主教学楼417" },
  { id: "c2", name: "专业基础数学", dayOfWeek: 1, startTime: "14:00", endTime: "17:40", location: "主教学楼324" },
  { id: "c3", name: "公共政治课", dayOfWeek: 1, startTime: "19:00", endTime: "21:30", location: "主教学楼413" },
  { id: "c4", name: "算法核心实验", dayOfWeek: 2, startTime: "08:00", endTime: "11:40", location: "主教学楼503" },
  { id: "c5", name: "体育选修", dayOfWeek: 2, startTime: "16:00", endTime: "17:40", location: "体育馆B区" },
  { id: "c6", name: "计算机硬件基础", dayOfWeek: 2, startTime: "19:00", endTime: "21:30", location: "主教学楼409" },
  { id: "c7", name: "硬件基础实验", dayOfWeek: 3, startTime: "08:00", endTime: "11:40", location: "主教学楼503" },
  { id: "c8", name: "高等数学", dayOfWeek: 3, startTime: "14:00", endTime: "17:40", location: "主教学楼429" },
  { id: "c9", name: "概率统计基础", dayOfWeek: 3, startTime: "19:00", endTime: "21:30", location: "主教学楼414" },
  { id: "c10", name: "安全理论课", dayOfWeek: 4, startTime: "08:00", endTime: "11:40", location: "主教学楼401" },
  { id: "c11", name: "职业发展指导", dayOfWeek: 4, startTime: "16:00", endTime: "17:40", location: "综合楼108" },
  { id: "c12", name: "职业发展指导", dayOfWeek: 4, startTime: "19:00", endTime: "20:40", location: "综合楼108" },
  { id: "c13", name: "算法理论课", dayOfWeek: 5, startTime: "10:00", endTime: "11:40", location: "主教学楼412" },
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
  
  // Get today's courses based on real current day
  getTodayCourses: () => {
    const now = new Date()
    // JavaScript: Sunday = 0, Monday = 1, ..., Saturday = 6
    // Our format: Monday = 1, ..., Sunday = 7
    const jsDay = now.getDay()
    const today = jsDay === 0 ? 7 : jsDay // Convert Sunday from 0 to 7
    return get().courses.filter((c) => c.dayOfWeek === today)
  },
}))
