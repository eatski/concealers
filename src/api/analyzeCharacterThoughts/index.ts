import { OpenAI } from 'openai'
import { z } from 'zod'
import type { Character, CharacterMemories, MemoryItem, RoutineResult } from '../../shared'
import { buildPrompt } from '../../libs/prompt-builder'
import { makeOpenAIRequest } from '../../libs/openai-request'

export interface CreateCharacterThoughtsArgs {
  openai: OpenAI
  commonPrompt: string
  currentCharacter: Character
  allCharacters: Character[]
  history: RoutineResult[]
  relevantMemories: MemoryItem[]
}

interface CreateCharacterAnalysisPromptArgs {
  currentCharacter: Character
  allCharacters: Character[]
  commonPrompt: string
  history: RoutineResult[]
  relevantMemories: MemoryItem[]
}

// 内部的に使用する型定義
export interface CharacterMemoriesWithUrgency extends CharacterMemories {
  urgency: 1 | 2 | 3
}

// zodスキーマ
const memoryItemResponseSchema = z.object({
  recognizedInfo: z.string().describe('現在の状況で認識した情報を100文字程度で説明'),
  thought: z.string().describe('その状況に対して考えたことを100文字程度で説明'),
  tags: z.array(z.string()).describe('この記憶に関連するキーワードやキャラクター名の配列(1~2個)')
})

const characterThoughtsResponseSchema = z.object({
  memories: z.array(memoryItemResponseSchema).describe('認識した情報とそれに対する考えの配列'),
  urgency: z.union([z.literal(1), z.literal(2), z.literal(3)])
    .describe('全体的な発言への意欲（1: 特に話すことがない・誰かが話すのを聞きたい・直近発言したばかり, 2: 強い意欲があるわけではないが話すことがある, 3: 積極的に話したい・話す責務がある）')
})

function createCharacterAnalysisPrompt({
  currentCharacter,
  allCharacters,
  commonPrompt,
  history,
  relevantMemories
}: CreateCharacterAnalysisPromptArgs) {
  const otherCharacters = allCharacters.filter(char => char !== currentCharacter)
  
  const sections = [
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
      ).join('\n')
    }
  ]

  if (relevantMemories.length > 0) {
    sections.push({
      name: '関連する過去の記憶',
      content: relevantMemories.map(memory =>
        `認識した情報: ${memory.recognizedInfo}
考え: ${memory.thought}`
      ).join('\n')
    })
  }

  if (history.length > 0) {
    sections.push({
      name: '直近の会話',
      content: history.slice(-3).map((routine) =>
        `${routine.speech
          ? `${routine.speech.characterName === currentCharacter.name ? "あなた" : routine.speech.characterName}の発言: ${routine.speech.speech}`
          : '発言なし'}`
      ).join('\n')
    })
  }

  return buildPrompt(sections)
}

export async function createCharacterThoughts({
  openai,
  commonPrompt,
  currentCharacter,
  allCharacters,
  history,
  relevantMemories
}: CreateCharacterThoughtsArgs): Promise<CharacterMemoriesWithUrgency> {
  const prompt = createCharacterAnalysisPrompt({
    currentCharacter,
    allCharacters,
    commonPrompt,
    history,
    relevantMemories
  })

  const response = await makeOpenAIRequest({
    openai,
    schema: characterThoughtsResponseSchema,
    systemPrompt: '現在の状況から複数の観点で状況を認識し、それぞれに対する考えを回答してください。各認識に関連するキーワードやキャラクター名をタグとして付与してください。また、全体的な発言意欲も回答してください。過去あなたの発言が多い場合は発言意欲は低めにしてください。',
    userPrompt: prompt,
    functionName: 'analyzeThoughtsAndUrgency',
    functionDescription: 'キャラクターの状況認識と考え、全体的な発言意欲'
  })

  return {
    characterName: currentCharacter.name,
    memories: response.memories,
    urgency: response.urgency
  }
}