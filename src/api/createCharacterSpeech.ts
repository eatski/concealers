import { OpenAI, APIError } from 'openai'
import type { Character } from '../shared'
import type { CharacterThought } from './analyzeCharacterThoughts'

interface CharacterWithThought {
  character: Character
  thought: CharacterThought
}

export interface CharacterSpeech {
  character: Character
  speech: string
}

function selectSpeakingCharacter(charactersWithThoughts: CharacterWithThought[]): CharacterWithThought | null {
  if (charactersWithThoughts.length === 0) return null

  // 最も高い発言意欲を持つキャラクターを見つける
  const maxUrgency = Math.max(...charactersWithThoughts.map(c => c.thought.urgency))
  const highestUrgencyCharacters = charactersWithThoughts.filter(c => c.thought.urgency === maxUrgency)

  // 最も高い発言意欲を持つキャラクターが複数いる場合はランダムに1人選択
  return highestUrgencyCharacters[Math.floor(Math.random() * highestUrgencyCharacters.length)]
}

function createSpeechPrompt(speakingCharacter: CharacterWithThought, allCharacters: Character[]) {
  const otherCharacters = allCharacters.filter(char => char.name !== speakingCharacter.character.name)
  
  return `
あなたは「${speakingCharacter.character.name}」というキャラクターです。

あなたの情報:
名前: ${speakingCharacter.character.name}
説明: ${speakingCharacter.character.description}
隠された情報: ${speakingCharacter.character.hiddenPrompt}
現在の考え: ${speakingCharacter.thought.thought}

他のキャラクター:
${otherCharacters.map(char => `
名前: ${char.name}
説明: ${char.description}
`).join('\n')}

この状況で、あなたはどのように発言しますか？
`.trim()
}

export async function createCharacterSpeech(
  apiKey: string, 
  characters: Character[], 
  thoughts: CharacterThought[]
): Promise<CharacterSpeech | null> {
  if (!apiKey || characters.length === 0 || thoughts.length === 0) return null

  // キャラクターと思考を結合
  const charactersWithThoughts: CharacterWithThought[] = characters.map((character, index) => ({
    character,
    thought: thoughts[index]
  }))

  // 発言するキャラクターを選択
  const speakingCharacter = selectSpeakingCharacter(charactersWithThoughts)
  if (!speakingCharacter) return null

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  })

  try {
    const prompt = createSpeechPrompt(speakingCharacter, characters)
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system',
          content: '与えられた状況に基づいて、キャラクターらしい自然な発言を生成してください。発言は100文字程度に収めてください。'
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      functions: [
        {
          name: 'generateSpeech',
          description: 'キャラクターの発言を生成',
          parameters: {
            type: 'object',
            properties: {
              speech: {
                type: 'string',
                description: 'キャラクターの発言内容'
              }
            },
            required: ['speech']
          }
        }
      ],
      function_call: { name: 'generateSpeech' }
    })

    const functionCall = completion.choices[0].message.function_call
    if (!functionCall || !functionCall.arguments) {
      throw new Error('APIからの応答が不正です')
    }

    try {
      const response = JSON.parse(functionCall.arguments) as { speech: string }
      return {
        character: speakingCharacter.character,
        speech: response.speech
      }
    } catch (e) {
      console.error('JSON解析エラー:', e)
      throw new Error('APIからの応答の解析に失敗しました')
    }
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