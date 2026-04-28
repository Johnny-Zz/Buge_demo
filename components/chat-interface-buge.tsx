"use client"

import { useState, useRef } from "react"
import { ArrowLeft, Menu, Mic, Smile, Plus, Check, MapPin, Sparkles, Lightbulb, X, Send, Trash2, Edit3, ChevronDown, Pencil, StickyNote, Calendar, School, Loader2, Download, Settings, Inbox, ArrowRight, Clock, MessageSquare, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { useTaskStore, Task, checkTaskConflict } from "@/hooks/use-task-store"
import { useCourseStore, Course, checkCourseConflict } from "@/hooks/use-course-store"
import { cn } from "@/lib/utils"
import { StatusBar } from "./status-bar"

interface ChatInterfaceBugeProps {
  onBack: () => void
}

// Common keywords that might appear in habits
const HABIT_KEYWORDS = ["健身", "运动", "背单词", "看书", "学习", "图书馆", "早起", "晚上", "傍晚"]

// Predefined action keywords for title extraction
const ACTION_KEYWORDS = ["背单词", "健身", "看书", "跑步", "开会", "学习", "运动", "自习", "练背", "练腿", "游泳", "瑜伽"]

// Predefined location keywords for location extraction
const LOCATION_KEYWORDS = ["图书馆", "操场", "教室", "体育馆", "食堂", "健身房", "宿舍", "实验室", "自习室"]

// All available time slots for today (after 10:30 current time)
const AVAILABLE_TIME_SLOTS = ["11:00", "11:30", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "17:30", "18:00", "19:00", "20:00", "21:00", "21:30"]

// Get current date in MM-DD format
function getTodayDate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${month}-${day}`
}

// Get current time in HH:MM format
function getCurrentTime(): string {
  const now = new Date()
  return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const TODAY_DATE = getTodayDate()

// Convert time string to minutes for comparison
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// Check if two time slots are within 1.5 hours of each other
function areTimesConflicting(time1: string, time2: string): boolean {
  const diff = Math.abs(timeToMinutes(time1) - timeToMinutes(time2))
  return diff < 90 // 1.5 hours = 90 minutes
}

// Universal conflict detection: Find all tasks that conflict with any other task
function detectConflicts(tasks: Task[]): Set<string> {
  const conflictingTaskIds = new Set<string>()
  
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const taskA = tasks[i]
      const taskB = tasks[j]
      
      // Check if same date and times are within 1.5 hours
      if (taskA.date === taskB.date && areTimesConflicting(taskA.time, taskB.time)) {
        conflictingTaskIds.add(taskA.id)
        conflictingTaskIds.add(taskB.id)
      }
    }
  }
  
  return conflictingTaskIds
}

// Convert time string to minutes
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

// Check if a time slot falls within a course block
function isDuringCourse(time: string, courses: Course[]): boolean {
  const timeMinutes = parseTimeToMinutes(time)
  for (const course of courses) {
    const startMinutes = parseTimeToMinutes(course.startTime)
    const endMinutes = parseTimeToMinutes(course.endTime)
    // Add 15 min buffer after class ends
    if (timeMinutes >= startMinutes && timeMinutes < endMinutes + 15) {
      return true
    }
  }
  return false
}

// Find a free time slot that doesn't conflict with existing tasks OR courses
function findFreeTimeSlot(existingTasks: Task[], todayCourses: Course[], preferredTime: string | null): string {
  const todayTasks = existingTasks.filter(t => t.date === TODAY_DATE)
  const occupiedTimes = todayTasks.map(t => t.time)
  
  // Filter slots that are after current time
  const availableSlots = AVAILABLE_TIME_SLOTS.filter(slot => slot >= CURRENT_TIME)
  
  // If preferred time is valid and doesn't conflict with tasks or courses, use it
  if (preferredTime && preferredTime >= CURRENT_TIME) {
    const hasTaskConflict = occupiedTimes.some(occupied => areTimesConflicting(preferredTime, occupied))
    const hasCourseConflict = isDuringCourse(preferredTime, todayCourses)
    if (!hasTaskConflict && !hasCourseConflict) {
      return preferredTime
    }
  }
  
  // Find first available slot that doesn't conflict with tasks OR courses
  for (const slot of availableSlots) {
    const hasTaskConflict = occupiedTimes.some(occupied => areTimesConflicting(slot, occupied))
    const hasCourseConflict = isDuringCourse(slot, todayCourses)
    if (!hasTaskConflict && !hasCourseConflict) {
      return slot
    }
  }
  
  // Fallback to last slot if all are taken
  return availableSlots[availableSlots.length - 1] || "21:30"
}

// ============ MOCK ENTITY EXTRACTION ============

// Extract explicit time from user input using regex
function extractExplicitTime(input: string): string | null {
  // Match patterns like "16:00", "16点", "16点30", "下午4点"
  const timeRegex1 = /(\d{1,2}):(\d{2})/  // 16:00 format
  const timeRegex2 = /(\d{1,2})点(\d{2})?/  // 16点 or 16点30 format
  const timeRegex3 = /(上午|下午|早上|晚上)(\d{1,2})点(\d{2})?/  // 下午4点 format
  
  // Try HH:MM format first
  const match1 = input.match(timeRegex1)
  if (match1) {
    const hours = match1[1].padStart(2, '0')
    const minutes = match1[2]
    return `${hours}:${minutes}`
  }
  
  // Try with period prefix (上午/下午)
  const match3 = input.match(timeRegex3)
  if (match3) {
    let hours = parseInt(match3[2])
    const period = match3[1]
    const minutes = match3[3] || '00'
    
    // Convert to 24-hour format
    if ((period === '下午' || period === '晚上') && hours < 12) {
      hours += 12
    } else if (period === '上午' && hours === 12) {
      hours = 0
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`
  }
  
  // Try simple N点 format
  const match2 = input.match(timeRegex2)
  if (match2) {
    const hours = match2[1].padStart(2, '0')
    const minutes = match2[2] || '00'
    return `${hours}:${minutes.padStart(2, '0')}`
  }
  
  return null
}

// Extract explicit location from user input
function extractExplicitLocation(input: string): string | null {
  for (const location of LOCATION_KEYWORDS) {
    if (input.includes(location)) {
      return location
    }
  }
  return null
}

// Extract action/task name from user input
function extractActionName(input: string): string {
  // First, try to find a predefined action keyword
  for (const action of ACTION_KEYWORDS) {
    if (input.includes(action)) {
      return action
    }
  }
  
  // Fallback: clean up the input by removing time/location/prefixes
  let cleaned = input
  const prefixes = ["我想", "我要", "帮我", "安排", "今天", "明天", "我"]
  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, '')
  }
  
  // Remove time patterns
  cleaned = cleaned.replace(/\d{1,2}:\d{2}/g, '')
  cleaned = cleaned.replace(/\d{1,2}点(\d{2})?/g, '')
  cleaned = cleaned.replace(/(上午|下午|早上|晚上)/g, '')
  
  // Remove location patterns
  for (const loc of LOCATION_KEYWORDS) {
    cleaned = cleaned.replace(loc, '')
  }
  
  // Remove common filler words
  cleaned = cleaned.replace(/要|在|去|到/g, '')
  
  return cleaned.trim().slice(0, 15) || input.slice(0, 15)
}

// Mock AI Engine: Entity extraction + habit matching + smart gap-finding
interface MockAiResult {
  taskName: string
  date: string
  time: string
  location: string
  insight: string
  matchedHabit: string | null
}

