"use client"

import { Search, MessageSquare, Hash, Users, Activity } from "lucide-react"
import { StatusBar } from "./status-bar"
import { useTaskStore } from "@/hooks/use-task-store"

interface ChatGroup {
  id: string
  name: string
  lastMessage: string
  time: string
  unreadCount?: number
  avatarColor: string
  avatarText?: string
}

interface ChatListProps {
  onSelectGroup: (groupId: string) => void
}

const chatGroups: ChatGroup[] = [
  {
    id: "group-3",
    name: "不鸽",
    lastMessage: "AI助手: 已为您整理今日待办事项",
    time: "", // Dynamic - will be set based on task state
    avatarColor: "from-blue-500 to-blue-600",
    avatarText: "不鸽",
  },
  {
    id: "group-4",
    name: "数学分析课程群(102)",
    lastMessage: "收到，谢谢老师。顺便问下第四题...",
    time: "上午9:45",
    unreadCount: 12,
    avatarColor: "from-orange-500 to-amber-500",
    avatarText: "数分",
  },
  {
    id: "group-2", 
    name: "xx大学xx专业通知群",
    lastMessage: "@所有人 就业指导课开课通知",
    time: "上午10:22",
    unreadCount: 1,
    avatarColor: "from-blue-500 to-cyan-500",
  },
  {
    id: "group-1",
    name: "XX大学开源安全奖励计划2025(295)",
    lastMessage: "[图片]",
    time: "上午10:14",
    unreadCount: 99,
    avatarColor: "from-purple-500 to-pink-500",
  },
]

export function ChatList({ onSelectGroup }: ChatListProps) {
  const { tasks } = useTaskStore()
  
  // Dynamic timestamp for 不鸽 - show "10:30" only if there are tasks
  const bugeTimestamp = tasks.length > 0 ? "10:30" : ""

  return (
    <div className="flex flex-col h-screen bg-[#111111]">
      {/* Unified Status Bar */}
      <StatusBar />

      {/* User Profile Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* User Avatar - Pigeon */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-200 to-sky-300 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-9 h-9">
              {/* Body */}
              <ellipse cx="50" cy="60" rx="28" ry="25" fill="#4a9ec9"/>
              {/* Head */}
              <circle cx="70" cy="35" r="16" fill="#5bb3d8"/>
              {/* Beak */}
              <polygon points="86,35 95,38 86,41" fill="#f59e0b"/>
              {/* Eye */}
              <circle cx="75" cy="32" r="3" fill="#111"/>
              <circle cx="76" cy="31" r="1" fill="white"/>
              {/* Wing */}
              <ellipse cx="45" cy="55" rx="18" ry="12" fill="#3d8cb8"/>
              {/* Tail */}
              <polygon points="22,55 10,50 10,70 22,65" fill="#3d8cb8"/>
              {/* Feet */}
              <line x1="42" y1="82" x2="38" y2="95" stroke="#f59e0b" strokeWidth="3"/>
              <line x1="55" y1="82" x2="58" y2="95" stroke="#f59e0b" strokeWidth="3"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">咕咕鸽</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-gray-400 text-xs">在线 - 5G</span>
              <span className="text-gray-500">{">"}</span>
            </div>
          </div>
        </div>
        <button className="text-white text-2xl font-light">+</button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-full px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400 text-sm">搜索</span>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chatGroups.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] active:bg-[#222] transition-colors"
          >
            {/* Group Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${group.avatarColor} flex items-center justify-center overflow-hidden`}>
                {group.avatarText ? (
                  <span className="text-white text-xs font-medium">{group.avatarText}</span>
                ) : (
                  <svg viewBox="0 0 100 100" className="w-8 h-8">
                    <ellipse cx="50" cy="38" rx="22" ry="24" fill="white"/>
                    <ellipse cx="50" cy="85" rx="30" ry="18" fill="white"/>
                    <circle cx="42" cy="35" r="3" fill="#333"/>
                    <circle cx="58" cy="35" r="3" fill="#333"/>
                  </svg>
                )}
              </div>
              {/* Unread Badge */}
              {group.unreadCount && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-white text-[10px] font-medium flex items-center justify-center">
                  {group.unreadCount > 99 ? "99+" : group.unreadCount}
                </span>
              )}
            </div>

            {/* Group Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-medium text-[15px] truncate">{group.name}</p>
                <span className="text-gray-500 text-xs flex-shrink-0">
                  {group.id === "group-3" ? bugeTimestamp : group.time}
                </span>
              </div>
              <p className="text-gray-400 text-sm truncate mt-0.5">{group.lastMessage}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-around py-3 bg-[#111111] border-t border-[#2a2a2a]">
        <button className="flex flex-col items-center gap-1 text-[#0099FF]">
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">消息</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500">
          <Hash className="w-5 h-5" />
          <span className="text-[10px]">频道</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500">
          <Users className="w-5 h-5" />
          <span className="text-[10px]">联系人</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500">
          <Activity className="w-5 h-5" />
          <span className="text-[10px]">动态</span>
        </button>
      </div>
    </div>
  )
}
