"use client"

import { Sparkles } from "lucide-react"

interface SummonAgentButtonProps {
  onSummonAgent: () => void
}

/**
 * Reusable Summon Agent Button - Used consistently across all chat interfaces
 * This component renders inside the scrollable chat area, not as a floating element.
 * It triggers the AI parsing overlay when clicked.
 */
export function SummonAgentButton({ onSummonAgent }: SummonAgentButtonProps) {
  return (
    <div className="flex justify-center pt-6 pb-4">
      <button
        onClick={onSummonAgent}
        className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0099FF]/20 to-[#00d4ff]/20 hover:from-[#0099FF]/30 hover:to-[#00d4ff]/30 border border-[#0099FF]/40 hover:border-[#0099FF]/60 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#0099FF]/20"
      >
        <Sparkles className="w-4 h-4 text-[#0099FF] group-hover:animate-pulse" />
        <span className="text-sm font-medium bg-gradient-to-r from-[#0099FF] to-[#00d4ff] bg-clip-text text-transparent">
          一键召唤不鸽 Agent 解析
        </span>
      </button>
    </div>
  )
}
