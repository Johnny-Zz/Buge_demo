"use client"

import { useEffect, useState } from "react"
import { X, Sparkles, CheckCircle2, ChevronDown, Clock, MapPin, Flame, Check, Inbox, Pencil, Save, Paperclip, FileImage, ArrowRight, Bell, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { checkTaskBufferWarning, checkTaskConflict, hasTightBuffer, hasTimeOverlap, isSameTaskIdentity, useTaskStore, Task } from "@/hooks/use-task-store"
import { checkCourseBufferWarning, checkCourseConflict, useCourseStore } from "@/hooks/use-course-store"
import { toast } from "@/hooks/use-toast"

function formatTaskTime(task: Task) {
  return task.endTime ? `${task.date} ${task.time}-${task.endTime}` : `${task.date} ${task.time}`
}

// Comprehensive Inline Edit Form Component
function InlineEditForm({ 
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
  // Attachment descriptions as comma-separated text
  const [attachmentText, setAttachmentText] = useState(
    task.attachments?.map(a => a.name).join(", ") || ""
  )

  const handleSave = () => {
    // Parse attachment text into attachment objects
    const attachments = attachmentText.trim() 
      ? attachmentText.split(",").map((name, idx) => ({
          id: `att-edit-${idx}`,
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
    <div className="space-y-3">
      {/* Title Input */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">任务名称</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-sky-500/50"
        />
      </div>
      
      {/* Priority Dropdown */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">优先级</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as "P0" | "P1" | "P2")}
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-sky-500/50"
        >
          <option value="P0">P0 - 紧急重要</option>
          <option value="P1">P1 - 重要</option>
          <option value="P2">P2 - 一般</option>
        </select>
      </div>
      
      {/* Date & Time Row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">日期</label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="04-23"
            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-sky-500/50"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">时间</label>
          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="14:30"
            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-sky-500/50"
          />
        </div>
      </div>
      
      {/* Location Input */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">地点</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="可选"
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-sky-500/50"
        />
      </div>
      
      {/* Notes Textarea */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">备注</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="添加备注或提醒..."
          rows={2}
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-sky-500/50 resize-none"
        />
      </div>

      {/* Attachments Input */}
      <div>
        <label className="text-xs text-gray-500 block mb-1">补充信息 (附件描述，逗号分隔)</label>
        <input
          type="text"
          value={attachmentText}
          onChange={(e) => setAttachmentText(e.target.value)}
          placeholder="例如：报名表.jpg, 简历.pdf"
          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-sky-500/50"
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-emerald-400 text-xs font-medium transition-colors"
        >
          <Save className="w-3 h-3" />
          保存
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/40 rounded-lg text-gray-400 text-xs font-medium transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  )
}

interface AiParsingOverlayCompactProps {
  isOpen: boolean
  onClose: () => void
  onSaveToTimeline: (targetDate?: string) => void
  tasks: Task[]
  title?: string
}

interface TaskWarningState {
  isExpired: boolean
  hasConflict: boolean
  isTight: boolean
  conflictMessage: string | null
}

export function AiParsingOverlayCompact({ 
  isOpen, 
  onClose, 
  onSaveToTimeline,
  tasks: initialTasks,
  title = "不鸽 AI 解析完成"
}: AiParsingOverlayCompactProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks)
  const { addTask, addToInbox, removeFromInbox, removeTask, tasks: storeTasks, inboxTasks, markMessageAsProcessed } = useTaskStore()
  const { courses } = useCourseStore()

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setExpandedIds(new Set())
      setEditingId(null)
      setLocalTasks(initialTasks)
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
  }, [isOpen, initialTasks])

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

  const handleAddSingle = (task: Task) => {
    const warningState = getTaskWarningState(task)

    if (warningState.hasConflict) {
      toast({
        title: "时空冲突：检测到任务时间重叠！",
        description: warningState.conflictMessage || "该时间段已存在其他日程。",
        variant: "destructive",
      })
    }

    if (warningState.isExpired) {
      return
    }

    addTask(task)
    if (task.sourceMessageId) {
      markMessageAsProcessed(task.sourceMessageId)
    }
  }

  const handleRemoveFromSchedule = (task: Task) => {
    const storeTask = storeTasks.find((currentTask) =>
      isSameTaskIdentity(currentTask, task),
    )
    if (storeTask) {
      removeTask(storeTask.id)
    }
  }

  const handleRemoveFromInbox = (task: Task) => {
    const inboxTask = inboxTasks.find((currentTask) =>
      isSameTaskIdentity(currentTask, task),
    )
    if (inboxTask) {
      removeFromInbox(inboxTask.id)
    }
  }

  const handleAddAllNew = () => {
    const tasksToAdd = localTasks.filter(
      (task) => {
        const warningState = warningStateById.get(task.id)
        return !warningState?.isExpired && !isTaskInStore(task) && !isTaskInInbox(task)
      },
    )
    const plannedTasks = [...storeTasks]
    const addedDates: string[] = []
    const conflictMessages: string[] = []

    tasksToAdd.forEach((task) => {
      const hardConflictMessage = getHardConflictMessage(task, plannedTasks)

      if (hardConflictMessage) {
        conflictMessages.push(hardConflictMessage)
      }

      addTask(task)
      plannedTasks.push(task)
      addedDates.push(task.date)

      if (task.sourceMessageId) {
        markMessageAsProcessed(task.sourceMessageId)
      }
    })

    if (conflictMessages.length > 0) {
      toast({
        title: "时空冲突：检测到任务时间重叠！",
        description: conflictMessages[0],
        variant: "destructive",
      })
    }

    if (addedDates.length === 0) {
      return
    }

    onSaveToTimeline(addedDates[0] ?? localTasks[0]?.date)
  }

  const handleAddToInbox = (task: Task) => {
    addToInbox(task)
  }

  const handleStartEdit = (taskId: string) => {
    setEditingId(taskId)
    setExpandedIds(prev => new Set([...prev, taskId]))
  }

  const handleSaveEdit = (taskId: string, updates: Partial<Task>) => {
    setLocalTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    ))
    setEditingId(null)
  }

  // Check if task is already in store by matching title
  const isTaskInStore = (task: Task) => {
    return storeTasks.some((currentTask) => isSameTaskIdentity(currentTask, task))
  }
  
  const isTaskInInbox = (task: Task) => {
    return inboxTasks.some((currentTask) => isSameTaskIdentity(currentTask, task))
  }

  const getTaskDayOfWeek = (task: Task) => {
    const [month, day] = task.date.split("-").map(Number)
    const year = new Date().getFullYear()
    const taskDate = new Date(year, month - 1, day)
    const jsDay = taskDate.getDay()
    return jsDay === 0 ? 7 : jsDay
  }

  const getHardConflictMessage = (task: Task, existingTasks: Task[]) => {
    const taskConflict = checkTaskConflict(
      { date: task.date, time: task.time, endTime: task.endTime },
      existingTasks,
    )

    if (taskConflict) {
      return `时间冲突：与【${taskConflict.title}】(${taskConflict.time}-${taskConflict.endTime || taskConflict.time}) 重叠`
    }

    const dayOfWeek = getTaskDayOfWeek(task)
    const coursesOnDay = courses.filter((course) => course.dayOfWeek === dayOfWeek)
    const courseConflict = checkCourseConflict(
      { startTime: task.time, endTime: task.endTime || task.time, dayOfWeek },
      coursesOnDay,
    )

    if (courseConflict) {
      return `时间冲突：与课程【${courseConflict.name}】(${courseConflict.startTime}-${courseConflict.endTime}) 重叠`
    }

    return null
  }

  const getTaskWarningState = (task: Task): TaskWarningState => {
    const isExpired = Boolean(task.isExpired)
    const scheduleConflictMessage = getHardConflictMessage(task, storeTasks)
    const parsedConflictTask = localTasks.find((otherTask) =>
      otherTask.id !== task.id &&
      otherTask.date === task.date &&
      hasTimeOverlap(
        { startTime: task.time, endTime: task.endTime },
        { startTime: otherTask.time, endTime: otherTask.endTime },
      ),
    )
    const parsedConflictMessage = parsedConflictTask
      ? `时间冲突：与待确认任务【${parsedConflictTask.title}】(${parsedConflictTask.time}-${parsedConflictTask.endTime || parsedConflictTask.time}) 重叠`
      : null
    const conflictMessage = scheduleConflictMessage || parsedConflictMessage
    const hasConflict = Boolean(conflictMessage)

    const dayOfWeek = getTaskDayOfWeek(task)
    const coursesOnDay = courses.filter((course) => course.dayOfWeek === dayOfWeek)
    const taskBufferWarning = checkTaskBufferWarning(
      { date: task.date, time: task.time, endTime: task.endTime },
      storeTasks,
    )
    const courseBufferWarning = checkCourseBufferWarning(
      { startTime: task.time, endTime: task.endTime || task.time, dayOfWeek },
      coursesOnDay,
    )
    const parsedTightTask = localTasks.find((otherTask) =>
      otherTask.id !== task.id &&
      otherTask.date === task.date &&
      hasTightBuffer(
        { startTime: task.time, endTime: task.endTime },
        { startTime: otherTask.time, endTime: otherTask.endTime },
      ),
    )

    return {
      isExpired,
      hasConflict,
      isTight: !hasConflict && Boolean(taskBufferWarning || courseBufferWarning || parsedTightTask),
      conflictMessage,
    }
  }

  const warningStateById = new Map(
    localTasks.map((task) => [task.id, getTaskWarningState(task)]),
  )
  const addableTasks = localTasks.filter((task) => {
    const warningState = warningStateById.get(task.id)
    return !warningState?.isExpired && !isTaskInStore(task) && !isTaskInInbox(task)
  })
  const newTasksCount = addableTasks.length
  const scheduleAlertLevel: "overlap" | "buffer" | null = localTasks.some(
    (task) => warningStateById.get(task.id)?.hasConflict,
  )
    ? "overlap"
    : localTasks.some((task) => warningStateById.get(task.id)?.isTight)
    ? "buffer"
    : null

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
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
              <h2 className="text-lg font-semibold text-white">{title}</h2>
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

        {/* Extracted Tasks Summary */}
        <div className="px-5 pb-2">
          <p className="text-sm text-gray-400">
            已从聊天中智能提取 <span className="text-[#0099FF] font-medium">{localTasks.length}</span> 项待办任务
          </p>
        </div>

        <div className="px-5 pb-2">
          {scheduleAlertLevel === "overlap" && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-relaxed text-red-600">
                  时空冲突：检测到任务时间重叠！
                </p>
              </div>
            </div>
          )}
          {scheduleAlertLevel === "buffer" && (
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-relaxed text-orange-600">
                  转场提醒：相邻任务间隔小于10分钟，请注意安排转场。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content - Compact Task List */}
        <div className="px-5 pb-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {localTasks.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-center">
              <p className="text-sm text-white">这段聊天里暂未识别出明确待办</p>
              <p className="mt-1 text-xs text-gray-500">可以稍后重试，或手动补充更明确的时间与动作</p>
            </div>
          )}
          {localTasks.map((task) => {
            const isExpanded = expandedIds.has(task.id)
            const alreadyAdded = isTaskInStore(task)
            const isInbox = isTaskInInbox(task)
            const isEditing = editingId === task.id
            const warningState = warningStateById.get(task.id)
            const isExpired = Boolean(warningState?.isExpired)
            const hasConflict = Boolean(warningState?.hasConflict)
            const isTight = Boolean(warningState?.isTight)

            return (
              <div 
                key={task.id}
                className={cn(
                  "bg-[#2a2a2a]/80 backdrop-blur-sm rounded-xl border transition-all duration-200",
                  hasConflict
                    ? "border-red-500/40 bg-zinc-900/80"
                    : isExpired
                    ? "border-white/10 bg-zinc-900/70"
                    : isTight
                    ? "border-orange-500/30 bg-orange-500/5"
                    : alreadyAdded
                    ? "border-emerald-500/30"
                    : isInbox
                    ? "border-amber-500/30"
                    : "border-white/5"
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
                      <span className={cn(
                        "text-sm font-medium truncate",
                        isExpired ? "text-gray-400" : "text-white",
                      )}>
                        {task.title}
                      </span>
                      {task.reminder === "30m" && (
                        <Bell className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                      )}
                      {isExpired && (
                        <span className="ml-2 flex-shrink-0 rounded bg-red-100 px-1 py-0.5 text-xs text-red-500">
                          [已过期]
                        </span>
                      )}
                      {hasConflict && (
                        <span className="flex-shrink-0 rounded bg-red-100 px-1 py-0.5 text-xs text-red-500">
                          [时间冲突]
                        </span>
                      )}
                      {!isExpired && !hasConflict && (
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
                      )}
                    </div>
                    <p className={cn(
                      "text-xs mt-0.5",
                      isExpired ? "text-gray-600" : "text-gray-500",
                    )}>
                      {formatTaskTime(task)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Edit Button - Always visible */}
                    <button
                      onClick={() => handleStartEdit(task.id)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                      title="编辑"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    
                    {alreadyAdded ? (
                      /* Toggleable: Click to remove from schedule */
                      <button
                        onClick={() => handleRemoveFromSchedule(task)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-emerald-500/10 hover:bg-red-500/10 border border-emerald-500/30 hover:border-red-500/30 rounded-lg text-emerald-400 hover:text-red-400 text-[10px] font-medium transition-colors group"
                        title="点击移出日程"
                      >
                        <Check className="w-3 h-3 group-hover:hidden" />
                        <X className="w-3 h-3 hidden group-hover:block" />
                        <span className="group-hover:hidden">已在日程中</span>
                        <span className="hidden group-hover:inline">移出日程</span>
                      </button>
                    ) : isInbox ? (
                      /* Toggleable: Click to remove from inbox */
                      <button
                        onClick={() => handleRemoveFromInbox(task)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-amber-500/10 hover:bg-red-500/10 border border-amber-500/30 hover:border-red-500/30 rounded-lg text-amber-400 hover:text-red-400 text-[10px] font-medium transition-colors group"
                        title="点击取消暂存"
                      >
                        <Inbox className="w-3 h-3 group-hover:hidden" />
                        <X className="w-3 h-3 hidden group-hover:block" />
                        <span className="group-hover:hidden">已暂存</span>
                        <span className="hidden group-hover:inline">取消暂存</span>
                      </button>
                    ) : (
                      <>
                        {/* Add to Schedule */}
                        <button
                          onClick={() => handleAddSingle(task)}
                          disabled={isExpired}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors",
                            isExpired
                              ? "cursor-not-allowed border border-gray-300 bg-gray-300 text-gray-500"
                              : "bg-[#0099FF]/15 hover:bg-[#0099FF]/25 border border-[#0099FF]/40 text-[#0099FF]"
                          )}
                          title="添加到日程"
                        >
                          <ArrowRight className="w-3 h-3" />
                          加入日程
                        </button>
                        {/* Save to Inbox */}
                        <button
                          onClick={() => handleAddToInbox(task)}
                          className="flex items-center gap-1 px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-[10px] font-medium transition-colors"
                          title="暂存到收集栏"
                        >
                          <Inbox className="w-3 h-3" />
                          暂存
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Details / Edit Form */}
                <div className={cn(
                  "grid transition-all duration-200 ease-out",
                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}>
                  <div className="overflow-hidden">
                    <div className="px-3 pb-3 pt-0 space-y-2 border-t border-white/5 mt-0">
                      <div className="pt-2" />
                      
                      {isEditing ? (
                        /* Inline Edit Form */
                        <InlineEditForm 
                          task={task} 
                          onSave={(updates) => handleSaveEdit(task.id, updates)}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        /* Read-only Details */
                        <>
                          {/* Time Detail */}
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs text-gray-400">时间：</span>
                            <span className="text-xs text-white">{formatTaskTime(task)}</span>
                          </div>

                          {task.reminder === "30m" && (
                            <div className="flex items-center gap-2">
                              <Bell className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-xs text-gray-400">提醒：</span>
                              <span className="text-xs text-amber-300">提前30分钟提醒</span>
                            </div>
                          )}

                          {/* Location Detail */}
                          {task.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-xs text-gray-400">地点：</span>
                              <span className="text-xs text-white">{task.location}</span>
                            </div>
                          )}

                          {/* Priority Detail */}
                          <div className="flex items-center gap-2">
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-xs text-gray-400">{isExpired || hasConflict || isTight ? "状态：" : "优先级："}</span>
                            {isExpired || hasConflict || isTight ? (
                              <span className="text-xs font-medium text-red-400">
                                {[
                                  isExpired ? "已过期" : null,
                                  hasConflict ? "时间冲突" : null,
                                  !hasConflict && isTight ? "转场过紧" : null,
                                ]
                                  .filter(Boolean)
                                  .join(" / ")}
                              </span>
                            ) : (
                              <span className={cn(
                                "text-xs font-medium",
                                task.priority === "P0" ? "text-orange-400" : 
                                task.priority === "P1" ? "text-amber-400" : "text-blue-400"
                              )}>
                                {task.priority === "P0" ? "紧急重要" : 
                                 task.priority === "P1" ? "重要" : "一般"}
                              </span>
                            )}
                          </div>

                          {/* Notes Display */}
                          {task.notes && (
                            <div className="flex items-start gap-2 p-2 bg-sky-500/10 rounded-lg border border-sky-500/20 mt-2">
                              <Paperclip className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                              <p className="text-sky-300 text-xs leading-relaxed">{task.notes}</p>
                            </div>
                          )}

                          {/* Attachments Display */}
                          {task.attachments && task.attachments.length > 0 && (
                            <div className="pt-2 space-y-2">
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Paperclip className="w-3 h-3" />
                                附件信息
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {task.attachments.map((attachment) => (
                                  <div 
                                    key={attachment.id}
                                    className="flex items-center gap-2 px-2 py-1.5 bg-white/5 rounded-lg border border-white/10"
                                  >
                                    <FileImage className="w-4 h-4 text-purple-400" />
                                    <span className="text-xs text-gray-300">{attachment.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
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
                收纳全部未添加项 ({newTasksCount})
              </button>
            ) : (
              <button 
                onClick={() => onSaveToTimeline(localTasks.find((task) => !task.isExpired)?.date)}
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
