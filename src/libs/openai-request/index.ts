import { OpenAI } from 'openai'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

interface OpenAIRequestConfig<T extends z.ZodType> {
  openai: OpenAI
  schema: T
  systemPrompt: string
  userPrompt: string
  functionName: string
  functionDescription: string
  model?: string
}

/**
 * OpenAI APIへのリクエストとレスポンスのバリデーションを行う汎用関数
 * @param config リクエストの設定
 * @returns バリデーション済みのレスポンス
 */
export async function makeOpenAIRequest<T extends z.ZodType>({
  openai,
  schema,
  systemPrompt,
  userPrompt,
  functionName,
  functionDescription,
  model = 'gpt-4o'
}: OpenAIRequestConfig<T>): Promise<z.infer<T>> {
  const functionSchema = {
    name: functionName,
    description: functionDescription,
    parameters: zodToJsonSchema(schema)
  }

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    functions: [functionSchema],
    function_call: { name: functionName }
  })

  const functionCall = completion.choices[0].message.function_call
  if (!functionCall?.arguments) {
    throw new Error('APIからの応答が不正です')
  }

  try {
    const parsedResponse = schema.parse(JSON.parse(functionCall.arguments))
    return parsedResponse
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`APIレスポンスの型が不正です: ${error.message}`)
    }
    throw error
  }
}