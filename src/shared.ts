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

export interface RoutineResult {
  thoughts: Array<{
    characterName: string
    thought: string
    urgency: 1 | 2 | 3
  }>
  speech: {
    characterName: string
    speech: string
  } | null
}