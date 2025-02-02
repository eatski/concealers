import { OpenAI, APIError } from 'openai'

import type { Character } from '../shared'

export interface CharacterResponse {
  thought: string
  urgency: 1 | 2 | 3
}

function generatePromptForCharacter(currentCharacter: Character, allCharacters: Character[]) {
  const otherCharacters = allCharacters.filter(char => char !== currentCharacter)
  
  return `
あなたは「${currentCharacter.name}」というキャラクターです。

あなたの情報:
名前: ${currentCharacter.name}
説明: ${currentCharacter.description}
隠された情報: ${currentCharacter.hiddenPrompt}

他のキャラクター:
${otherCharacters.map(char => `
名前: ${char.name}
説明: ${char.description}
`).join('\n')}

この状況で、あなたが考えていることと、どの程度話したい気持ちがあるか教えてください。
`.trim()
}

export async function sendRequest(apiKey: string, characters: Character[]): Promise<CharacterResponse[]> {
  if (!apiKey) return []
  
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  })

  try {
    const responses = await Promise.all(
      characters.map(async (character) => {
        const prompt = generatePromptForCharacter(character, characters)
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { 
              role: 'system',
              content: 'キャラクターの現在の心情と発言意欲を分析して回答してください。'
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          functions: [
            {
              name: 'thoughts',
              description: 'キャラクターの考えと発言意欲を分析する',
              parameters: {
                type: 'object',
                properties: {
                  thought: {
                    type: 'string',
                    description: '現在考えていることを100文字程度で説明'
                  },
                  urgency: {
                    type: 'integer',
                    description: '発言への意欲（1: 特に話すことがない・誰かが話すのを聞きたい, 2: 強い意欲があるわけではないが話すことがある, 3: 積極的に話したい）',
                    minimum: 1,
                    maximum: 3
                  }
                },
                required: ['thought', 'urgency']
              }
            }
          ],
          function_call: { name: 'thoughts' }
        })

        const functionCall = completion.choices[0].message.function_call
        if (!functionCall || !functionCall.arguments) {
          throw new Error('APIからの応答が不正です')
        }

        try {
          const response = JSON.parse(functionCall.arguments) as CharacterResponse
          return response
        } catch (e) {
          console.error('JSON解析エラー:', e)
          throw new Error('APIからの応答の解析に失敗しました')
        }
      })
    )

    return responses
  } catch (error) {
    console.error('Error:', error)
    if (error instanceof APIError) {
      if (error.status === 401) {
        throw new Error('APIキーが無効です')
      } else if (error.status === 429) {
        throw new Error('リクエスト制限に達しました')
      }
    }
    throw error
  }
}