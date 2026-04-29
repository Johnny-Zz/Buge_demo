"use client"

import { Loader2, Sparkles } from "lucide-react"

interface SummonAgentButtonProps {
  onSummonAgent: () => void | Promise<void>
  isLoading?: boolean
}

/**
 * Reusable Summon Agent Button - Used consistently across all chat interfaces
 * This component renders inside the scrollable chat area, not as a floating element.
 * It triggers the AI parsing overlay when clicked.
 */
export function SummonAgentButton({ onSummonAgent, isLoading = false }: SummonAgentButtonProps) {
  return (
    <div className="flex justify-center pt-6 pb-4">
      <button
        onClick={onSummonAgent}
        disabled={isLoading}
        className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0099FF]/20 to-[#00d4ff]/20 hover:from-[#0099FF]/30 hover:to-[#00d4ff]/30 border border-[#0099FF]/40 hover:border-[#0099FF]/60 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#0099FF]/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-[#0099FF] animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 text-[#0099FF] group-hover:animate-pulse" />
        )}
        <span className="text-sm font-medium bg-gradient-to-r from-[#0099FF] to-[#00d4ff] bg-clip-text text-transparent">
          {isLoading ? "不鸽 Agent 解析中..." : "一键召唤不鸽 Agent 解析"}
        </span>
      </button>
    </div>
  )
}
