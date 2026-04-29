"use client"

import { ArrowLeft, Menu, Mic, Smile, Plus } from "lucide-react"
import { getRelativeGroupDates, NOTICE_MESSAGE_IDS } from "@/lib/group-parse-inputs"
import { useTaskStore } from "@/hooks/use-task-store"
import { cn } from "@/lib/utils"
import { StatusBar } from "./status-bar"
import { SummonAgentButton } from "./summon-agent-button"

interface ChatInterfaceNoticeProps {
  onSummonAgent: () => void | Promise<void>
  onBack: () => void
  isParsing?: boolean
}

export function ChatInterfaceNotice({ onSummonAgent, onBack, isParsing = false }: ChatInterfaceNoticeProps) {
  const { tomorrowFullLabel, tomorrowWeekday, tomorrowLabel } = getRelativeGroupDates()
  const { processedMessageIds } = useTaskStore()
  const currentYear = new Date().getFullYear()
  const innovationNoticeProcessed = processedMessageIds.includes(
    NOTICE_MESSAGE_IDS.innovationNotice,
  )
  const careerCourseProcessed = processedMessageIds.includes(
    NOTICE_MESSAGE_IDS.careerCourseNotice,
  )

  return (
    <div className="flex flex-col h-screen bg-[#111111]">
      {/* Unified Status Bar */}
      <StatusBar />

      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 bg-[#111111]">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-white hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-1.5">
          <h1 className="text-base font-medium text-white">
            XX大学网安专业通知群(56)
          </h1>
        </div>
        <button className="p-2 -mr-2 text-white hover:text-gray-300 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Chat Timeline */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-4">
        {/* Message 1 - 学习委员 */}
        <div className="flex gap-2.5 items-start">
          {/* Avatar - Teal */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center">
            <span className="text-white text-sm font-medium">学委</span>
          </div>

          <div className="flex-1 max-w-[300px]">
            {/* Sender name */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm text-gray-400">学习委员</span>
              {innovationNoticeProcessed && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">
                  ✅ 已添加入库
                </span>
              )}
            </div>

            {/* Message Content */}
            <div
              className={cn(
                "rounded-lg p-4",
                innovationNoticeProcessed ? "bg-[#262b38]/70 opacity-80" : "bg-[#262b38]",
              )}
            >
              <p className="text-white text-[15px] leading-relaxed whitespace-pre-line">
{`【活动预告】"赢在创新大赛"第二十三季第一期
时间：${tomorrowFullLabel}（${tomorrowWeekday}）14:30
地点：***校区***负一层报告厅
承办学院：法学院/知识产权学院
请提前15分钟微信签到入场。满10次计两个创新学分，先到先得。
比赛通知链接：`}
              </p>
              <a href="#" className="text-[#5b9bd5] text-[15px] leading-relaxed underline block break-all">
                {`https://***.edu.cn/${currentYear}/0421/***`}
              </a>
            </div>
          </div>
        </div>

        {/* Time indicator */}
        <div className="flex justify-center">
          <span className="text-sm text-gray-500">
            上午10:22
          </span>
        </div>

        {/* Message 2 - 辅导员 */}
        <div className="flex gap-2.5 items-start">
          {/* Avatar - Amber */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="text-white text-sm font-medium">辅导</span>
          </div>

          <div className="flex-1 max-w-[300px]">
            {/* Sender name */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm text-gray-400">辅导员</span>
              {careerCourseProcessed && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">
                  ✅ 已添加入库
                </span>
              )}
            </div>

            {/* Message Content */}
            <div
              className={cn(
                "rounded-lg p-4",
                careerCourseProcessed ? "bg-[#262b38]/70 opacity-80" : "bg-[#262b38]",
              )}
            >
              <p className="text-white text-[15px] leading-relaxed whitespace-pre-line">
{`【就业指导课开课通知】
明天${tomorrowLabel}14点30分，***课室，企业导师给大家授课【简历制作与指导】，大家请携带好简历,课堂上再根据老师的指导完善修改！`}
              </p>
              <p className="text-[#5b9bd5] text-[15px] mt-2">@所有人</p>
            </div>
          </div>
        </div>

        {/* Summon Agent Button - Reusable component inside scrollable area */}
        <SummonAgentButton onSummonAgent={onSummonAgent} isLoading={isParsing} />
      </div>

      {/* Input area - QQ style */}
      <div className="p-3 bg-[#111111] border-t border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Mic className="w-6 h-6" />
          </button>
          <div className="flex-1 bg-[#2a2a2a] rounded-full px-4 py-2">
            <input 
              type="text"
              placeholder=""
              className="w-full bg-transparent text-white text-sm outline-none"
            />
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Smile className="w-6 h-6" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
