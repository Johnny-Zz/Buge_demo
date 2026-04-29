"use client"

import { useEffect, useState } from "react"
import { X, Sparkles, CheckCircle2, ChevronDown, Clock, MapPin, Flame, Check, AlertTriangle, Pencil, Save, Inbox, Paperclip, FileImage, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTaskStore, Task } from "@/hooks/use-task-store"

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

interface AiParsingOverlayNoticeProps {
  isOpen: boolean
  onClose: () => void
  onSaveToTimeline: () => void
  tasks: Task[]
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

export function AiParsingOverlayNotice({ isOpen, onClose, onSaveToTimeline, tasks }: AiParsingOverlayNoticeProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)
  const { addTask, addToInbox, removeFromInbox, removeTask, tasks: storeTasks, inboxTasks } = useTaskStore()

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setExpandedIds(new Set())
      setEditingId(null)
      setLocalTasks(tasks)
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
  }, [isOpen, tasks])

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
    if (task.isExpired) {
      return
    }
    addTask(task)
  }

  const handleRemoveFromSchedule = (task: Task) => {
    // Find the task in store by title and remove it
    const storeTask = storeTasks.find(t => t.title === task.title)
    if (storeTask) {
      removeTask(storeTask.id)
    }
  }

  const handleRemoveFromInbox = (task: Task) => {
    // Find the task in inbox by title and remove it
    const inboxTask = inboxTasks.find(t => t.title === task.title)
    if (inboxTask) {
      removeFromInbox(inboxTask.id)
    }
  }

  const handleAddAllNew = () => {
    localTasks.forEach(task => {
      if (!task.isExpired && !isTaskInStore(task)) {
        addTask(task)
      }
    })
    onSaveToTimeline()
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

  // Check if task is already in store or inbox by matching title
  const isTaskInStore = (task: Task) => {
    return storeTasks.some(t => t.title === task.title)
  }
  
  const isTaskInInbox = (task: Task) => {
    return inboxTasks.some(t => t.title === task.title)
  }

  const handleAddToInbox = (task: Task) => {
    addToInbox(task)
  }

  // Count how many tasks are not yet added
  const newTasksCount = localTasks.filter(
    (task) => !task.isExpired && !isTaskInStore(task),
  ).length
  const sortedTasks = [...localTasks].sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date)
    if (dateComparison !== 0) {
      return dateComparison
    }

    return timeToMinutes(a.time) - timeToMinutes(b.time)
  })
  const tightSchedulePair = sortedTasks.find((task, index) => {
    const nextTask = sortedTasks[index + 1]

    if (!nextTask || task.date !== nextTask.date) {
      return false
    }

    return timeToMinutes(nextTask.time) - timeToMinutes(task.time) < 90
  })

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
          {/* Conflict Warning Banner */}
          {tightSchedulePair && (
            <div className="flex items-start gap-3 p-3 bg-red-500/15 border border-red-500/40 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400 leading-relaxed">
                  风险预警：检测到相邻任务时间较紧，请在加入日程前确认转场和准备时间。
                </p>
              </div>
            </div>
          )}

          {/* Extracted Tasks Summary */}
          <p className="text-sm text-gray-400">
            已从聊天中智能提取 <span className="text-[#0099FF] font-medium">{localTasks.length}</span> 项待办任务
          </p>

          {localTasks.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-center">
              <p className="text-sm text-white">这段通知里暂未识别出明确待办</p>
              <p className="mt-1 text-xs text-gray-500">可以稍后重试，或手动补充更明确的行动信息</p>
            </div>
          )}

          {/* Compact Task List */}
          {localTasks.map((task) => {
            const isExpanded = expandedIds.has(task.id)
            const alreadyAdded = isTaskInStore(task)
            const isEditing = editingId === task.id
            const isExpired = Boolean(task.isExpired)

            return (
              <div 
                key={task.id}
                className={cn(
                  "bg-[#2a2a2a]/80 backdrop-blur-sm rounded-xl border transition-all duration-200",
                  isExpired
                    ? "border-white/10 bg-zinc-900/70"
                    : alreadyAdded
                    ? "border-emerald-500/30"
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
                      {isExpired ? (
                        <span className="flex-shrink-0 rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                          已过期
                        </span>
                      ) : (
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
                      {task.date} {task.time}
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
                    ) : isTaskInInbox(task) ? (
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
                        {/* Add to Schedule Button */}
                        <button
                          onClick={() => handleAddSingle(task)}
                          disabled={isExpired}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors",
                            isExpired
                              ? "cursor-not-allowed border border-white/10 bg-white/5 text-gray-500"
                              : "bg-[#0099FF]/15 hover:bg-[#0099FF]/25 border border-[#0099FF]/40 text-[#0099FF]"
                          )}
                          title="添加到日程"
                        >
                          <ArrowRight className="w-3 h-3" />
                          加入日程
                        </button>
                        {/* Save to Inbox Button */}
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
                            <span className="text-xs text-white">{task.date} {task.time}</span>
                          </div>

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
                            <span className="text-xs text-gray-400">{isExpired ? "状态：" : "优先级："}</span>
                            {isExpired ? (
                              <span className="text-xs font-medium text-red-400">已过期</span>
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
