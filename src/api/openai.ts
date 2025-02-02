import { OpenAI, APIError } from 'openai'

interface Character {
  name: string
  description: string
  hiddenPrompt: string
}

export async function sendRequest(apiKey: string, characters: Character[]) {
  if (!apiKey) return null
  
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  })

  const prompt = `
以下のキャラクター設定で正体隠匿系TRPGのテストを行います：

${characters.map((char, index) => `
キャラクター${index + 1}:
名前: ${char.name}
説明: ${char.description}
隠された情報: ${char.hiddenPrompt}
`).join('\n')}

各キャラクターの隠された情報を考慮しながら、適切なシナリオを1つ提案してください。
`.trim()

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
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