import { OpenAI, APIError } from 'openai'

import type { Character } from '../shared'

export interface CharacterResponse {
  nextStatement: string
  urgency: number
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

この状況で、あなたが次に発言したいことを決定してください。
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
              content: 'キャラクターの次の発言を決定し、関数を呼び出して回答してください。' 
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          functions: [
            {
              name: 'decideNextStatement',
              description: 'キャラクターの次の発言を決定する',
              parameters: {
                type: 'object',
                properties: {
                  nextStatement: {
                    type: 'string',
                    description: '次に発言しようとしていることを100文字程度で説明'
                  },
                  urgency: {
                    type: 'integer',
                    description: '発言への意欲（1: 消極的, 5: 積極的）',
                    minimum: 1,
                    maximum: 5
                  }
                },
                required: ['nextStatement', 'urgency']
              }
            }
          ],
          function_call: { name: 'decideNextStatement' }
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