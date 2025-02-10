import { OpenAI } from 'openai'
import type { Character, CharacterSpeech, RoutineResult } from '../shared'
import type { CharacterMemoriesWithUrgency } from './analyzeCharacterThoughts'

export interface CreateCharacterSpeechArgs {
  openai: OpenAI
  commonPrompt: string
  characters: Character[]
  characterMemories: CharacterMemoriesWithUrgency[]
  history: RoutineResult[]
  random?: () => number
}

interface SelectSpeakingCharacterArgs {
  characterMemories: CharacterMemoriesWithUrgency[]
  random?: () => number
}

function selectSpeakingCharacter({
  characterMemories,
  random = Math.random
}: SelectSpeakingCharacterArgs): CharacterMemoriesWithUrgency | null {
  if (characterMemories.length === 0) return null

  // 最も高い発言意欲を持つキャラクターを見つける
  const maxUrgency = Math.max(...characterMemories.map(cm => cm.urgency))
  const highestUrgencyCharacters = characterMemories.filter(cm => cm.urgency === maxUrgency)

  // 最も高い発言意欲を持つキャラクターが複数いる場合はランダムに1人選択
  return highestUrgencyCharacters[Math.floor(random() * highestUrgencyCharacters.length)]
}

interface CreateSpeechPromptArgs {
  character: Character
  characterMemories: CharacterMemoriesWithUrgency
  allCharacters: Character[]
  commonPrompt: string
  history: RoutineResult[]
}

import { buildPrompt } from '../libs/prompt-builder'

function createSpeechPrompt({
  character,
  characterMemories,
  allCharacters,
  commonPrompt,
  history
}: CreateSpeechPromptArgs) {
  const otherCharacters = allCharacters.filter(char => char.name !== character.name)
  const thoughts = characterMemories.memories.map(m => m.thought).join('\n')

  const sections = [
    {
      name: '共通の情報',
      content: commonPrompt
    },
    {
      name: 'あなたの情報',
      content: `名前: ${character.name}
説明: ${character.description}
隠している情報: ${character.hiddenPrompt}
現在の考え:
${thoughts}`
    },
    {
      name: '他のキャラクター',
      content: otherCharacters.map(char =>
        `名前: ${char.name}
説明: ${char.description}`
      ).join('\n')
    }
  ]

  if (history.length > 0) {
    sections.push({
      name: '直近の会話',
      content: history.slice(-3).map((routine) => {
        const characterMemories = routine.characterMemories
          .filter(cm => cm.characterName === character.name)
          .flatMap(cm => cm.memories);
        return `${characterMemories.map(memory => `あなたの考え: ${memory.thought}`).join('\n')}
${routine.speech
  ? `${routine.speech.characterName === character.name ? "あなた" : routine.speech.characterName}の発言: ${routine.speech.speech}`
  : '発言なし'}`
      }).join('\n')
    })
  }

  return buildPrompt(sections)
}

export async function createCharacterSpeech({
  openai,
  commonPrompt,
  characters,
  characterMemories,
  history,
  random = Math.random
}: CreateCharacterSpeechArgs): Promise<CharacterSpeech | null> {
  if (characters.length === 0 || characterMemories.length === 0) return null

  // 発言するキャラクターの思考を選択
  const selectedCharacterMemories = selectSpeakingCharacter({ characterMemories, random })
  if (!selectedCharacterMemories) return null

  // 選択された思考に対応するキャラクターを取得
  const selectedCharacter = characters.find(c => c.name === selectedCharacterMemories.characterName)
  if (!selectedCharacter) return null

  const prompt = createSpeechPrompt({
    character: selectedCharacter,
    characterMemories: selectedCharacterMemories,
    allCharacters: characters,
    commonPrompt,
    history
  })
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
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

  const response = JSON.parse(functionCall.arguments) as { speech: string }
  return {
    characterName: selectedCharacter.name,
    speech: response.speech
  }
}