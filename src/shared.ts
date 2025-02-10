export interface Character {
  name: string
  description: string
  hiddenPrompt: string
}

export interface GameSettings {
  commonPrompt: string
  characters: Character[]
}

export interface MemoryItem {
  recognizedInfo: string
  thought: string
  tags: string[]
}

export interface CharacterMemories {
  characterName: string
  memories: MemoryItem[]
}

export interface CharacterSpeech {
  characterName: string
  speech: string
}

export interface RoutineResult {
  characterMemories: CharacterMemories[]
  speech: CharacterSpeech | null
}