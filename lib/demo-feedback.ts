"use client"

import type { MouseEvent } from "react"
import { toast } from "@/hooks/use-toast"

export function handleMockClick(event?: MouseEvent<HTMLElement>) {
  event?.preventDefault()
  event?.stopPropagation()

  toast({
    description: "🛠️ Demo 版本暂未开放此功能，敬请期待",
  })
}
