import OpenAI from "openai"

type StructuredMessage = {
  role: "system" | "user"
  content: string
}

interface StructuredCompletionOptions<T> {
  messages: StructuredMessage[]
  maxTokens: number
  parse: (value: unknown) => T
  onRaw?: (raw: string) => void
  onCleaned?: (cleaned: string) => void
}

function cleanJsonLikeText(raw: string): string {
  let cleanText = raw
    .replace(/^\uFEFF/, "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json/gi, "")
    .replace(/```/gi, "")
    .trim()

  const fencedMatch = cleanText.match(/(?:^|\n)\s*([\[{][\s\S]*[\]}])\s*(?:$|\n)/)
  if (fencedMatch?.[1]) {
    cleanText = fencedMatch[1].trim()
  }

  const jsonMatch = cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (jsonMatch?.[0]) {
    cleanText = jsonMatch[0].trim()
  }

  return cleanText
}

function getDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY")
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
    timeout: 55_000,
  })
}

export async function createStructuredCompletion<T>({
  messages,
  maxTokens,
  parse,
  onRaw,
  onCleaned,
}: StructuredCompletionOptions<T>): Promise<T> {
  const client = getDeepSeekClient()
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash"
  let lastError: Error | null = null

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: maxTokens,
        stream: false,
      })

      const content = completion.choices[0]?.message?.content?.trim()

      if (!content) {
        throw new Error("DeepSeek returned empty content")
      }

      onRaw?.(content)
      const cleanedContent = cleanJsonLikeText(content)
      onCleaned?.(cleanedContent)

      return parse(JSON.parse(cleanedContent))
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown DeepSeek error")
    }
  }

  throw lastError || new Error("DeepSeek request failed")
}
