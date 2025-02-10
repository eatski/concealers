import { OpenAI } from 'openai'
import type { Character, CharacterMemories, MemoryItem, RoutineResult } from '../shared'

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

import { buildPrompt } from '../libs/prompt-builder'

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
    
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: 'system',
        content: '現在の状況から複数の観点で状況を認識し、それぞれに対する考えを回答してください。各認識に関連するキーワードやキャラクター名をタグとして付与してください。また、全体的な発言意欲も回答してください。過去あなたの発言が多い場合は発言意欲は低めにしてください。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    functions: [
      {
        name: 'analyzeThoughtsAndUrgency',
        description: 'キャラクターの状況認識と考え、全体的な発言意欲',
        parameters: {
          type: 'object',
          properties: {
            memories: {
              type: 'array',
              description: '認識した情報とそれに対する考えの配列',
              items: {
                type: 'object',
                properties: {
                  recognizedInfo: {
                    type: 'string',
                    description: '現在の状況で認識した情報を100文字程度で説明'
                  },
                  thought: {
                    type: 'string',
                    description: 'その状況に対して考えたことを100文字程度で説明'
                  },
                  tags: {
                    type: 'array',
                    description: 'この記憶に関連するキーワードやキャラクター名の配列(1~2個)',
                    items: {
                      type: 'string'
                    }
                  }
                },
                required: ['recognizedInfo', 'thought', 'tags']
              }
            },
            urgency: {
              type: 'integer',
              description: '全体的な発言への意欲（1: 特に話すことがない・誰かが話すのを聞きたい・直近発言したばかり, 2: 強い意欲があるわけではないが話すことがある, 3: 積極的に話したい・話す責務がある）',
              minimum: 1,
              maximum: 3
            }
          },
          required: ['memories', 'urgency']
        }
      }
    ],
    function_call: { name: 'analyzeThoughtsAndUrgency' }
  })

  const functionCall = completion.choices[0].message.function_call
  if (!functionCall || !functionCall.arguments) {
    throw new Error('APIからの応答が不正です')
  }

  const response = JSON.parse(functionCall.arguments) as {
    memories: MemoryItem[],
    urgency: 1 | 2 | 3
  }

  return {
    characterName: currentCharacter.name,
    memories: response.memories,
    urgency: response.urgency
  }
}