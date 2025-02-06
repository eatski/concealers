export type FormMode = 'input' | 'confirm'

export interface Character {
  name: string
  description: string
  hiddenPrompt: string
}

export interface GameSettings {
  commonPrompt: string
  characters: Character[]
}

export interface CharacterThought {
  characterName: string
  thought: string
  urgency: 1 | 2 | 3
}

export interface CharacterSpeech {
  characterName: string
  speech: string
}

export interface RoutineResult {
  thoughts: CharacterThought[]
  speech: CharacterSpeech | null
}