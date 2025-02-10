import { OpenAI } from 'openai'
import { z } from 'zod'
import type { Character, CharacterSpeech, RoutineResult, MemoryItem } from '../../shared'
import type { CharacterMemoriesWithUrgency } from '../analyzeCharacterThoughts'
import { buildPrompt } from '../../libs/prompt-builder'
import { makeOpenAIRequest } from '../../libs/openai-request'

export interface CreateCharacterSpeechArgs {
  openai: OpenAI
  commonPrompt: string
  character: Character
  characterMemories: CharacterMemoriesWithUrgency
  relevantMemories: MemoryItem[]
  characters: Character[]
  history: RoutineResult[]
}

interface CreateSpeechPromptArgs {
  character: Character
  characterMemories: CharacterMemoriesWithUrgency
  relevantMemories: MemoryItem[]
  allCharacters: Character[]
  commonPrompt: string
  history: RoutineResult[]
}

// zodスキーマ
const characterSpeechResponseSchema = z.object({
  speech: z.string().describe('キャラクターの発言内容')
})

function createSpeechPrompt({
  character,
  characterMemories,
  relevantMemories,
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
      name: '関連する記憶',
      content: relevantMemories.map(m => 
        `認識した情報: ${m.recognizedInfo}
考え: ${m.thought}`
      ).join('\n\n')
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
  character,
  characterMemories,
  relevantMemories,
  characters,
  history,
}: CreateCharacterSpeechArgs): Promise<CharacterSpeech | null> {
  if (!character || !characterMemories) return null

  const prompt = createSpeechPrompt({
    character,
    characterMemories,
    relevantMemories,
    allCharacters: characters,
    commonPrompt,
    history
  })

  const response = await makeOpenAIRequest({
    openai,
    schema: characterSpeechResponseSchema,
    systemPrompt: '与えられた状況に基づいて、キャラクターらしい自然な発言を生成してください。発言は100文字程度に収めてください。',
    userPrompt: prompt,
    functionName: 'generateSpeech',
    functionDescription: 'キャラクターの発言を生成'
  })

  return {
    characterName: character.name,
    speech: response.speech
  }
}