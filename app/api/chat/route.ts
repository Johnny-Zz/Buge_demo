import { createStructuredCompletion } from "@/lib/ai/deepseek"
import { buildSystemPrompt, buildUserPrompt, getMaxTokens } from "@/lib/ai/prompts"
import {
  ChatRouteRequestSchema,
  getEnvelopeSchema,
  normalizeTaskShape,
} from "@/lib/ai/schemas"
import type { AiTask, ChatRouteResponse } from "@/lib/ai/types"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json<ChatRouteResponse>(
    {
      ok: false,
      error: { code, message },
    },
    { status },
  )
}

function buildTemporalContextMessage(nowIso: string, timezone: string) {
  try {
    const now = new Date(nowIso)

    if (Number.isNaN(now.getTime())) {
      return `当前参考时间：${nowIso}，时区：${timezone}。请严格基于这个参考时间解析“今天 / 明天 / 后天 / 本周三 / 下周五”等相对时间。`
    }

    const formatter = new Intl.DateTimeFormat("zh-CN", {
      timeZone: timezone,
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    })

    return [
      `当前参考时间：${formatter.format(now)}，时区：${timezone}。`,
      "请严格基于这个参考时间解析“今天 / 明天 / 后天 / 本周三 / 下周五”等相对时间。",
      "如果原文同时出现相对时间和绝对日期，请优先采用更具体且能自洽的日期信息。",
    ].join("\n")
  } catch {
    return `当前参考时间：${nowIso}，时区：${timezone}。请严格基于这个参考时间解析“今天 / 明天 / 后天 / 本周三 / 下周五”等相对时间。`
  }
}

function buildCurrentScheduleMessage(context: {
  currentSchedule?: {
    date: string
    tasks?: Array<{ title: string; date: string; time: string; endTime?: string }>
    courses?: Array<{ name: string; dayOfWeek: number; startTime: string; endTime: string; location: string }>
  }
  tasks?: Array<{ title: string; date: string; time: string; endTime?: string }>
  courses?: Array<{ name: string; dayOfWeek: number; startTime: string; endTime: string; location: string }>
}) {
  const currentSchedule = context.currentSchedule

  if (!currentSchedule) {
    return [
      "未显式提供 context.currentSchedule。",
      "如果需要智能排程，请退回参考 context.tasks 与 context.courses，先寻找连续空白时段，再给出时间建议。",
    ].join("\n")
  }

  const taskLines =
    currentSchedule.tasks && currentSchedule.tasks.length > 0
      ? currentSchedule.tasks
          .map(
            (task) =>
              `- 任务：${task.title} | ${task.date} ${task.time}-${task.endTime || "未知结束时间"}`,
          )
          .join("\n")
      : "- 无当天既有任务"

  const courseLines =
    currentSchedule.courses && currentSchedule.courses.length > 0
      ? currentSchedule.courses
          .map(
            (course) =>
              `- 课程：${course.name} | ${course.startTime}-${course.endTime} | ${course.location}`,
          )
          .join("\n")
      : "- 无当天既有课程"

  return [
    `当前重点排程日期：${currentSchedule.date}`,
    "你必须先分析这一天的 currentSchedule，找到连续空白时段，再决定是否可以安排到今天。",
    "currentSchedule.tasks:",
    taskLines,
    "currentSchedule.courses:",
    courseLines,
    "context.tasks 与 context.courses 是更完整的全局背景，可用于目标日期切换后的二次校验。",
  ].join("\n")
}

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return errorResponse(400, "INVALID_JSON", "请求体必须是合法 JSON")
  }

  const parsed = ChatRouteRequestSchema.safeParse(payload)

  if (!parsed.success) {
    return errorResponse(400, "INVALID_REQUEST", "请求参数不符合约定格式")
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return errorResponse(500, "MISSING_API_KEY", "API 配置缺失")
  }

  const routeRequest = parsed.data
  const temporalContextMessage = buildTemporalContextMessage(
    routeRequest.context.nowIso,
    routeRequest.context.timezone,
  )
  const messages: Array<{ role: "system" | "user"; content: string }> = [
    { role: "system", content: buildSystemPrompt(routeRequest.scene) },
  ]

  messages.push({
    role: "system",
    content: temporalContextMessage,
  })

  if (
    routeRequest.scene === "quick_task" ||
    routeRequest.scene === "habit_schedule"
  ) {
    messages.push({
      role: "system",
      content: buildCurrentScheduleMessage(routeRequest.context),
    })
  }

  messages.push({
    role: "user",
    content: buildUserPrompt(routeRequest),
  })

  let rawResult = ""

  try {
    const data = await createStructuredCompletion<AiTask | AiTask[]>({
      messages,
      maxTokens: getMaxTokens(routeRequest.scene),
      onRaw: (content) => {
        rawResult = content
      },
      parse: (value) => {
        const schema = getEnvelopeSchema(routeRequest.scene)
        const parsedEnvelope = schema.parse(value)

        if ("tasks" in parsedEnvelope) {
          return parsedEnvelope.tasks.map(normalizeTaskShape)
        }

        return normalizeTaskShape(parsedEnvelope.task)
      },
    })

    console.log("DeepSeek Raw Output:", rawResult)

    return NextResponse.json<ChatRouteResponse>({
      ok: true,
      scene: routeRequest.scene,
      data,
    })
  } catch (error) {
    console.log("DeepSeek Raw Output:", rawResult)
    console.error("DeepSeek chat route failed:", error)
    return errorResponse(502, "AI_UPSTREAM_ERROR", "AI 解析暂时失败，请稍后重试")
  }
}
