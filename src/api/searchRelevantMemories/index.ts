import { OpenAI } from 'openai'
import { z } from 'zod'
import type { Character, RoutineResult, MemoryItem } from '../../shared'
import { buildPrompt } from '../../libs/prompt-builder'
import { makeOpenAIRequest } from '../../libs/openai-request'

export interface SearchRelevantMemoriesArgs {
  openai: OpenAI
  commonPrompt: string
  currentCharacter: Character
  characters: Character[]
  history: RoutineResult[]
}

interface CreateMemorySearchPromptArgs {
  currentCharacter: Character
  allCharacters: Character[]
  commonPrompt: string
  history: RoutineResult[]
  existingTags: string[]
}

// zodスキーマ
const selectTagsResponseSchema = z.object({
  tags: z.array(z.string())
    .describe('選択されたタグのリスト。多すぎると情報を処理しきれないので必要最低限のタグのみを選択する。')
})

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

function createMemorySearchPrompt({
  currentCharacter,
  allCharacters,
  commonPrompt,
  history,
  existingTags
}: CreateMemorySearchPromptArgs) {
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

  const response = await makeOpenAIRequest({
    openai,
    schema: selectTagsResponseSchema,
    systemPrompt: '直近の会話から、関連する記憶を見つけるために、利用可能なタグの中から適切なものを選択してください。',
    userPrompt: prompt,
    functionName: 'selectTags',
    functionDescription: '利用可能なタグから、関連する記憶のタグを選択'
  })

  return findMemoriesWithTags(history, currentCharacter.name, response.tags)
}