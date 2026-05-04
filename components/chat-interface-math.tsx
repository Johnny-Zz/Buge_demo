"use client"

import { ArrowLeft, Menu, Mic, Smile, Plus } from "lucide-react"
import { getRelativeGroupDates, MATH_MESSAGE_IDS } from "@/lib/group-parse-inputs"
import { useTaskStore } from "@/hooks/use-task-store"
import { handleMockClick } from "@/lib/demo-feedback"
import { cn } from "@/lib/utils"
import { StatusBar } from "./status-bar"
import { SummonAgentButton } from "./summon-agent-button"

interface ChatInterfaceMathProps {
  onSummonAgent: () => void | Promise<void>
  onBack: () => void
  isParsing?: boolean
}

export function ChatInterfaceMath({ onSummonAgent, onBack, isParsing = false }: ChatInterfaceMathProps) {
  const { tomorrowLabel } = getRelativeGroupDates()
  const { processedMessageIds } = useTaskStore()
  const homeworkNoticeProcessed = processedMessageIds.includes(
    MATH_MESSAGE_IDS.homeworkNotice,
  )

  return (
    <div className="flex flex-col h-screen bg-[#111111]">
      {/* Unified Status Bar */}
      <StatusBar />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#111111]">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-white hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-1">
          <h1 className="text-base font-medium text-white">
            数学分析课程群(102)
          </h1>
          <span className="text-gray-500 text-xs ml-1">🎓</span>
        </div>
        <button
          onClick={handleMockClick}
          className="cursor-default p-2 -mr-2 text-white opacity-70"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Chat Timeline */}
      <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-4">
        {/* Time indicator */}
        <div className="flex justify-center pt-2">
          <span className="text-sm text-gray-500">
            上午9:30
          </span>
        </div>

        {/* Message 1 - Student A asking about math proof */}
        <div className="flex gap-2.5 items-start">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">同学A</span>
          </div>
          <div className="flex-1 max-w-[280px]">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm text-gray-400">同学A</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl rounded-tl-sm p-3">
              <p className="text-white text-[15px] leading-relaxed">
                大家讨论一下，关于函数一致连续性的证明，这里取 δ = ε/2 为什么不行？
              </p>
            </div>
          </div>
        </div>

        {/* Message 2 - TA responding */}
        <div className="flex gap-2.5 items-start">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <span className="text-white text-xs font-medium">助教</span>
          </div>
          <div className="flex-1 max-w-[280px]">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">助教</span>
              <span className="text-sm text-gray-400">李助教</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl rounded-tl-sm p-3">
              <p className="text-white text-[15px] leading-relaxed">
                因为你在闭区间上无法保证 δ 的取值对所有点都成立，需要考虑区间端点的特殊情况...
              </p>
            </div>
          </div>
        </div>

        {/* Time indicator */}
        <div className="flex justify-center">
          <span className="text-sm text-gray-500">
            上午9:42
          </span>
        </div>

        {/* Message 3 - Teacher's Assignment Notice [THE SIGNAL] */}
        <div className="flex gap-2.5 items-start">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <span className="text-white text-xs font-medium">老师</span>
          </div>
          <div className="flex-1 max-w-[300px]">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-orange-400 bg-orange-500/20 px-1.5 py-0.5 rounded">老师</span>
              <span className="text-sm text-gray-400">王教授</span>
              {homeworkNoticeProcessed && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">
                  ✅ 已添加入库
                </span>
              )}
            </div>
            <div
              className={cn(
                "border border-orange-500/30 backdrop-blur-sm rounded-xl rounded-tl-sm p-3",
                homeworkNoticeProcessed ? "bg-orange-500/5 opacity-75" : "bg-orange-500/10",
              )}
            >
              <p className="text-orange-300 text-[13px] font-medium mb-2">【作业提交通知】</p>
              <p className="text-white text-[15px] leading-relaxed">
                请大家在明天（{tomorrowLabel}）晚上20:00前，将第三章课后习题证明（手写版扫描件）上传至超星学习通。
              </p>
              <p className="text-white text-[15px] leading-relaxed mt-2">
                命名格式：学号-姓名-第三章作业。
              </p>
              <p className="text-red-400 text-[14px] font-medium mt-2">
                逾期不候！
              </p>
            </div>
          </div>
        </div>

        {/* Message 4 - Student B responding */}
        <div className="flex gap-2.5 items-start">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">同学B</span>
          </div>
          <div className="flex-1 max-w-[280px]">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm text-gray-400">同学B</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl rounded-tl-sm p-3">
              <p className="text-white text-[15px] leading-relaxed">
                收到，谢谢老师。顺便问下第四题的积分区间是 [0,1] 还是 [0, +∞) ？
              </p>
            </div>
          </div>
        </div>

        {/* Summon Agent Button - Reusable component inside scrollable area */}
        <SummonAgentButton onSummonAgent={onSummonAgent} isLoading={isParsing} />
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#111111] border-t border-[#2a2a2a]">
        <button
          onClick={handleMockClick}
          className="cursor-default p-2 text-gray-400 opacity-70"
        >
          <Mic className="w-6 h-6" />
        </button>
        <div className="flex-1 bg-[#2a2a2a] rounded-full px-4 py-2">
          <input 
            type="text" 
            placeholder="" 
            onClick={handleMockClick}
            className="w-full cursor-default bg-transparent text-sm text-white outline-none"
            readOnly
          />
        </div>
        <button
          onClick={handleMockClick}
          className="cursor-default p-2 text-gray-400 opacity-70"
        >
          <Smile className="w-6 h-6" />
        </button>
        <button
          onClick={handleMockClick}
          className="cursor-default p-2 text-gray-400 opacity-70"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Safe area */}
      <div className="h-1 bg-[#111111]" />
    </div>
  )
}
