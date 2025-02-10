import { OpenAI } from 'openai'
import type { Character, RoutineResult, MemoryItem } from '../shared'

export interface SearchRelevantMemoriesArgs {
  openai: OpenAI
  commonPrompt: string
  currentCharacter: Character
  characters: Character[]
  history: RoutineResult[]
}

function collectExistingTags(history: RoutineResult[], characterName: string): string[] {
  const allTags = history
    .flatMap(routine => 
      routine.characterMemories
        .filter(cm => cm.characterName === characterName)
        .flatMap(cm => cm.memories)
    )
    .flatMap(memory => memory.tags)

  // 重複を除去
  return [...new Set(allTags)]
}

import { buildPrompt } from '../libs/prompt-builder'

function createMemorySearchPrompt({
  currentCharacter,
  allCharacters,
  commonPrompt,
  history,
  existingTags
}: {
  currentCharacter: Character
  allCharacters: Character[]
  commonPrompt: string
  history: RoutineResult[]
  existingTags: string[]
}) {
  const otherCharacters = allCharacters.filter(char => char !== currentCharacter)
  const recentHistory = history.slice(-3) // 直近3回の履歴のみを使用

  return buildPrompt([
    {
      name: '共通の情報',
      content: commonPrompt
    },
    {
      name: 'あなたの情報',
      content: `名前: ${currentCharacter.name}
説明: ${currentCharacter.description}
隠している情報: ${currentCharacter.hiddenPrompt}`
    },
    {
      name: '他のキャラクター',
      content: otherCharacters.map(char =>
        `名前: ${char.name}
説明: ${char.description}`
      ).join('\n\n')
    },
    {
      name: '利用可能なタグ',
      content: existingTags.join(', ')
    },
    {
      name: '直近の会話',
      content: recentHistory.map((routine) => {
        const memories = routine.characterMemories
          .filter(cm => cm.characterName === currentCharacter.name)
          .flatMap(cm => cm.memories)
          .map(memory =>
            `認識した情報: ${memory.recognizedInfo}
考え: ${memory.thought}
タグ: ${memory.tags.join(', ')}`
          ).join('\n\n')

        const speech = routine.speech
          ? `${routine.speech.characterName === currentCharacter.name ? "あなた" : routine.speech.characterName}の発言: ${routine.speech.speech}`
          : '発言なし'

        return `${memories}\n${speech}`
      }).join('\n\n')
    }
  ])
}

async function selectRelevantTags({
  openai,
  prompt,
  existingTags
}: {
  openai: OpenAI
  prompt: string
  existingTags: string[]
}): Promise<string[]> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: 'system',
        content: '直近の会話から、関連する記憶を見つけるために、利用可能なタグの中から適切なものを選択してください。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    functions: [
      {
        name: 'selectTags',
        description: '利用可能なタグから、関連する記憶のタグを選択',
        parameters: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              description: '選択されたタグのリスト',
              items: {
                type: 'string',
                enum: existingTags
              }
            }
          },
          required: ['tags']
        }
      }
    ],
    function_call: { name: 'selectTags' }
  })

  const functionCall = completion.choices[0].message.function_call
  if (!functionCall || !functionCall.arguments) {
    throw new Error('APIからの応答が不正です')
  }

  const response = JSON.parse(functionCall.arguments) as {
    tags: string[]
  }

  return response.tags
}

function findMemoriesWithTags(history: RoutineResult[], characterName: string, tags: string[]): MemoryItem[] {
  return history
    .flatMap(routine => 
      routine.characterMemories
        .filter(cm => cm.characterName === characterName)
        .flatMap(cm => cm.memories)
    )
    .filter(memory => 
      memory.tags.some(tag => tags.includes(tag))
    )
}

export async function searchRelevantMemories({
  openai,
  commonPrompt,
  currentCharacter,
  characters,
  history
}: SearchRelevantMemoriesArgs): Promise<MemoryItem[]> {
  if (characters.length === 0 || history.length === 0) return []

  const existingTags = collectExistingTags(history, currentCharacter.name)
  if (existingTags.length === 0) return []

  const prompt = createMemorySearchPrompt({
    currentCharacter,
    allCharacters: characters,
    commonPrompt,
    history,
    existingTags
  })

  const selectedTags = await selectRelevantTags({
    openai,
    prompt,
    existingTags
  })

  return findMemoriesWithTags(history, currentCharacter.name, selectedTags)
}