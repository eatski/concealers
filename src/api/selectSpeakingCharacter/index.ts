import type { Character } from '../../shared'
import type { CharacterMemoriesWithUrgency } from '../analyzeCharacterThoughts'

export interface SelectSpeakingCharacterArgs {
  characters: Character[]
  characterMemories: CharacterMemoriesWithUrgency[]
  random?: () => number
}

export function selectSpeakingCharacter({
  characters,
  characterMemories,
  random = Math.random
}: SelectSpeakingCharacterArgs): Character | null {
  if (characterMemories.length === 0 || characters.length === 0) return null

  // 最も高い発言意欲を持つキャラクターを見つける
  const maxUrgency = Math.max(...characterMemories.map(cm => cm.urgency))
  const highestUrgencyCharacterMemories = characterMemories.filter(cm => cm.urgency === maxUrgency)

  // 最も高い発言意欲を持つキャラクターが複数いる場合はランダムに1人選択
  const selectedMemories = highestUrgencyCharacterMemories[Math.floor(random() * highestUrgencyCharacterMemories.length)]
  if (!selectedMemories) return null

  // 選択されたメモリに対応するキャラクターを返す
  return characters.find(c => c.name === selectedMemories.characterName) ?? null
}