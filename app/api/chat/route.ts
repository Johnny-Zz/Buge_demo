import { createStructuredCompletion } from "@/lib/ai/deepseek"
import { buildSystemPrompt, buildUserPrompt, getMaxTokens } from "@/lib/ai/prompts"
import {
  ChatRouteRequestSchema,
  getEnvelopeSchema,
  normalizeAgentCommand,
  normalizeTaskShape,
} from "@/lib/ai/schemas"
import type { AiAgentCommand, AiTask, ChatRouteResponse } from "@/lib/ai/types"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "edge"
export const maxDuration = 60

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json<ChatRouteResponse>(
    {
      ok: false,
      error: { code, message },
    },
    { status },
  )
}

function isTimeoutLikeError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const normalizedMessage = error.message.toLowerCase()
  const normalizedName = error.name.toLowerCase()

  return (
    normalizedMessage.includes("timeout") ||
    normalizedMessage.includes("timed out") ||
    normalizedMessage.includes("aborted") ||
    normalizedMessage.includes("etimedout") ||
    normalizedName.includes("timeout") ||
    normalizedName.includes("abort")
  )
}

function isConnectionLikeError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const normalizedMessage = error.message.toLowerCase()
  const normalizedName = error.name.toLowerCase()

  return (
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("fetch failed") ||
    normalizedMessage.includes("connection") ||
    normalizedMessage.includes("econnreset") ||
    normalizedMessage.includes("enotfound") ||
    normalizedMessage.includes("socket") ||
    normalizedName.includes("connection")
  )
}

function classifyAiError(error: unknown) {
  if (error instanceof z.ZodError) {
    return {
      status: 502,
      code: "AI_SCHEMA_VALIDATION_ERROR",
      message: "AI 返回数据格式不符合预期",
    }
  }

  if (error instanceof SyntaxError) {
    return {
      status: 502,
      code: "AI_JSON_PARSE_ERROR",
      message: "AI 返回了非标准 JSON",
    }
  }

  if (isTimeoutLikeError(error)) {
    return {
      status: 504,
      code: "AI_TIMEOUT",
      message: "AI 解析超时，请稍后重试",
    }
  }

  if (isConnectionLikeError(error)) {
    return {
      status: 502,
      code: "AI_NETWORK_ERROR",
      message: "AI 服务连接异常，请稍后重试",
    }
  }

  if (error instanceof Error && error.message.includes("empty content")) {
    return {
      status: 502,
      code: "AI_EMPTY_RESPONSE",
      message: "AI 未返回有效内容",
    }
  }

  return {
    status: 502,
    code: "AI_UPSTREAM_ERROR",
    message: "AI 解析暂时失败，请稍后重试",
  }
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
    tasks?: Array<{ id: string; title: string; date: string; time: string; endTime?: string }>
    courses?: Array<{ id: string; name: string; dayOfWeek: number; startTime: string; endTime: string; location: string }>
  }
  tasks?: Array<{ id: string; title: string; date: string; time: string; endTime?: string }>
  courses?: Array<{ id: string; name: string; dayOfWeek: number; startTime: string; endTime: string; location: string }>
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
              `- 任务ID：${task.id} | ${task.title} | ${task.date} ${task.time}-${task.endTime || "未知结束时间"}`,
          )
          .join("\n")
      : "- 无当天既有任务"

  const courseLines =
    currentSchedule.courses && currentSchedule.courses.length > 0
      ? currentSchedule.courses
          .map(
            (course) =>
              `- 课程ID：${course.id} | ${course.name} | ${course.startTime}-${course.endTime} | ${course.location}`,
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

function buildEntityCatalogMessage(context: {
  tasks?: Array<{ id: string; title: string; date: string; time: string; endTime?: string }>
  courses?: Array<{ id: string; name: string; dayOfWeek: number; startTime: string; endTime: string; location: string }>
}) {
  const taskLines =
    context.tasks && context.tasks.length > 0
      ? context.tasks
          .map(
            (task) =>
              `- task | id=${task.id} | title=${task.title} | date=${task.date} | time=${task.time}-${task.endTime || "未知结束时间"}`,
          )
          .join("\n")
      : "- 无任务"

  const courseLines =
    context.courses && context.courses.length > 0
      ? context.courses
          .map(
            (course) =>
              `- course | id=${course.id} | name=${course.name} | weekday=${course.dayOfWeek} | time=${course.startTime}-${course.endTime} | location=${course.location}`,
          )
          .join("\n")
      : "- 无课程"

  return [
    "当前可操作日程目录：",
    "tasks:",
    taskLines,
    "courses:",
    courseLines,
    "如果用户要求删除、修改、取消、推迟、提前、查询某个已有日程，必须优先从这个目录中匹配，并原样返回 targetId。",
  ].join("\n")
}

function normalizeTaskLabel(value: string) {
  return value.trim().toLowerCase().replace(/[\s【】()（）\-_,.;:：，。！？!?"'“”‘’]/g, "")
}

function dedupeGroupTasks(tasks: AiTask[]) {
  const taskMap = new Map<string, AiTask>()

  for (const task of tasks) {
    const dedupeKey = [
      task.sourceMessageId || "",
      task.date,
      task.startTime,
      task.endTime || "",
      normalizeTaskLabel(task.taskName),
      (task.location || "").trim().toLowerCase(),
    ].join("|")

    if (!taskMap.has(dedupeKey)) {
      taskMap.set(dedupeKey, task)
      continue
    }

    const existingTask = taskMap.get(dedupeKey)

    if (
      existingTask &&
      task.taskName.trim().length > existingTask.taskName.trim().length
    ) {
      taskMap.set(dedupeKey, task)
    }
  }

  return [...taskMap.values()]
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
      content: buildEntityCatalogMessage(routeRequest.context),
    })
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
  let cleanedResult = ""

  try {
    const data = await createStructuredCompletion<AiAgentCommand | AiTask[]>({
      messages,
      maxTokens: getMaxTokens(routeRequest.scene),
      onRaw: (content) => {
        rawResult = content
      },
      onCleaned: (content) => {
        cleanedResult = content
      },
      parse: (value) => {
        const schema = getEnvelopeSchema(routeRequest.scene)
        const parsedEnvelope = schema.parse(value)

        if ("tasks" in parsedEnvelope) {
          return dedupeGroupTasks(parsedEnvelope.tasks.map(normalizeTaskShape))
        }

        return normalizeAgentCommand(parsedEnvelope)
      },
    })

    console.log("DeepSeek Raw Output:", rawResult)
    console.log("DeepSeek Cleaned JSON:", cleanedResult)

    return NextResponse.json<ChatRouteResponse>({
      ok: true,
      scene: routeRequest.scene,
      data,
    })
  } catch (error) {
    console.log("DeepSeek Raw Output:", rawResult)
    console.log("DeepSeek Cleaned JSON:", cleanedResult)

    if (error instanceof z.ZodError) {
      console.error(
        "Zod 数据校验失败，AI 返回格式不符合规范:",
        error.flatten(),
      )
    } else if (error instanceof SyntaxError) {
      console.error("JSON 解析致命错误，AI 返回了非标准 JSON:", error.message)
    } else if (isTimeoutLikeError(error)) {
      console.error("AI 请求超时:", error)
    } else if (isConnectionLikeError(error)) {
      console.error("AI 网络连接异常:", error)
    } else {
      console.error("网络或未知 API 错误:", error)
    }

    const classifiedError = classifyAiError(error)
    return errorResponse(
      classifiedError.status,
      classifiedError.code,
      classifiedError.message,
    )
  }
}
