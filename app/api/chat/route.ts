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

  try {
    const data = await createStructuredCompletion<AiTask | AiTask[]>({
      messages: [
        { role: "system", content: buildSystemPrompt(routeRequest.scene) },
        { role: "user", content: buildUserPrompt(routeRequest) },
      ],
      maxTokens: getMaxTokens(routeRequest.scene),
      parse: (value) => {
        const schema = getEnvelopeSchema(routeRequest.scene)
        const parsedEnvelope = schema.parse(value)

        if ("tasks" in parsedEnvelope) {
          return parsedEnvelope.tasks.map(normalizeTaskShape)
        }

        return normalizeTaskShape(parsedEnvelope.task)
      },
    })

    return NextResponse.json<ChatRouteResponse>({
      ok: true,
      scene: routeRequest.scene,
      data,
    })
  } catch (error) {
    console.error("DeepSeek chat route failed:", error)
    return errorResponse(502, "AI_UPSTREAM_ERROR", "AI 解析暂时失败，请稍后重试")
  }
}
