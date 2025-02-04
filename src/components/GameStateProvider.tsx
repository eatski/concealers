import { useState } from 'react'
import { type FormMode, type Character } from '../shared'
import SettingsForm from './SettingsForm'
import ApiHandler from './ApiHandler'

export interface GameStateProps {
  mode: FormMode
  apiKey: string
  commonPrompt: string
  characters: Character[]
  onCharacterChange: (index: number, field: keyof Character, value: string) => void
  onAddCharacter: () => void
  onRemoveCharacter: (index: number) => void
  onApiKeyChange: (value: string) => void
  onCommonPromptChange: (value: string) => void
  onModeChange: (mode: FormMode) => void
}

function GameStateProvider() {
  const [mode, setMode] = useState<FormMode>('input')
  const [apiKey, setApiKey] = useState('')
  const [commonPrompt, setCommonPrompt] = useState('')
  const [characters, setCharacters] = useState<Character[]>([
    { name: '', description: '', hiddenPrompt: '' }
  ])

  const handleCharacterChange = (index: number, field: keyof Character, value: string) => {
    const newCharacters = characters.map((char, i) => {
      if (i === index) {
        return { ...char, [field]: value }
      }
      return char
    })
    setCharacters(newCharacters)
  }

  const addCharacter = () => {
    setCharacters([...characters, { name: '', description: '', hiddenPrompt: '' }])
  }

  const removeCharacter = (index: number) => {
    if (characters.length > 1) {
      setCharacters(characters.filter((_, i) => i !== index))
    }
  }

  const gameStateProps: GameStateProps = {
    mode,
    apiKey,
    commonPrompt,
    characters,
    onCharacterChange: handleCharacterChange,
    onAddCharacter: addCharacter,
    onRemoveCharacter: removeCharacter,
    onApiKeyChange: setApiKey,
    onCommonPromptChange: setCommonPrompt,
    onModeChange: setMode
  }

  return mode === 'input' ? (
    <SettingsForm {...gameStateProps} />
  ) : (
    <ApiHandler {...gameStateProps} />
  )
}

export default GameStateProvider