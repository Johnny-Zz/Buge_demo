import type { AiScene, ChatRouteRequest } from "@/lib/ai/types"

function buildSharedRules(scene: AiScene) {
  const outputShape =
    scene === "group_parse"
      ? `{"tasks":[{"taskName":"提交第四题作业","date":"2026-04-30","startTime":"20:00","endTime":"21:00","location":"超星学习通","isExpired":false}]}`
      : `{"task":{"taskName":"开组会","date":"2026-04-30","startTime":"20:00","endTime":"21:00","location":"主楼","isExpired":false}}`

  return [
    "你是“不鸽 (Buge)” 的时间解析引擎。",
    "你必须只输出合法 json，不要输出 markdown，不要输出解释，不要输出代码块。",
    `顶层 json 示例：${outputShape}`,
    "CRITICAL：绝对忠于原文中的绝对日期。",
    "如果原文明确写了绝对日期，即使这个日期已经过去，例如“4月22日”或“2026年4月22日”，也必须原样解析为真实日期，严禁擅自推算、平移、改写成距离今天最近的未来日期。",
    "解析出原文真实日期后，必须立刻结合 context.nowIso 和 context.timezone 进行比对；只要该任务不是周期性任务，且真实结束时间早于当前系统时间，就必须输出 isExpired: true。",
    "所有日期必须是 YYYY-MM-DD。",
    "所有时间必须是 24 小时制 HH:mm。",
    "如果原文明确给出结束时间或持续时长，才输出 endTime。",
    "如果原文只有开始时间，没有明确结束时间或持续时长，请省略 endTime，不要自行默认补 1 小时。",
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
在校园场景中，以下内容都必须视为有效待办并提取出来：
1. 任何需要本人到场或参加的活动，例如讲座、比赛、开会、宣讲会、培训、补课、就业指导课、班会、答辩、面试、签到会场活动。
2. 任何需要执行的动作，例如签到、提交材料、交表、携带简历、携带证件、扫码报名、线上填写信息。
3. 带有“通知 / 预告 / 提醒 / 开课 / 安排”等字样，但同时给出了明确时间或地点的校园事项，默认按“需要参与或执行”的待办处理，不要误判为普通资讯。
如果通知里既有到场活动，又有必须完成但没有独立时间的准备动作，请把准备动作合并进主任务名，例如“参加就业指导课并带好简历”。
请结合传入的当前系统时间 context.nowIso 与 context.timezone 进行对比。
如果该任务不是周期性任务，且它明确的结束时间早于当前系统时间，请输出 "isExpired": true；否则输出 "isExpired": false。
如果原文体现了“每周 / 重复 / 周期 / 每月 / 循环 / recurring”等周期性特征，不要因为本次时间已过就标记为过期。
如果原文明确写了过去的绝对日期，必须保留这个过去日期本身，不得改写为今天、明天或未来最近日期。
忽略寒暄、感谢、追问、讨论过程、重复内容、纯说明性闲聊，但不要忽略明确的校园通知、预告、课务安排、报名提醒。
如果文本里有多个待办，全部放进 tasks 数组。
如果没有明确待办，返回 {"tasks":[]}.

Few-shot 示例 1：
输入：${JSON.stringify({
  scene: "group_parse",
  input: "【活动预告】赢在创新大赛宣讲会，时间：2026年4月23日14:30，地点：报告厅，欢迎同学们参加。",
  context: {
    nowIso: "2026-04-22T10:00:00+08:00",
    timezone: "Asia/Shanghai",
  },
})}
输出：{"tasks":[{"taskName":"参加赢在创新大赛宣讲会","date":"2026-04-23","startTime":"14:30","endTime":"15:30","location":"报告厅","isExpired":false}]}

Few-shot 示例 2：
输入：${JSON.stringify({
  scene: "group_parse",
  input: "【就业指导课开课通知】明天4月23日15点50分在教三201开课，请大家带好简历，按时参加。",
  context: {
    nowIso: "2026-04-22T10:00:00+08:00",
    timezone: "Asia/Shanghai",
  },
})}
输出：{"tasks":[{"taskName":"参加就业指导课并带好简历","date":"2026-04-23","startTime":"15:50","endTime":"16:50","location":"教三201","isExpired":false}]}

Few-shot 示例 3：
输入：${JSON.stringify({
  scene: "group_parse",
  input: "【讲座补充通知】请报名同学于2026年4月22日14:30到报告厅签到入场。",
  context: {
    nowIso: "2026-04-29T10:00:00+08:00",
    timezone: "Asia/Shanghai",
  },
})}
输出：{"tasks":[{"taskName":"到报告厅签到入场","date":"2026-04-22","startTime":"14:30","endTime":"15:30","location":"报告厅","isExpired":true}]}`
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
