"use client"

import { useEffect, useState } from "react"
import { X, Sparkles, CheckCircle2, ChevronDown, Clock, MapPin, Flame, Plus, Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTaskStore, Task, checkTaskConflict, checkTaskBufferWarning } from "@/hooks/use-task-store"
import { useCourseStore, checkCourseConflict, checkCourseBufferWarning } from "@/hooks/use-course-store"

// Task data for this overlay (宣讲会)
const TASKS_DATA: Task[] = [
  {
    id: "xuanjiang",
    title: "参加经验宣讲会",
    date: "04-22",
    time: "14:30",
    location: "腾讯会议 100-***-284",
    priority: "P0",
  },
]

interface AiParsingOverlayProps {
  isOpen: boolean
  onClose: () => void
  onSaveToTimeline: () => void
}

export function AiParsingOverlay({ isOpen, onClose, onSaveToTimeline }: AiParsingOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const [showBufferWarning, setShowBufferWarning] = useState(false)
  const [pendingTask, setPendingTask] = useState<Task | null>(null)
  const { addTask, tasks: storeTasks } = useTaskStore()
  const { courses } = useCourseStore()

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setExpandedIds(new Set())
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const toggleExpand = (taskId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText("100-***-284")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAddSingle = (task: Task) => {
    // Calculate day of week for course conflict check
    const [month, day] = task.date.split('-').map(Number)
    const year = new Date().getFullYear()
    const taskDate = new Date(year, month - 1, day)
    const jsDay = taskDate.getDay()
    const dayOfWeek = jsDay === 0 ? 7 : jsDay
    
    // Check for hard conflicts first
    const taskConflict = checkTaskConflict(
      { date: task.date, time: task.time, endTime: undefined },
      storeTasks
    )
    const coursesOnDay = courses.filter(c => c.dayOfWeek === dayOfWeek)
    const courseConflict = checkCourseConflict(
      { startTime: task.time, endTime: task.time, dayOfWeek },
      coursesOnDay
    )
    
    if (taskConflict || courseConflict) {
      // Hard conflict - don't add (could show error but for now just don't add)
      return
    }
    
    // Check for buffer warning
    const taskBufferWarning = checkTaskBufferWarning(
      { date: task.date, time: task.time, endTime: undefined },
      storeTasks
    )
    const courseBufferWarning = checkCourseBufferWarning(
      { startTime: task.time, endTime: task.time, dayOfWeek },
      coursesOnDay
    )
    
    if (taskBufferWarning || courseBufferWarning) {
      setPendingTask(task)
      setShowBufferWarning(true)
      return
    }
    
    addTask(task)
  }
  
  const handleConfirmBufferAdd = () => {
    if (pendingTask) {
      addTask(pendingTask)
    }
    setShowBufferWarning(false)
    setPendingTask(null)
  }
  
  const handleCancelBufferAdd = () => {
    setShowBufferWarning(false)
    setPendingTask(null)
  }

  const handleAddAllNew = () => {
    TASKS_DATA.forEach(task => {
      if (!isTaskInStore(task)) {
        addTask(task)
      }
    })
    onSaveToTimeline()
  }

  // Check if task is already in store by matching title
  const isTaskInStore = (task: Task) => {
    return storeTasks.some(t => t.title === task.title)
  }

  // Count how many tasks are not yet added
  const newTasksCount = TASKS_DATA.filter(t => !isTaskInStore(t)).length

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Buffer Warning Dialog */}
      {showBufferWarning && pendingTask && (
        <>
          <div 
            className="absolute inset-0 bg-black/80 z-[60]"
            onClick={handleCancelBufferAdd}
          />
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-[#1e1e1e] z-[70] rounded-2xl shadow-2xl border border-amber-500/30">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-base font-semibold text-white text-center flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                时间安排提醒
              </h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-300 text-center mb-4">
                时间安排较紧（间隙不足10分钟），是否确定要添加 <span className="text-white font-medium">{pendingTask.title}</span>？
              </p>
              <div className="space-y-2">
                <button
                  onClick={handleConfirmBufferAdd}
                  className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl text-amber-400 text-sm font-medium transition-colors"
                >
                  是，确定添加
                </button>
                <button
                  onClick={handleCancelBufferAdd}
                  className="w-full py-2.5 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 rounded-xl text-gray-400 text-sm font-medium transition-colors"
                >
                  否，返回修改
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div 
        className={cn(
          "relative w-full max-w-md bg-[#1e1e1e]/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 shadow-2xl transition-transform duration-300 ease-out",
          isAnimating ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0099FF] to-[#00d4ff] rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">不鸽 AI 解析完成</h2>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Extracted Tasks Summary */}
          <p className="text-sm text-gray-400">
            已从聊天中智能提取 <span className="text-[#0099FF] font-medium">{TASKS_DATA.length}</span> 项待办任务
          </p>

          {/* Compact Task List */}
          {TASKS_DATA.map((task) => {
            const isExpanded = expandedIds.has(task.id)
            const alreadyAdded = isTaskInStore(task)

            return (
              <div 
                key={task.id}
                className={cn(
                  "bg-[#2a2a2a]/80 backdrop-blur-sm rounded-xl border transition-all duration-200",
                  alreadyAdded ? "border-emerald-500/30" : "border-white/5"
                )}
              >
                {/* Compact Header - Always Visible */}
                <div className="flex items-center gap-3 p-3">
                  {/* Expand Toggle */}
                  <button
                    onClick={() => toggleExpand(task.id)}
                    className="p-1 -m-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} 
                    />
                  </button>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">{task.title}</span>
                      <span className={cn(
                        "flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold",
                        task.priority === "P0" 
                          ? "bg-orange-500/20 border border-orange-500/40 text-orange-400"
                          : task.priority === "P1"
                          ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                          : "bg-blue-500/20 border border-blue-500/40 text-blue-400"
                      )}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {task.date} {task.time}
                    </p>
                  </div>

                  {/* Add Button */}
                  {alreadyAdded ? (
                    <span className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-medium">
                      <Check className="w-3.5 h-3.5" />
                      已在日程中
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddSingle(task)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0099FF]/15 hover:bg-[#0099FF]/25 border border-[#0099FF]/40 rounded-lg text-[#0099FF] text-xs font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      添加
                    </button>
                  )}
                </div>

                {/* Expanded Details */}
                <div className={cn(
                  "grid transition-all duration-200 ease-out",
                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}>
                  <div className="overflow-hidden">
                    <div className="px-3 pb-3 pt-0 space-y-2 border-t border-white/5 mt-0">
                      <div className="pt-2" />
                      
                      {/* Time Detail */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs text-gray-400">时间：</span>
                        <span className="text-xs text-white">{task.date} {task.time} - 16:30</span>
                      </div>

                      {/* Location Detail with Copy */}
                      {task.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs text-gray-400">参与方式：</span>
                          <span className="text-xs text-[#0099FF]">腾讯会议</span>
                          <button 
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0099FF]/15 hover:bg-[#0099FF]/25 border border-[#0099FF]/30 rounded transition-colors"
                          >
                            <span className="text-xs text-[#0099FF] font-mono">100-***-284</span>
                            {copied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-[#0099FF]" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Priority Detail */}
                      <div className="flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-xs text-gray-400">优先级：</span>
                        <span className={cn(
                          "text-xs font-medium",
                          task.priority === "P0" ? "text-orange-400" : 
                          task.priority === "P1" ? "text-amber-400" : "text-blue-400"
                        )}>
                          {task.priority === "P0" ? "紧急重要" : 
                           task.priority === "P1" ? "重要" : "一般"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="px-5 pb-6 pt-2">
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-[#333] hover:bg-[#3d3d3d] text-gray-300 hover:text-white rounded-xl font-medium transition-colors"
            >
              关闭
            </button>
            {newTasksCount > 0 ? (
              <button 
                onClick={handleAddAllNew}
                className="flex-1 py-3 px-4 bg-[#0099FF] hover:bg-[#0088ee] text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-[#0099FF]/30"
              >
                收纳至今日行动计划
              </button>
            ) : (
              <button 
                onClick={onSaveToTimeline}
                className="flex-1 py-3 px-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-xl font-medium transition-colors"
              >
                查看日程
              </button>
            )}
          </div>
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  )
}
