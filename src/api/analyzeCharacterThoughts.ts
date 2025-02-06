import { OpenAI, APIError } from 'openai'

import type { Character } from '../shared'

export interface CharacterThought {
  thought: string
  urgency: 1 | 2 | 3
}

import { type RoutineResult } from '../shared'

function createCharacterAnalysisPrompt(
  currentCharacter: Character,
  allCharacters: Character[],
  commonPrompt: string,
  history: RoutineResult[]
) {
  const otherCharacters = allCharacters.filter(char => char !== currentCharacter)
  
  return `
<共通の情報>
${commonPrompt}
</共通の情報>
<あなたの情報>
名前: ${currentCharacter.name}
説明: ${currentCharacter.description}
隠している情報: ${currentCharacter.hiddenPrompt}
</あなたの情報>
<他のキャラクター>
${otherCharacters.map(char => `
名前: ${char.name}
説明: ${char.description}
`).join('\n')}
${history.length > 0
  ? `
</他のキャラクター>
<これまでの会話>
${history.map((routine) => `
${routine.thoughts
.filter(thought => thought.characterName === currentCharacter.name)
.map(thought => `あなたの考え: ${thought.thought}`).join('\n')}
${routine.speech
? `${routine.speech.characterName === currentCharacter.name ? "あなた" : routine.speech.characterName}の発言: ${routine.speech.speech}`
: '発言なし'}`
).join('\n')}
`
  : ''}
</これまでの会話>
`.trim()
}

export async function createCharacterThoughts(
  openai: OpenAI,
  commonPrompt: string,
  characters: Character[],
  history: RoutineResult[]
): Promise<CharacterThought[]> {
  if (characters.length === 0) return []

  try {
    const responses = await Promise.all(
      characters.map(async (character) => {
        const prompt = createCharacterAnalysisPrompt(character, characters, commonPrompt, history)
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { 
              role: 'system',
              content: 'あなたの現在の心情と発言意欲を回答してください。過去あなたの発言が多い場合は発言意欲は低めにしてください。'
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          functions: [
            {
              name: 'analyzeThoughtAndUrgency',
              description: 'キャラクターの考えと発言意欲',
              parameters: {
                type: 'object',
                properties: {
                  thought: {
                    type: 'string',
                    description: '現在考えていることを100文字程度で説明'
                  },
                  urgency: {
                    type: 'integer',
                    description: '発言への意欲（1: 特に話すことがない・誰かが話すのを聞きたい・直近発言したばかり, 2: 強い意欲があるわけではないが話すことがある, 3: 積極的に話したい・話す責務がある）',
                    minimum: 1,
                    maximum: 3
                  }
                },
                required: ['thought', 'urgency']
              }
            }
          ],
          function_call: { name: 'analyzeThoughtAndUrgency' }
        })

        const functionCall = completion.choices[0].message.function_call
        if (!functionCall || !functionCall.arguments) {
          throw new Error('APIからの応答が不正です')
        }

        try {
          const response = JSON.parse(functionCall.arguments) as CharacterThought
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