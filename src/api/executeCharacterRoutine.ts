import { OpenAI } from 'openai'
import { createCharacterThoughts } from './analyzeCharacterThoughts'
import { createCharacterSpeech } from './createCharacterSpeech'
import { type GameStateProps } from '../components/GameStateProvider'
import { type RoutineResult } from '../shared'

export async function executeCharacterRoutine(
  openai: OpenAI,
  commonPrompt: string,
  characters: GameStateProps['characters'],
  history: RoutineResult[]
): Promise<RoutineResult> {
  const thoughts = await createCharacterThoughts(openai, commonPrompt, characters, history)
  const speech = await createCharacterSpeech(openai, commonPrompt, characters, thoughts, history)
  
  return {
    thoughts: thoughts.map((thought, index) => ({
      characterName: characters[index].name,
      thought: thought.thought,
      urgency: thought.urgency
    })),
    speech: speech ? {
      characterName: speech.character.name,
      speech: speech.speech
    } : null
  }
}