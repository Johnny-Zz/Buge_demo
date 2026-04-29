"use client"

import { useState } from "react"
import { callBugeAi, aiTaskToStoreTask, buildAiContext, createChatRouteRequest } from "@/lib/ai/client"
import { ChatInterface } from "@/components/chat-interface"
import { ChatInterfaceNotice } from "@/components/chat-interface-notice"
import { ChatInterfaceBuge } from "@/components/chat-interface-buge"
import { ChatInterfaceMath } from "@/components/chat-interface-math"
import { ChatList } from "@/components/chat-list"
import { AiParsingOverlayNotice } from "@/components/ai-parsing-overlay-notice"
import { AiParsingOverlayCompact } from "@/components/ai-parsing-overlay-compact"
import { toast } from "@/hooks/use-toast"
import { GROUP_PARSE_INPUTS } from "@/lib/group-parse-inputs"
import type { Task } from "@/hooks/use-task-store"

interface ChatState {
  isUnread: boolean
  isMuted: boolean
}

type ParseGroupId = "group-1" | "group-2" | "group-4"

// Chat group IDs for state initialization
const CHAT_GROUP_IDS = ["group-3", "group-4", "group-2", "group-1"]

export default function Home() {
  const [showOverlay, setShowOverlay] = useState(false)
  const [currentView, setCurrentView] = useState<"list" | "chat">("list")
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [parsedTasksByGroup, setParsedTasksByGroup] = useState<Record<ParseGroupId, Task[]>>({
    "group-1": [],
    "group-2": [],
    "group-4": [],
  })
  const [isParsingByGroup, setIsParsingByGroup] = useState<Record<ParseGroupId, boolean>>({
    "group-1": false,
    "group-2": false,
    "group-4": false,
  })
  
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

  const handleSummonGroupAgent = async (groupId: ParseGroupId) => {
    if (isParsingByGroup[groupId]) return

    setIsParsingByGroup((prev) => ({ ...prev, [groupId]: true }))

    try {
      const response = await callBugeAi(
        createChatRouteRequest(
          "group_parse",
          GROUP_PARSE_INPUTS[groupId],
          buildAiContext({}),
        ),
      )

      const parsedTasks = (Array.isArray(response) ? response : [response]).map((task, index) =>
        aiTaskToStoreTask(task, `${groupId}-${index}`),
      )

      setParsedTasksByGroup((prev) => ({
        ...prev,
        [groupId]: parsedTasks,
      }))
      setShowOverlay(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : "请稍后重试"
      toast({
        title: "不鸽 Agent 解析失败",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsParsingByGroup((prev) => ({ ...prev, [groupId]: false }))
    }
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
            onSummonAgent={() => handleSummonGroupAgent("group-4")}
            onBack={handleBackToList}
            isParsing={isParsingByGroup["group-4"]}
          />
          <AiParsingOverlayCompact 
            isOpen={showOverlay} 
            onClose={() => setShowOverlay(false)}
            onSaveToTimeline={handleSaveToTimeline}
            tasks={parsedTasksByGroup["group-4"]}
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
            onSummonAgent={() => handleSummonGroupAgent("group-2")}
            onBack={handleBackToList}
            isParsing={isParsingByGroup["group-2"]}
          />
          <AiParsingOverlayNotice 
            isOpen={showOverlay} 
            onClose={() => setShowOverlay(false)}
            onSaveToTimeline={handleSaveToTimeline}
            tasks={parsedTasksByGroup["group-2"]}
          />
        </>
      )
    }
    
    // Default chat interface for group-1 (开源安全奖励计划)
    return (
      <>
        <ChatInterface 
          onSummonAgent={() => handleSummonGroupAgent("group-1")}
          onBack={handleBackToList}
          isParsing={isParsingByGroup["group-1"]}
        />
        <AiParsingOverlayCompact 
          isOpen={showOverlay} 
          onClose={() => setShowOverlay(false)}
          onSaveToTimeline={handleSaveToTimeline}
          tasks={parsedTasksByGroup["group-1"]}
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
