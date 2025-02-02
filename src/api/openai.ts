import { OpenAI, APIError } from 'openai'

export async function sendRequest(apiKey: string) {
  if (!apiKey) return null
  
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'こんにちは' }]
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Error:', error)
    if (error instanceof APIError) {
      if (error.status === 401) {
        throw new Error('APIキーが無効です')
      } else if (error.status === 429) {
        throw new Error('リクエスト制限に達しました')
      }
    }
    throw new Error('予期せぬエラーが発生しました')
  }
}