import type { Character } from '../../shared'
import type { Section } from '.'

export function createCommonSections({
  commonPrompt,
  character,
  allCharacters
}: {
  commonPrompt: string
  character: Character
  allCharacters: Character[]
}): Section[] {
  const otherCharacters = allCharacters.filter(char => char.name !== character.name)

  return [
    {
      name: '共通の情報',
      content: commonPrompt
    },
    {
      name: 'あなたの情報',
      content: `名前: ${character.name}
説明: ${character.description}
隠している情報: ${character.hiddenPrompt}`
    },
    {
      name: '他のキャラクター',
      content: otherCharacters.map(char =>
        `名前: ${char.name}
説明: ${char.description}`
      ).join('\n')
    }
  ]
}