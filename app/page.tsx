"use client"

import { useState } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { ChatInterfaceNotice } from "@/components/chat-interface-notice"
import { ChatInterfaceBuge } from "@/components/chat-interface-buge"
import { ChatInterfaceMath } from "@/components/chat-interface-math"
import { ChatList } from "@/components/chat-list"
import { AiParsingOverlayNotice } from "@/components/ai-parsing-overlay-notice"
import { AiParsingOverlayCompact } from "@/components/ai-parsing-overlay-compact"
import { Task } from "@/hooks/use-task-store"

// Task data for Math Analysis group
const MATH_TASKS: Task[] = [
  {
    id: "math-homework-ch3",
    title: "第三章课后习题提交",
    date: "04-23",
    time: "20:00",
    location: "超星学习通 (手写扫描)",
    priority: "P1",
    notes: "老师发的具体题目要求",
    attachments: [
      {
        id: "att-math-1",
        name: "老师发送的截图.jpg",
        type: "image",
      }
    ],
  },
]

// Task data for Security Reward group (开源安全奖励计划)
const SECURITY_TASKS: Task[] = [
  {
    id: "security-experience-meeting",
    title: "奖励计划经验宣讲会",
    date: "04-22",
    time: "14:30",
    location: "腾讯会议 xxx-xxx-xxx",
    priority: "P1",
    notes: "重复周期：2026/04/22-2026/06/03，每周三 14:30-16:30\n入会链接：https://meeting.tencent.com/dm/xxxx",
    attachments: [
      {
        id: "att-meeting-1",
        name: "腾讯会议邀请.txt",
        type: "document",
      }
    ],
  },
]

interface ChatState {
  isUnread: boolean
  isMuted: boolean
}

// Chat group IDs for state initialization
const CHAT_GROUP_IDS = ["group-3", "group-4", "group-2", "group-1"]

export default function Home() {
  const [showOverlay, setShowOverlay] = useState(false)
  const [currentView, setCurrentView] = useState<"list" | "chat">("list")
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  
  // Lifted chat states - persists across view changes
  const [chatStates, setChatStates] = useState<Record<string, ChatState>>(() => {
    const initial: Record<string, ChatState> = {}
    CHAT_GROUP_IDS.forEach(id => {
      initial[id] = { isUnread: false, isMuted: false }
    })
    return initial
  })

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId)
    setCurrentView("chat")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setShowOverlay(false)
  }

  const handleSaveToTimeline = () => {
    setShowOverlay(false)
    setSelectedGroupId("group-3") // Navigate to BuGe chat
  }

  // Render different chat interfaces based on selected group
  const renderChatInterface = () => {
    // BuGe Agent chat (group-3)
    if (selectedGroupId === "group-3") {
      return (
        <ChatInterfaceBuge onBack={handleBackToList} />
      )
    }

    // Math Analysis group (group-4) - High noise scenario
    if (selectedGroupId === "group-4") {
      return (
        <>
          <ChatInterfaceMath 
            onSummonAgent={() => setShowOverlay(true)} 
            onBack={handleBackToList}
          />
          <AiParsingOverlayCompact 
            isOpen={showOverlay} 
            onClose={() => setShowOverlay(false)}
            onSaveToTimeline={handleSaveToTimeline}
            tasks={MATH_TASKS}
            title="不鸽 AI 解析完成"
          />
        </>
      )
    }

    // Notice group chat (group-2)
    if (selectedGroupId === "group-2") {
      return (
        <>
          <ChatInterfaceNotice 
            onSummonAgent={() => setShowOverlay(true)} 
            onBack={handleBackToList}
          />
          <AiParsingOverlayNotice 
            isOpen={showOverlay} 
            onClose={() => setShowOverlay(false)}
            onSaveToTimeline={handleSaveToTimeline}
          />
        </>
      )
    }
    
    // Default chat interface for group-1 (开源安全奖励计划)
    return (
      <>
        <ChatInterface 
          onSummonAgent={() => setShowOverlay(true)} 
          onBack={handleBackToList}
        />
        <AiParsingOverlayCompact 
          isOpen={showOverlay} 
          onClose={() => setShowOverlay(false)}
          onSaveToTimeline={handleSaveToTimeline}
          tasks={SECURITY_TASKS}
          title="不鸽 AI 解析完成"
        />
      </>
    )
  }

  return (
    <main className="relative min-h-screen bg-[#1a1a1a] max-w-md mx-auto overflow-hidden">
      {currentView === "list" ? (
        <ChatList 
          onSelectGroup={handleSelectGroup}
          chatStates={chatStates}
          setChatStates={setChatStates}
        />
      ) : (
        renderChatInterface()
      )}
    </main>
  )
}
