import type { AiScene, ChatRouteRequest } from "@/lib/ai/types"

function buildSharedRules(scene: AiScene) {
  const outputShape =
    scene === "group_parse"
      ? `{"tasks":[{"taskName":"提交第四题作业","date":"2026-04-30","startTime":"20:00","endTime":"21:00","location":"超星学习通"}]}`
      : `{"task":{"taskName":"开组会","date":"2026-04-30","startTime":"20:00","endTime":"21:00","location":"主楼"}}`

  return [
    "你是“不鸽 (Buge)” 的时间解析引擎。",
    "你必须只输出合法 json，不要输出 markdown，不要输出解释，不要输出代码块。",
    `顶层 json 示例：${outputShape}`,
    "所有日期必须是 YYYY-MM-DD。",
    "所有时间必须是 24 小时制 HH:mm。",
    "如果用户没有明确给出结束时间，默认结束时间 = 开始时间 + 60 分钟。",
    "如果地点不确定，输出空字符串，不要输出“待定”。",
    "必须基于 context.nowIso 和 context.timezone 推算“今天 / 明天 / 明晚 / 下周三”等相对时间。",
  ].join("\n")
}

export function buildSystemPrompt(scene: AiScene): string {
  if (scene === "quick_task") {
    return `${buildSharedRules(scene)}
任务：从一句自然语言中提取单条待办。
优先识别动作、真实日期、开始时间、结束时间、地点。
如果是口语表达，保留最核心的任务名，不要带口头禅。`
  }

  if (scene === "habit_schedule") {
    return `${buildSharedRules(scene)}
任务：处理模糊排程请求。
必须参考 context.habits、context.tasks、context.courses。
先识别用户真正想做的事情，再结合习惯偏好推断一个合适时段。
优先避免与现有课程和任务明显重叠；如果无法完全避开，也要给出最合理的建议时段。`
  }

  return `${buildSharedRules(scene)}
任务：从群聊长文本中提取所有可执行待办。
只保留真正需要用户行动或参与的事项。
忽略寒暄、感谢、追问、讨论过程、重复内容、纯说明性闲聊。
如果文本里有多个待办，全部放进 tasks 数组。
如果没有明确待办，返回 {"tasks":[]}.`
}

export function buildUserPrompt(request: ChatRouteRequest): string {
  return [
    "请根据以下请求返回 json：",
    JSON.stringify(request, null, 2),
  ].join("\n")
}

export function getMaxTokens(scene: AiScene): number {
  switch (scene) {
    case "group_parse":
      return 1400
    case "habit_schedule":
      return 700
    case "quick_task":
    default:
      return 500
  }
}