function mockAiProcess(
  userInput: string, 
  habits: Array<{ id: string; icon: string; content: string }>,
  existingTasks: Task[],
  todayCourses: Course[]
): MockAiResult {
  // Step 1: Entity Extraction
  const explicitTime = extractExplicitTime(userInput)
  const explicitLocation = extractExplicitLocation(userInput)
  const actionName = extractActionName(userInput)
  
  // Track what was explicitly extracted for insight generation
  const hasExplicitEntities = explicitTime !== null || explicitLocation !== null
  
  // Step 2: Try to find a matching habit (only if no explicit time)
  let matchedHabit: { id: string; icon: string; content: string } | null = null
  if (!explicitTime) {
    for (const habit of habits) {
      const habitLower = habit.content.toLowerCase()
      for (const keyword of HABIT_KEYWORDS) {
        if (userInput.includes(keyword) && habitLower.includes(keyword)) {
          matchedHabit = habit
          break
        }
      }
      if (matchedHabit) break
    }
  }
  
  // Step 3: Determine final time with semantic extraction from habits
  let finalTime: string
  let finalDate: string = TODAY_DATE
  
  if (explicitTime) {
    // User specified exact time - respect it!
    finalTime = explicitTime
  } else if (matchedHabit) {
    // Extract semantic time preference from habit text
    let preferredTime: string | null = null
    const habitText = matchedHabit.content
    
    // Semantic time keyword mapping (ordered by specificity)
    if (habitText.includes("睡前") || habitText.includes("深夜")) {
      preferredTime = "22:30"
    } else if (habitText.includes("早起") || habitText.includes("早晨") || habitText.includes("早上")) {
      preferredTime = "08:00"
    } else if (habitText.includes("中午") || habitText.includes("午休") || habitText.includes("午间")) {
      preferredTime = "13:00"
    } else if (habitText.includes("傍晚") || habitText.includes("下午") || habitText.includes("17:00")) {
      preferredTime = "17:30"
    } else if (habitText.includes("晚上") || habitText.includes("夜间")) {
      preferredTime = "20:00"
    }
    
    // Temporal awareness: If preferred time has passed today, push to tomorrow
    if (preferredTime && preferredTime < CURRENT_TIME) {
      finalDate = "04-23" // Tomorrow
      finalTime = preferredTime
    } else {
      finalTime = findFreeTimeSlot(existingTasks, todayCourses, preferredTime)
    }
  } else {
    // No explicit time, no habit - use smart gap-finding
    finalTime = findFreeTimeSlot(existingTasks, todayCourses, null)
  }
  
  // Step 4: Determine final location
  let finalLocation: string
  if (explicitLocation) {
    finalLocation = explicitLocation
  } else if (userInput.includes("健身") || userInput.includes("运动") || userInput.includes("练")) {
    finalLocation = "校园健身房"
  } else if (userInput.includes("背单词") || userInput.includes("学习") || userInput.includes("自习")) {
    finalLocation = "宿舍/自习室"
  } else {
    finalLocation = "待定"
  }
  
  // Step 5: Generate appropriate insight
  let insight: string
  if (hasExplicitEntities) {
    insight = "精准识别：已为您提取明确的时间与地点"
  } else if (matchedHabit) {
    if (finalDate !== TODAY_DATE) {
      insight = "智能排程：依据习惯偏好，已安排至明日���佳时段"
    } else {
      insight = "智能排程：结合偏好已为您插空安排至今日最佳时段"
    }
  } else {
    insight = "智能安排：已为您找到今日最佳空闲时段"
  }
  
  return {
    taskName: actionName,
    date: finalDate,
    time: finalTime,
    location: finalLocation,
    insight,
    matchedHabit: matchedHabit?.content || null
  }
}

// Pending task confirmation data
interface PendingConfirmation {
  existingTaskId: string
  existingTaskTitle: string
  newData: {
    date: string
    time: string
    location: string
    insight: string
  }
}

