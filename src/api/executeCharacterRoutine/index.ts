import { OpenAI } from 'openai'
import type { Character, RoutineResult } from '../../shared'
import { createCharacterThoughts } from '../analyzeCharacterThoughts'
import { createCharacterSpeech } from '../createCharacterSpeech'
import { searchRelevantMemories } from '../searchRelevantMemories'
import { selectSpeakingCharacter } from '../selectSpeakingCharacter'

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
  // 各キャラクターの思考と関連する記憶を並列で生成
  const characterData = await Promise.all(characters.map(async character => {
    // キャラクターごとに関連する記憶を検索
    const relevantMemories = await searchRelevantMemories({
      openai,
      commonPrompt,
      currentCharacter: character,
      characters,
      history
    })
    
    const memories = await createCharacterThoughts({
      openai,
      commonPrompt,
      currentCharacter: character,
      allCharacters: characters,
      history,
      relevantMemories
    })

    return {
      character,
      memories,
      relevantMemories
    }
  }))

  const characterMemories = characterData.map(data => data.memories)
  
  // 発言するキャラクターを選択
  const selectedCharacter = selectSpeakingCharacter({
    characters,
    characterMemories,
    random
  })

  const selectedData = selectedCharacter 
    ? characterData.find(data => data.character.name === selectedCharacter.name)
    : null

  const speech = selectedData
    ? await createCharacterSpeech({
        openai,
        commonPrompt,
        character: selectedData.character,
        characterMemories: selectedData.memories,
        relevantMemories: selectedData.relevantMemories,
        characters,
        history
      })
    : null
  
  return {
    characterMemories,
    speech
  }
}