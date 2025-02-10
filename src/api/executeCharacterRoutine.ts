import { createCharacterThoughts } from './analyzeCharacterThoughts'
import { createCharacterSpeech } from './createCharacterSpeech'
import { searchRelevantMemories } from './searchRelevantMemories'
import { OpenAI } from 'openai'
import { type Character, type RoutineResult } from '../shared'

export interface ExecuteCharacterRoutineArgs {
  openai: OpenAI
  commonPrompt: string
  characters: Character[]
  history: RoutineResult[]
  random?: () => number
}

export async function executeCharacterRoutine({
  openai,
  commonPrompt,
  characters,
  history,
  random = Math.random
}: ExecuteCharacterRoutineArgs): Promise<RoutineResult> {
  // 各キャラクターの思考を並列で生成
  const characterMemoriesPromises = characters.map(async character => {
    // キャラクターごとに関連する記憶を検索
    const relevantMemories = await searchRelevantMemories({
      openai,
      commonPrompt,
      currentCharacter: character,
      characters,
      history
    })
    
    return createCharacterThoughts({
      openai,
      commonPrompt,
      currentCharacter: character,
      allCharacters: characters,
      history,
      relevantMemories
    })
  })

  const characterMemories = await Promise.all(characterMemoriesPromises)
  const speech = await createCharacterSpeech({
    openai,
    commonPrompt,
    characters,
    characterMemories,
    history,
    random
  })
  
  return {
    characterMemories,
    speech
  }
}