export function ChatInterfaceBuge({ onBack }: ChatInterfaceBugeProps) {
  const { tasks, removeTask, addTask, updateTask, findTaskByTitle, inboxTasks, removeFromInbox, updateInboxTask, moveFromInboxToSchedule } = useTaskStore()
  const { courses, getTodayCourses, updateCourse, addCourse, removeCourse, setCourses } = useCourseStore()
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showHabitDrawer, setShowHabitDrawer] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showInboxModal, setShowInboxModal] = useState(false)
  const [showHabitsModal, setShowHabitsModal] = useState(false)
  const [showManualAddModal, setShowManualAddModal] = useState(false)
  const [manualAddConflictError, setManualAddConflictError] = useState<string | null>(null)
  
  // Dual-Mode View State
  const [viewMode, setViewMode] = useState<'agent' | 'calendar'>('agent')
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  
  // Schedule modal states
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [isAddingCourse, setIsAddingCourse] = useState(false)
  const [courseConflictError, setCourseConflictError] = useState<string | null>(null)
  
  // Inbox scheduling state
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState("04-22")
  const [editingInboxTaskId, setEditingInboxTaskId] = useState<string | null>(null)
  const [scheduleTime, setScheduleTime] = useState("14:00")
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null)
  const [habits, setHabits] = useState([
    { id: "1", icon: "🎯", content: "健身偏好：习惯在傍晚 (17:00后) 运动" }
  ])
  const [newHabit, setNewHabit] = useState("")
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Get today's courses for timeline display
  const todayCourses = getTodayCourses()

  // Universal conflict detection - detects any two tasks with overlapping times
  const conflictingTaskIds = detectConflicts(tasks)

  // Determine if a specific task should show warning styling
  const shouldShowWarning = (task: Task) => {
    return conflictingTaskIds.has(task.id)
  }

  const handleCompleteTask = (taskId: string) => {
    removeTask(taskId)
  }

  const handleSuggestionChipClick = (keyword: string) => {
    // Dynamic keyword handling - just insert the keyword as a prompt
    setInputValue(`我想${keyword}`)
    inputRef.current?.focus()
  }

  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return
    
    // Trigger smart scheduling for any input
    triggerSmartScheduling(inputValue)
    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const triggerSmartScheduling = (userMessage: string) => {
    setIsProcessing(true)

    // Phase 1 & 2: Processing state (1.5s), then cleanup
    setTimeout(() => {
      // Use mock AI engine to process the user input with existing tasks and courses for gap-finding
      const aiResult = mockAiProcess(userMessage, habits, tasks, todayCourses)
      
      // Check for duplicate task by title
      const existingTask = findTaskByTitle(aiResult.taskName)
      
      if (existingTask) {
        // Duplicate found - show confirmation bubble instead of adding
        setPendingConfirmation({
          existingTaskId: existingTask.id,
          existingTaskTitle: existingTask.title,
          newData: {
            date: aiResult.date,
            time: aiResult.time,
            location: aiResult.location,
            insight: aiResult.insight
          }
        })
        setIsProcessing(false)
      } else {
        // No duplicate - add task directly
        const newTask: Task = {
          id: `task-${Date.now()}`,
          title: aiResult.taskName,
          date: aiResult.date,
          time: aiResult.time,
          location: aiResult.location,
          priority: "P1",
          insight: aiResult.insight
        }
        
        addTask(newTask)
        setIsProcessing(false)
      }
    }, 1500)
  }

  const handleConfirmOverwrite = () => {
    if (!pendingConfirmation) return
    
    // Update existing task with new data
    updateTask(pendingConfirmation.existingTaskId, {
      date: pendingConfirmation.newData.date,
      time: pendingConfirmation.newData.time,
      location: pendingConfirmation.newData.location,
      insight: pendingConfirmation.newData.insight
    })
    
    setPendingConfirmation(null)
  }

  const handleCancelOverwrite = () => {
    // Discard the new data and close confirmation
    setPendingConfirmation(null)
  }

  const handleAddHabit = () => {
    if (!newHabit.trim()) return
    setHabits(prev => [...prev, {
      id: Date.now().toString(),
      icon: "💡",
      content: newHabit
    }])
    setNewHabit("")
  }

  const handleDeleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId))
  }

  const handleEditHabit = (habit: { id: string; content: string }) => {
    setEditingHabitId(habit.id)
    setEditingContent(habit.content)
  }

  const handleSaveEditHabit = () => {
    if (!editingContent.trim() || !editingHabitId) return
    setHabits(prev => prev.map(h => 
      h.id === editingHabitId ? { ...h, content: editingContent } : h
    ))
    setEditingHabitId(null)
    setEditingContent("")
  }

  const handleCancelEditHabit = () => {
    setEditingHabitId(null)
    setEditingContent("")
  }

  // Create unified timeline items (tasks + today's courses)
  type TimelineItem = 
    | { type: 'task'; data: Task }
    | { type: 'course'; data: Course }

  const timelineItems: TimelineItem[] = [
    ...tasks.map(t => ({ type: 'task' as const, data: t })),
    ...todayCourses.map(c => ({ type: 'course' as const, data: c }))
  ]

  // Sort all items chronologically
  const sortedTimelineItems = timelineItems.sort((a, b) => {
    const getDateTime = (item: TimelineItem) => {
      if (item.type === 'task') {
        return `${item.data.date} ${item.data.time}`
      } else {
        return `${TODAY_DATE} ${item.data.startTime}`
      }
    }
    return getDateTime(a).localeCompare(getDateTime(b))
  })

  // Also keep sorted tasks for conflict detection
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateTimeA = `${a.date} ${a.time}`
    const dateTimeB = `${b.date} ${b.time}`
    return dateTimeA.localeCompare(dateTimeB)
  })

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a]">
      {/* Unified Status Bar */}
      <StatusBar />

      {/* Chat Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-white hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-base font-medium text-white">
            不鸽 Agent
          </h1>
        </div>
        <button 
          onClick={() => setShowHabitDrawer(true)}
          className="p-2 -mr-2 text-white hover:text-gray-300 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-center px-3 py-2 border-b border-white/5">
        <div className="flex items-center bg-white/5 rounded-full p-0.5">
          <button
            onClick={() => setViewMode('agent')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
              viewMode === 'agent' 
                ? "bg-sky-500/30 text-sky-400 shadow-sm" 
                : "text-gray-400 hover:text-gray-300"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Agent 模式
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
              viewMode === 'calendar' 
                ? "bg-indigo-500/30 text-indigo-400 shadow-sm" 
                : "text-gray-400 hover:text-gray-300"
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            日历模式
          </button>
        </div>
      </div>

      {/* Main Content - Agent Mode */}
      {viewMode === 'agent' && (
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {tasks.length === 0 && todayCourses.length === 0 && !isProcessing && !pendingConfirmation ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-sky-300/20 to-sky-400/20 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-12 h-12 opacity-50">
                  <ellipse cx="50" cy="58" rx="26" ry="22" fill="#7dd3fc"/>
                  <circle cx="68" cy="35" r="14" fill="#7dd3fc"/>
                  <polygon points="82,35 92,38 82,41" fill="#fbbf24"/>
                  <circle cx="72" cy="32" r="3" fill="#333"/>
                  <ellipse cx="45" cy="55" rx="15" ry="10" fill="#bae6fd"/>
                  <polygon points="24,55 12,50 12,68 24,63" fill="#bae6fd"/>
                </svg>
              </div>
              <p className="text-gray-500 text-sm text-center leading-relaxed px-8">
                添加新的任务，不鸽帮你更好地规划
              </p>
            </div>
          ) : (
          <div className="space-y-4">
            {/* Processing State - Shows during smart scheduling */}
            {isProcessing && (
              <div className="flex gap-2.5 items-start animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-sky-300 to-sky-400 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-7 h-7">
                    <ellipse cx="50" cy="58" rx="26" ry="22" fill="white"/>
                    <circle cx="68" cy="35" r="14" fill="white"/>
                    <polygon points="82,35 92,38 82,41" fill="#f59e0b"/>
                    <circle cx="72" cy="32" r="3" fill="#333"/>
                    <ellipse cx="45" cy="55" rx="15" ry="10" fill="#e0f2fe"/>
                    <polygon points="24,55 12,50 12,68 24,63" fill="#e0f2fe"/>
                  </svg>
                </div>
                <div className="flex-1 max-w-[300px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs text-sky-400 bg-sky-500/20 px-1.5 py-0.5 rounded">AI</span>
                    <span className="text-sm text-gray-400">不鸽 Agent</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl rounded-tl-sm p-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm text-gray-400">AI 检索习惯与课表中...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Duplicate Confirmation Bubble */}
            {pendingConfirmation && (
              <div className="flex gap-2.5 items-start animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-7 h-7">
                    <ellipse cx="50" cy="58" rx="26" ry="22" fill="white"/>
                    <circle cx="68" cy="35" r="14" fill="white"/>
                    <polygon points="82,35 92,38 82,41" fill="#f59e0b"/>
                    <circle cx="72" cy="32" r="3" fill="#333"/>
                    <ellipse cx="45" cy="55" rx="15" ry="10" fill="#fef3c7"/>
                    <polygon points="24,55 12,50 12,68 24,63" fill="#fef3c7"/>
                  </svg>
                </div>
                <div className="flex-1 max-w-[300px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">AI</span>
                    <span className="text-sm text-gray-400">不鸽 Agent</span>
                  </div>
                  <div className="bg-amber-900/20 backdrop-blur-sm border border-amber-500/30 rounded-xl rounded-tl-sm p-3 space-y-3">
                    <p className="text-sm text-amber-200 leading-relaxed">
                      发现已有重复任务：【{pendingConfirmation.existingTaskTitle}】。是否使用新的时间和地点将其覆盖更新？
                    </p>
                    <p className="text-xs text-gray-400">
                      新时间：{pendingConfirmation.newData.date} {pendingConfirmation.newData.time} | 新地点：{pendingConfirmation.newData.location}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmOverwrite}
                        className="flex-1 py-2 px-3 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-lg text-sky-400 text-sm font-medium transition-colors"
                      >
                        是，覆盖更新
                      </button>
                      <button
                        onClick={handleCancelOverwrite}
                        className="flex-1 py-2 px-3 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 rounded-lg text-gray-400 text-sm font-medium transition-colors"
                      >
                        否，保留原样
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Unified Timeline - Courses + Tasks sorted chronologically */}
            {sortedTimelineItems.length > 0 && (
              <div className="space-y-3">
                {sortedTimelineItems.map((item, index) => {
                  if (item.type === 'course') {
                    return (
                      <CourseCard 
                        key={item.data.id} 
                        course={item.data} 
                        index={index}
                      />
                    )
                  } else {
                    return (
                      <TaskCard 
                        key={item.data.id} 
                        task={item.data} 
                        index={index}
                        showWarning={shouldShowWarning(item.data)}
                        onComplete={handleCompleteTask}
                        onUpdateTask={updateTask}
                      />
                    )
                  }
                })}
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {/* Main Content - Calendar Mode */}
      {viewMode === 'calendar' && (
        <CalendarView 
          tasks={tasks}
          courses={todayCourses}
          allCourses={courses}
          selectedDate={selectedCalendarDate}
          onSelectDate={setSelectedCalendarDate}
        />
      )}

      {/* Bottom Input Area - Only show in Agent mode */}
      {viewMode === 'agent' && (
      <div className="px-3 py-2 pb-6 border-t border-white/5 space-y-3">
        {/* Quick Action Chips - Derived from local habits array */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {habits.map((habit) => (
            <button
              key={habit.id}
              onClick={() => handleSuggestionChipClick(habit.content)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-500/30 rounded-full text-gray-300 hover:text-sky-400 text-xs font-medium transition-all"
            >
              <span>{habit.icon}</span>
              <span className="max-w-[120px] truncate">{habit.content}</span>
            </button>
          ))}
          {habits.length === 0 && (
            <span className="text-xs text-gray-500">在设置中添加习惯偏好</span>
          )}
        </div>

        {/* Input Row */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Mic className="w-6 h-6" />
          </button>
          <div className="flex-1 bg-[#2a2a2a] rounded-full px-4 py-2 flex items-center">
            <input 
              ref={inputRef}
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="对不鸽说点什么..."
              className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-500 outline-none"
            />
            {inputValue.trim() && (
              <button 
                onClick={handleSendMessage}
                className="ml-2 text-sky-400 hover:text-sky-300 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Smile className="w-6 h-6" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
      )}

      {/* Habit Settings Drawer */}
      {showHabitDrawer && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in"
            onClick={() => setShowHabitDrawer(false)}
          />
          
          {/* Drawer Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-[#1e1e1e] z-50 shadow-2xl animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">设置</h2>
              <button 
                onClick={() => setShowHabitDrawer(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4">
              {/* Inbox Button */}
              <button
                onClick={() => {
                  setShowHabitDrawer(false)
                  setShowInboxModal(true)
                }}
                className="w-full flex items-center gap-3 p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors"
              >
                <Inbox className="w-5 h-5 text-amber-400" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">收集栏</p>
                  <p className="text-xs text-gray-500">暂存的待办事项</p>
                </div>
                {inboxTasks.length > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/30 rounded-full text-amber-400 text-xs font-medium">
                    {inboxTasks.length}
                  </span>
                )}
              </button>

              {/* Schedule Import Button */}
              <button
                onClick={() => {
                  setShowHabitDrawer(false)
                  setShowScheduleModal(true)
                }}
                className="w-full flex items-center gap-3 p-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-colors"
              >
                <Calendar className="w-5 h-5 text-indigo-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-white">导入/修改课表</p>
                  <p className="text-xs text-gray-500">管理今日课程安排</p>
                </div>
              </button>

              {/* Habits Management Button */}
              <button
                onClick={() => {
                  setShowHabitDrawer(false)
                  setShowHabitsModal(true)
                }}
                className="w-full flex items-center gap-3 p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors"
              >
                <span className="text-lg">🎯</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">习惯偏好设置</p>
                  <p className="text-xs text-gray-500">Agent 长期记忆与快捷操作</p>
                </div>
                {habits.length > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-500/30 rounded-full text-emerald-400 text-xs font-medium">
                    {habits.length}
                  </span>
                )}
              </button>

              {/* Manual Add Schedule Button */}
              <button
                onClick={() => {
                  setShowHabitDrawer(false)
                  setShowManualAddModal(true)
                  setManualAddConflictError(null)
                }}
                className="w-full flex items-center gap-3 p-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-xl transition-colors"
              >
                <span className="text-lg">📅</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-white">手动添加日程</p>
                  <p className="text-xs text-gray-500">快速添加任务到时间轴</p>
                </div>
              </button>

              </div>
          </div>
        </>
      )}

      {/* Schedule Management Modal */}
      {showScheduleModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in"
            onClick={() => {
              if (!isImporting) {
                setShowScheduleModal(false)
                setEditingCourseId(null)
                setIsAddingCourse(false)
              }
            }}
          />
          
          {/* Modal Panel */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-[#1e1e1e] z-50 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">课表管理</h2>
              </div>
              <button 
                onClick={() => {
                  setShowScheduleModal(false)
                  setEditingCourseId(null)
                  setIsAddingCourse(false)
                }}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-gray-400 text-sm">
                AI 会自动避开课程时间进行智能排程
              </p>

              {/* Action Bar */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsImporting(true)
                    // Clear existing for fresh import
                    setCourses([])
                    
                    // Simulate import delay
                    setTimeout(() => {
                      setCourses([
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
                      ])
                      setIsImporting(false)
                      setImportSuccess(true)
                      setTimeout(() => setImportSuccess(false), 2000)
                    }, 1500)
                  }}
                  disabled={isImporting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-xl text-sky-400 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  模拟导入课表
                </button>
                <button
                  onClick={() => {
                    setIsAddingCourse(true)
                    setEditingCourseId(null)
                  }}
                  disabled={isImporting || isAddingCourse}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-gray-300 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  手动添加
                </button>
              </div>

              {/* Import Loading State */}
              {isImporting && (
                <div className="py-6 flex flex-col items-center gap-3 animate-in fade-in">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                  <p className="text-sm text-gray-400">正在模拟导入课表...</p>
                </div>
              )}

              {/* Import Success Message */}
              {importSuccess && (
                <div className="py-3 px-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 animate-in fade-in">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-medium">课表导入成功</span>
                </div>
              )}

              {/* Course Section */}
              {!isImporting && (
                <>
                  <div className="flex items-center gap-2 pt-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-white font-medium">当前课表</span>
                    <span className="text-xs text-gray-500">({todayCourses.length} 节)</span>
                  </div>

                  {/* Add New Course Form */}
                  {isAddingCourse && (
                    <CourseEditForm 
                      course={null}
                      existingCourses={todayCourses}
                      onSave={(data) => {
                        addCourse({
                          id: `course-${Date.now()}`,
                          name: data.name,
                          startTime: data.startTime,
                          endTime: data.endTime,
                          location: data.location,
                          dayOfWeek: 1,
                        })
                        setIsAddingCourse(false)
                      }}
                      onCancel={() => setIsAddingCourse(false)}
                    />
                  )}

                  {/* Course List */}
                  {todayCourses.map((course) => (
                    editingCourseId === course.id ? (
                      <CourseEditForm 
                        key={course.id}
                        course={course}
                        existingCourses={todayCourses}
                        onSave={(data) => {
                          updateCourse(course.id, data)
                          setEditingCourseId(null)
                        }}
                        onCancel={() => setEditingCourseId(null)}
                      />
                    ) : (
                      <div 
                        key={course.id}
                        className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white text-sm font-medium">{course.name}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-indigo-400 font-mono mr-2">
                              {course.startTime} - {course.endTime}
                            </span>
                            <button
                              onClick={() => {
                                setEditingCourseId(course.id)
                                setIsAddingCourse(false)
                              }}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                              title="修改"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeCourse(course.id)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-400">{course.location}</span>
                        </div>
                      </div>
                    )
                  ))}

                  {todayCourses.length === 0 && !isAddingCourse && (
                    <div className="py-8 text-center">
                      <p className="text-gray-500 text-sm">今日无课程安排</p>
                      <p className="text-gray-600 text-xs mt-1">点击上方按钮导入或手动添加</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowScheduleModal(false)
                  setEditingCourseId(null)
                  setIsAddingCourse(false)
                }}
                className="w-full py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 rounded-xl text-indigo-400 text-sm font-medium transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        </>
      )}

      {/* Inbox Modal */}
      {showInboxModal && (
        <>
          {/* Backdrop */}
          <div 
className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in"
            onClick={() => {
              setShowInboxModal(false)
              setSchedulingTaskId(null)
              setEditingInboxTaskId(null)
            }}
          />
          
          {/* Modal Panel */}
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-[#1e1e1e] z-50 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">收集栏</h2>
                {inboxTasks.length > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/20 rounded-full text-amber-400 text-xs font-medium">
                    {inboxTasks.length}
                  </span>
                )}
              </div>
              <button 
                onClick={() => {
                  setShowInboxModal(false)
                  setSchedulingTaskId(null)
                }}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-gray-400 text-sm">
                暂存的任务，稍后可安排到日程中
              </p>

              {/* Inbox Task List */}
              {inboxTasks.map((task) => (
                editingInboxTaskId === task.id ? (
                  <InboxTaskEditForm
                    key={task.id}
                    task={task}
                    onSave={(updates) => {
                      updateInboxTask(task.id, updates)
                      setEditingInboxTaskId(null)
                    }}
                    onCancel={() => setEditingInboxTaskId(null)}
                  />
                ) : (
                  <div 
                    key={task.id}
                    className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                  >
                    {/* Task Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">{task.title}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold",
                        task.priority === "P0" 
                          ? "bg-orange-500/20 border border-orange-500/40 text-orange-400"
                          : task.priority === "P1"
                          ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                          : "bg-blue-500/20 border border-blue-500/40 text-blue-400"
                      )}>
                        {task.priority}
                      </span>
                    </div>

                    {/* Task Info */}
                    {task.location && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-400">{task.location}</span>
                      </div>
                    )}

                    {/* Notes Display */}
                    {task.notes && (
                      <div className="mb-2 text-xs text-gray-400 bg-white/5 rounded-lg p-2">
                        {task.notes}
                      </div>
                    )}

                    {/* Scheduling UI */}
                    {schedulingTaskId === task.id ? (
                      <div className="space-y-2 pt-2 border-t border-white/10 mt-2">
                        <p className="text-xs text-sky-400 font-medium">选择日期和时间</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            placeholder="04-22"
                            className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500/50"
                          />
                          <input
                            type="text"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            placeholder="14:00"
                            className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500/50"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              moveFromInboxToSchedule(task.id, { date: scheduleDate, time: scheduleTime })
                              setSchedulingTaskId(null)
                            }}
                            className="flex-1 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-lg text-sky-400 text-sm font-medium transition-colors"
                          >
                            确认安排
                          </button>
                          <button
                            onClick={() => setSchedulingTaskId(null)}
                            className="flex-1 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 rounded-lg text-gray-400 text-sm font-medium transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setEditingInboxTaskId(task.id)
                            setSchedulingTaskId(null)
                          }}
                          className="flex items-center justify-center gap-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-xs font-medium transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          编辑
                        </button>
                        <button
                          onClick={() => {
                            setSchedulingTaskId(task.id)
                            setEditingInboxTaskId(null)
                            setScheduleDate(task.date || "04-22")
                            setScheduleTime(task.time || "14:00")
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-lg text-sky-400 text-xs font-medium transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          加入日程
                        </button>
                        <button
                          onClick={() => removeFromInbox(task.id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              ))}

              {inboxTasks.length === 0 && (
                <div className="py-8 text-center">
                  <Inbox className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">收集栏为空</p>
                  <p className="text-gray-600 text-xs mt-1">暂存的任务会显示在这里</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowInboxModal(false)
                  setSchedulingTaskId(null)
                }}
                className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl text-amber-400 text-sm font-medium transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        </>
      )}

      {/* Habits Management Modal */}
      {showHabitsModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in"
            onClick={() => setShowHabitsModal(false)}
          />
          
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-[#1e1e1e] z-50 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h2 className="text-lg font-semibold text-white">习惯偏好设置</h2>
              </div>
              <button 
                onClick={() => setShowHabitsModal(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-gray-400 text-sm">
                Agent 的长期记忆：不鸽会根据这些偏好智能安排任务，同时作为快捷操作按钮显示
              </p>

              {/* Saved Habits */}
              <div className="space-y-2">
                {habits.map((habit) => (
                  <div 
                    key={habit.id}
                    className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10 group"
                  >
                    <span className="text-lg flex-shrink-0">{habit.icon}</span>
                    {editingHabitId === habit.id ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-sky-500/50"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEditHabit}
                            className="px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded text-sky-400 text-xs font-medium transition-colors"
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancelEditHabit}
                            className="px-3 py-1 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 rounded text-gray-400 text-xs font-medium transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="flex-1 text-sm text-gray-300 leading-relaxed">{habit.content}</p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditHabit(habit)}
                            className="p-1.5 text-gray-400 hover:text-sky-400 hover:bg-white/10 rounded transition-colors"
                            title="编辑"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {habits.length === 0 && (
                  <div className="py-6 text-center">
                    <span className="text-2xl">🎯</span>
                    <p className="text-gray-500 text-sm mt-2">暂无习惯偏好</p>
                    <p className="text-gray-600 text-xs mt-1">添加习惯后会显示为快捷操作按钮</p>
                  </div>
                )}
              </div>

              {/* Add New Habit */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <p className="text-xs text-gray-500">添加新习惯</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHabit}
                    onChange={(e) => setNewHabit(e.target.value)}
                    placeholder="例如：喜欢早起学习..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-sky-500/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddHabit()
                    }}
                  />
                  <button
                    onClick={handleAddHabit}
                    disabled={!newHabit.trim()}
                    className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-lg text-sky-400 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setShowHabitsModal(false)}
                className="w-full py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-emerald-400 text-sm font-medium transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        </>
      )}

      {/* Manual Add Schedule Modal */}
      {showManualAddModal && (
        <ManualAddScheduleModal
          isOpen={showManualAddModal}
          onClose={() => {
            setShowManualAddModal(false)
            setManualAddConflictError(null)
          }}
          existingTasks={tasks}
          existingCourses={todayCourses}
          conflictError={manualAddConflictError}
          onSave={(taskData) => {
            // Check for conflicts with existing tasks
            const taskConflict = checkTaskConflict(
              { date: taskData.date, time: taskData.startTime, endTime: taskData.endTime },
              tasks
            )
            
            // Check for conflicts with courses (convert course to comparable format)
            const courseConflict = checkCourseConflict(
              { startTime: taskData.startTime, endTime: taskData.endTime, dayOfWeek: 1 },
              todayCourses
            )
            
            if (taskConflict) {
              setManualAddConflictError(`时间冲突：与【${taskConflict.title}】(${taskConflict.time}) 重叠`)
              return
            }
            
            if (courseConflict) {
              setManualAddConflictError(`时间冲突：与课程【${courseConflict.name}】(${courseConflict.startTime}-${courseConflict.endTime}) 重叠`)
              return
            }
            
            // No conflict - add task
            addTask({
              id: `manual-${Date.now()}`,
              title: taskData.name,
              date: taskData.date,
              time: taskData.startTime,
              location: taskData.location || undefined,
              priority: "P1",
            })
            
            setShowManualAddModal(false)
            setManualAddConflictError(null)
          }}
        />
      )}
    </div>
  )
}

// Calendar View Component
function CalendarView({
  tasks,
  courses,
  allCourses,
  selectedDate,
  onSelectDate
}: {
  tasks: Task[]
  courses: Course[]
  allCourses: Course[]
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Format date to "MM-DD" format
  const formatDate = (day: number) => {
    const month = String(currentMonth.month + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    return `${month}-${dayStr}`
  }

  // Check if a date has tasks or courses
  const getDateIndicators = (day: number) => {
    const dateStr = formatDate(day)
    const dayTasks = tasks.filter(t => t.date === dateStr)
    const hasTask = dayTasks.length > 0
    
    // Get courses for this day of week
    const date = new Date(currentMonth.year, currentMonth.month, day)
    const jsDay = date.getDay()
    const dayOfWeek = jsDay === 0 ? 7 : jsDay // Convert Sunday 0 to 7
    const dayCourses = allCourses.filter(c => c.dayOfWeek === dayOfWeek)
    const hasCourse = dayCourses.length > 0
    
    // Check for conflicts on this day (tasks overlapping with each other or with courses)
    let hasConflict = false
    
    // Check task-task conflicts
    for (let i = 0; i < dayTasks.length; i++) {
      for (let j = i + 1; j < dayTasks.length; j++) {
        const t1Start = parseInt(dayTasks[i].time.split(':')[0]) * 60 + parseInt(dayTasks[i].time.split(':')[1] || '0')
        const t2Start = parseInt(dayTasks[j].time.split(':')[0]) * 60 + parseInt(dayTasks[j].time.split(':')[1] || '0')
        if (Math.abs(t1Start - t2Start) < 60) {
          hasConflict = true
          break
        }
      }
      if (hasConflict) break
    }
    
    // Check task-course conflicts
    if (!hasConflict) {
      for (const task of dayTasks) {
        const taskStart = parseInt(task.time.split(':')[0]) * 60 + parseInt(task.time.split(':')[1] || '0')
        const taskEnd = taskStart + 60 // Assume 1 hour duration
        
        for (const course of dayCourses) {
          const courseStart = parseInt(course.startTime.split(':')[0]) * 60 + parseInt(course.startTime.split(':')[1] || '0')
          const courseEnd = parseInt(course.endTime.split(':')[0]) * 60 + parseInt(course.endTime.split(':')[1] || '0')
          
          if (taskStart < courseEnd && taskEnd > courseStart) {
            hasConflict = true
            break
          }
        }
        if (hasConflict) break
      }
    }

    return { hasTask, hasCourse, hasConflict }
  }

  const daysInMonth = getDaysInMonth(currentMonth.year, currentMonth.month)
  const firstDay = getFirstDayOfMonth(currentMonth.year, currentMonth.month)
  const weekDays = ['日', '一', '二', '��', '四', '五', '六']
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  // Navigate months
  const prevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 }
      }
      return { ...prev, month: prev.month - 1 }
    })
  }

  const nextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 }
      }
      return { ...prev, month: prev.month + 1 }
    })
  }

  // Get tasks and courses for selected date
  const getSelectedDateItems = () => {
    if (!selectedDate) return []
    
    const dayTasks = tasks.filter(t => t.date === selectedDate)
    
    // Get courses for the day of week
    const dateParts = selectedDate.split('-')
    const month = parseInt(dateParts[0]) - 1
    const day = parseInt(dateParts[1])
    const date = new Date(currentMonth.year, month, day)
    const dayOfWeek = date.getDay() || 7 // Convert Sunday 0 to 7
    const dayCourses = allCourses.filter(c => c.dayOfWeek === dayOfWeek)
    
    // Combine and sort
    const items: Array<{ type: 'task' | 'course'; data: Task | Course; time: string }> = [
      ...dayTasks.map(t => ({ type: 'task' as const, data: t, time: t.time })),
      ...dayCourses.map(c => ({ type: 'course' as const, data: c, time: c.startTime }))
    ]
    
    return items.sort((a, b) => {
      const aMin = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1] || '0')
      const bMin = parseInt(b.time.split(':')[0]) * 60 + parseInt(b.time.split(':')[1] || '0')
      return aMin - bMin
    })
  }

  const selectedDateItems = getSelectedDateItems()

  // Check if date is today
  const isToday = (day: number) => {
    const now = new Date()
    return now.getFullYear() === currentMonth.year && 
           now.getMonth() === currentMonth.month && 
           now.getDate() === day
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <button 
          onClick={prevMonth}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-white">
          {currentMonth.year}年 {monthNames[currentMonth.month]}
        </h2>
        <button 
          onClick={nextMonth}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-white/5">
        {weekDays.map((day, i) => (
          <div 
            key={day} 
            className={cn(
              "py-2 text-center text-xs font-medium",
              i === 0 || i === 6 ? "text-gray-500" : "text-gray-400"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 gap-px bg-white/5">
          {/* Empty cells for days before the first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-[#121212]" />
          ))}
          
          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = formatDate(day)
            const { hasTask, hasCourse, hasConflict } = getDateIndicators(day)
            const isSelected = selectedDate === dateStr
            const isTodayDate = isToday(day)
            
            return (
              <button
                key={day}
                onClick={() => onSelectDate(isSelected ? null : dateStr)}
                className={cn(
                  "aspect-square bg-[#121212] flex flex-col items-center justify-center gap-1 transition-all relative",
                  isSelected && "bg-indigo-500/20 ring-1 ring-indigo-500/50",
                  !isSelected && "hover:bg-white/5"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  isTodayDate && "text-indigo-400",
                  isSelected && "text-indigo-400",
                  !isTodayDate && !isSelected && "text-gray-300"
                )}>
                  {day}
                </span>
                
                {/* Dot indicators */}
                <div className="flex items-center gap-0.5">
                  {/* Course dot (green/indigo) */}
                  {hasCourse && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                  {/* Task dot (blue or red for conflict) */}
                  {hasTask && (
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      hasConflict ? "bg-red-500" : "bg-sky-500"
                    )} />
                  )}
                </div>
                
                {/* Today indicator */}
                {isTodayDate && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-indigo-400 font-medium">
                    今
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Drawer */}
      {selectedDate && (
        <div className="border-t border-white/10 bg-[#1a1a1a] animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h3 className="text-sm font-medium text-white">
              {currentMonth.month + 1}月{parseInt(selectedDate.split('-')[1])}日 日程
            </h3>
            <button 
              onClick={() => onSelectDate(null)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="max-h-[200px] overflow-y-auto p-3 space-y-2">
            {selectedDateItems.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">
                该日期暂无日程安排
              </p>
            ) : (
              selectedDateItems.map((item, idx) => (
                <div 
                  key={`${item.type}-${idx}`}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl",
                    item.type === 'course' 
                      ? "bg-indigo-500/10 border border-indigo-500/20"
                      : "bg-sky-500/10 border border-sky-500/20"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    item.type === 'course' ? "bg-indigo-500/30" : "bg-sky-500/30"
                  )}>
                    {item.type === 'course' ? (
                      <School className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Check className="w-4 h-4 text-sky-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {item.type === 'course' ? (item.data as Course).name : (item.data as Task).title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.type === 'course' 
                        ? `${(item.data as Course).startTime}-${(item.data as Course).endTime} | ${(item.data as Course).location}`
                        : `${(item.data as Task).time} | ${(item.data as Task).location || '未指定地点'}`
                      }
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Manual Add Schedule Modal Component
function ManualAddScheduleModal({
  isOpen,
  onClose,
  existingTasks,
  existingCourses,
  conflictError,
  onSave
}: {
  isOpen: boolean
  onClose: () => void
  existingTasks: Task[]
  existingCourses: Course[]
  conflictError: string | null
  onSave: (data: { name: string; date: string; startTime: string; endTime: string; location: string }) => void
}) {
  const [name, setName] = useState("")
  const [date, setDate] = useState("04-22")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")

  const handleSave = () => {
    if (!name.trim() || !startTime.trim()) return
    onSave({
      name: name.trim(),
      date: date.trim() || "04-22",
      startTime: startTime.trim(),
      endTime: endTime.trim() || startTime.trim(),
      location: location.trim()
    })
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in"
        onClick={onClose}
      />
      
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-[#1e1e1e] z-50 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <h2 className="text-lg font-semibold text-white">手动添加日程</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Conflict Error */}
          {conflictError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm font-medium flex items-center gap-2">
                <span>⚠️</span>
                {conflictError}
              </p>
            </div>
          )}

          {/* Task Name */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">任务名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：团队会议"
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sky-500/50"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">日期</label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="04-22"
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sky-500/50"
            />
          </div>

          {/* Time Range */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">开始时间 *</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="14:00"
                className={cn(
                  "w-full bg-neutral-800 border text-white rounded-lg px-3 py-2.5 text-sm outline-none",
                  conflictError ? "border-red-500/50 focus:border-red-500" : "border-neutral-700 focus:border-sky-500/50"
                )}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">结束时间</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="15:00"
                className={cn(
                  "w-full bg-neutral-800 border text-white rounded-lg px-3 py-2.5 text-sm outline-none",
                  conflictError ? "border-red-500/50 focus:border-red-500" : "border-neutral-700 focus:border-sky-500/50"
                )}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">地点</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="可选，例如：会议室A"
              className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2.5 text-sm outline-none focus:border-sky-500/50"
            />
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 rounded-xl text-gray-400 text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !startTime.trim()}
            className="flex-1 py-2.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-xl text-sky-400 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </div>
    </>
  )
}

// Inbox Task Edit Form Component - For editing tasks in the inbox
function InboxTaskEditForm({ 
  task, 
  onSave, 
  onCancel 
}: { 
  task: Task
  onSave: (updates: Partial<Task>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [date, setDate] = useState(task.date)
  const [time, setTime] = useState(task.time)
  const [location, setLocation] = useState(task.location || "")
  const [priority, setPriority] = useState<"P0" | "P1" | "P2">(task.priority)
  const [notes, setNotes] = useState(task.notes || "")
  const [attachmentText, setAttachmentText] = useState(
    task.attachments?.map(a => a.name).join(", ") || ""
  )

  const handleSave = () => {
    const attachments = attachmentText.trim() 
      ? attachmentText.split(",").map((name, idx) => ({
          id: `att-inbox-${idx}`,
          name: name.trim(),
          type: "document" as const,
        }))
      : undefined

    onSave({
      title: title.trim() || task.title,
      date: date.trim() || task.date,
      time: time.trim() || task.time,
      location: location.trim() || undefined,
      priority,
      notes: notes.trim() || undefined,
      attachments
    })
  }

  return (
    <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl space-y-3 animate-in fade-in">
      <p className="text-xs text-sky-400 font-medium">编辑任务</p>
      
      {/* Title */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">任务标题</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="任务标��"
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-sky-500/50"
        />
      </div>

      {/* Date & Time */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">日期</label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="04-22"
            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-sky-500/50"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">时间</label>
          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="14:00"
            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-sky-500/50"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">地点</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="可选"
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-sky-500/50"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">优先级</label>
        <div className="flex gap-2">
          {(["P0", "P1", "P2"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                priority === p
                  ? p === "P0"
                    ? "bg-orange-500/30 border-orange-500/60 text-orange-400"
                    : p === "P1"
                    ? "bg-amber-500/30 border-amber-500/60 text-amber-400"
                    : "bg-blue-500/30 border-blue-500/60 text-blue-400"
                  : "bg-neutral-800 border-neutral-700 text-gray-400"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">备注</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="添加备注..."
          rows={2}
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-sky-500/50 resize-none"
        />
      </div>

      {/* Attachments */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">补充信息 (逗号分隔)</label>
        <input
          type="text"
          value={attachmentText}
          onChange={(e) => setAttachmentText(e.target.value)}
          placeholder="例如：报名表.jpg, 简历.pdf"
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-sky-500/50"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="flex-1 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-lg text-sky-400 text-sm font-medium transition-colors"
        >
          保存
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 rounded-lg text-gray-400 text-sm font-medium transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  )
}

// Course Edit Form Component - Inline form for adding/editing courses with conflict validation
function CourseEditForm({ 
  course, 
  onSave, 
  onCancel,
  existingCourses
}: { 
  course: Course | null
  onSave: (data: { name: string; startTime: string; endTime: string; location: string }) => void
  onCancel: () => void
  existingCourses: Course[]
}) {
  const [name, setName] = useState(course?.name || "")
  const [startTime, setStartTime] = useState(course?.startTime || "")
  const [endTime, setEndTime] = useState(course?.endTime || "")
  const [location, setLocation] = useState(course?.location || "")
  const [conflictError, setConflictError] = useState<string | null>(null)

  const handleSave = () => {
    if (!name.trim() || !startTime.trim() || !endTime.trim()) return
    
    // Check for time conflict before saving
    const conflictingCourse = checkCourseConflict(
      { startTime: startTime.trim(), endTime: endTime.trim(), dayOfWeek: 1 },
      existingCourses,
      course?.id // Exclude current course when editing
    )
    
    if (conflictingCourse) {
      setConflictError(`课程时间冲突：与【${conflictingCourse.name}】(${conflictingCourse.startTime}-${conflictingCourse.endTime}) 重叠`)
      return
    }
    
    setConflictError(null)
    onSave({
      name: name.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      location: location.trim()
    })
  }

  // Clear conflict error when times change
  const handleTimeChange = (setter: (v: string) => void, value: string) => {
    setter(value)
    setConflictError(null)
  }

  return (
    <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl space-y-3 animate-in fade-in">
      <p className="text-xs text-sky-400 font-medium">
        {course ? "修改课程" : "添加新课程"}
      </p>
      
      {/* Conflict Error Display */}
      {conflictError && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-xs text-red-400 font-medium">{conflictError}</p>
        </div>
      )}
      
      {/* Course Name */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">课程名称</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：数学分析 II"
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500/50"
        />
      </div>
      
      {/* Time Range */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">开始时间</label>
          <input
            type="text"
            value={startTime}
            onChange={(e) => handleTimeChange(setStartTime, e.target.value)}
            placeholder="08:00"
            className={cn(
              "w-full bg-neutral-800 border text-white rounded-lg px-3 py-2 text-sm outline-none",
              conflictError ? "border-red-500/50 focus:border-red-500" : "border-neutral-700 focus:border-sky-500/50"
            )}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">结束时间</label>
          <input
            type="text"
            value={endTime}
            onChange={(e) => handleTimeChange(setEndTime, e.target.value)}
            placeholder="09:40"
            className={cn(
              "w-full bg-neutral-800 border text-white rounded-lg px-3 py-2 text-sm outline-none",
              conflictError ? "border-red-500/50 focus:border-red-500" : "border-neutral-700 focus:border-sky-500/50"
            )}
          />
        </div>
      </div>
      
      {/* Location */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">上课地点</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="例如：教学楼417室"
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500/50"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={!name.trim() || !startTime.trim() || !endTime.trim()}
          className="flex-1 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-lg text-sky-400 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          保存
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 rounded-lg text-gray-400 text-sm font-medium transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  )
}

// Course Card Component - Fixed events, not completable
function CourseCard({ 
  course, 
  index 
}: { 
  course: Course
  index: number 
}) {
  return (
    <div 
      className="backdrop-blur-xl rounded-2xl p-4 transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 shadow-lg"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <School className="w-4 h-4 text-indigo-400" />
          <span className="text-xs text-indigo-400 font-medium">课程</span>
        </div>
        <span className="font-mono text-xs text-indigo-400/70">
          {course.startTime} - {course.endTime}
        </span>
      </div>
      
      {/* Course Name */}
      <p className="text-white text-sm font-medium mb-2">{course.name}</p>
      
      {/* Location */}
      <div className="flex items-center gap-1.5">
        <MapPin className="w-3 h-3 text-gray-500" />
        <p className="text-gray-400 text-xs">{course.location}</p>
      </div>
    </div>
  )
}

// Task Card Component - Collapsible/Accordion style with Inline Editing
function TaskCard({ 
  task, 
  index,
  showWarning,
  onComplete,
  onUpdateTask
}: { 
  task: Task
  index: number
  showWarning: boolean
  onComplete: (taskId: string) => void
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteInput, setNoteInput] = useState(task.notes || "")
  
  // Task details editing state
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDate, setEditDate] = useState(task.date)
  const [editTime, setEditTime] = useState(task.time)
  const [editLocation, setEditLocation] = useState(task.location || "")
  
  const hasInsight = task.insight
  const hasNotes = !!task.notes
  const isInEditMode = isEditingNote || isEditingDetails

  // Save note handler
  const handleSaveNote = () => {
    onUpdateTask(task.id, { notes: noteInput.trim() || undefined })
    setIsEditingNote(false)
  }

  // Cancel note editing
  const handleCancelNote = () => {
    setNoteInput(task.notes || "")
    setIsEditingNote(false)
  }

  // Start editing details
  const handleStartEditDetails = () => {
    setEditTitle(task.title)
    setEditDate(task.date)
    setEditTime(task.time)
    setEditLocation(task.location || "")
    setIsEditingDetails(true)
  }

  // Save details handler - this will re-trigger conflict detection automatically
  const handleSaveDetails = () => {
    onUpdateTask(task.id, {
      title: editTitle.trim() || task.title,
      date: editDate,
      time: editTime,
      location: editLocation.trim() || undefined
    })
    setIsEditingDetails(false)
  }

  // Cancel details editing
  const handleCancelDetails = () => {
    setEditTitle(task.title)
    setEditDate(task.date)
    setEditTime(task.time)
    setEditLocation(task.location || "")
    setIsEditingDetails(false)
  }

  return (
    <div 
      className={cn(
        "backdrop-blur-xl rounded-2xl transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in overflow-hidden",
        showWarning 
          ? "border border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.2)] bg-red-900/20" 
          : hasInsight
          ? "bg-gradient-to-br from-emerald-500/10 to-sky-500/10 border border-emerald-500/30 shadow-xl"
          : "bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-xl"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Compact View - Always Visible / Clickable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Status Dot */}
          <div className={cn(
            "w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-300",
            showWarning ? "bg-red-500 animate-pulse" : hasInsight ? "bg-emerald-400" : "bg-sky-400"
          )} />
          
          {/* Date & Time */}
          <span className={cn(
            "font-mono text-sm font-bold flex-shrink-0 transition-colors duration-300",
            showWarning ? "text-red-400" : hasInsight ? "text-emerald-400" : "text-sky-400"
          )}>
            {task.date} {task.time}
          </span>
          
          {/* Task Title */}
          <span className="text-white text-sm font-medium truncate">{task.title}</span>
          
          {/* Warning Badge (always visible in compact view if conflict) */}
          {showWarning && (
            <span className="text-[10px] text-red-400 bg-red-500/30 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              ⚠️ 时间冲突
            </span>
          )}
          
          {/* Has Note Indicator */}
          {hasNotes && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5 flex-shrink-0">
              <StickyNote className="w-3 h-3" />
              已备注
            </span>
          )}
        </div>
        
        {/* Quick Complete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onComplete(task.id)
          }}
          className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors flex-shrink-0 mr-1"
          title="快速完成"
        >
          <Check className="w-4 h-4" />
        </button>
        
        {/* Expand/Collapse Indicator */}
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200",
            isExpanded && "rotate-180"
          )} 
        />
      </button>

      {/* Expanded View - Hidden by default */}
      <div className={cn(
        "grid transition-all duration-200 ease-out",
        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-0 space-y-3">
            
            {/* ========== EDIT DETAILS MODE ========== */}
            {isEditingDetails ? (
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs text-sky-400 font-medium">编辑任务详情</p>
                
                {/* Title Input */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">任务名称</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500/50"
                    placeholder="输入任务名称"
                  />
                </div>
                
                {/* Date & Time Input */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">日期</label>
                    <input
                      type="text"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500/50"
                      placeholder="04-22"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">时间</label>
                    <input
                      type="text"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500/50"
                      placeholder="14:30"
                    />
                  </div>
                </div>
                
                {/* Location Input */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">地点</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500/50"
                    placeholder="输入地点（可选）"
                  />
                </div>
                
                {/* Save/Cancel Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveDetails}
                    className="flex-1 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-lg text-sky-400 text-sm font-medium transition-colors"
                  >
                    保存修改
                  </button>
                  <button
                    onClick={handleCancelDetails}
                    className="flex-1 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 rounded-lg text-gray-400 text-sm font-medium transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ========== NORMAL VIEW ========== */}
                
                {/* Smart Scheduling Badge */}
                {hasInsight && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">智能安排</span>
                  </div>
                )}

                {/* Location */}
                {task.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <p className="text-gray-400 text-sm">{task.location}</p>
                  </div>
                )}

                {/* Priority Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">优先级：</span>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold",
                    task.priority === "P0" 
                      ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 text-orange-400"
                      : task.priority === "P1"
                      ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400"
                      : "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40 text-blue-400"
                  )}>
                    {task.priority}
                  </span>
                </div>

                {/* AI Insight Badge */}
                {hasInsight && (
                  <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-400 text-xs leading-relaxed">{task.insight}</p>
                  </div>
                )}

                {/* ========== NOTE EDITING MODE ========== */}
                {isEditingNote ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500/50 resize-none"
                      placeholder="输入备注内容..."
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNote}
                        className="px-3 py-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded text-xs font-medium transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancelNote}
                        className="px-3 py-1.5 text-gray-400 hover:bg-gray-500/20 rounded text-xs font-medium transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Notes Display (when not editing) */}
                    {hasNotes && (
                      <div className="flex items-start gap-2 p-2.5 bg-sky-500/10 rounded-lg border border-sky-500/20">
                        <StickyNote className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sky-300 text-xs leading-relaxed">{task.notes}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Action Buttons Row - Hidden when editing note */}
                {!isEditingNote && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEditDetails()
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white text-xs font-medium transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      修改
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setNoteInput(task.notes || "")
                        setIsEditingNote(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white text-xs font-medium transition-colors"
                    >
                      <StickyNote className="w-3.5 h-3.5" />
                      {hasNotes ? "编辑备注" : "添加备注"}
                    </button>
                  </div>
                )}

                {/* Complete Button - Hidden when in any edit mode */}
                {!isInEditMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onComplete(task.id)
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-emerald-400 text-sm font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                  >
                    <Check className="w-4 h-4" />
                    完成
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
