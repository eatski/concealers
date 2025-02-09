import { useState, useSyncExternalStore } from 'react'
import { type Character } from '../shared'

export type FormMode = 'input' | 'confirm'
import SettingsForm from './SettingsForm'
import ApiHandler from './ApiHandler'

const API_KEY_STORAGE_KEY = 'concealers-api-key'
const API_KEY_CHANGE_EVENT = 'api-key-change'

// ローカルストレージとの同期用関数
const getApiKey = () => localStorage.getItem(API_KEY_STORAGE_KEY) ?? ''
const setApiKey = (value: string) => {
  localStorage.setItem(API_KEY_STORAGE_KEY, value)
  // 同じドキュメント内での更新を通知
  window.dispatchEvent(new CustomEvent(API_KEY_CHANGE_EVENT, { detail: value }))
}

// ストアのサブスクリプション管理
const subscribe = (callback: () => void) => {
  // storageイベント（他のタブでの更新）をリッスン
  const handleStorage = (e: StorageEvent) => {
    if (e.key === API_KEY_STORAGE_KEY) {
      callback()
    }
  }
  
  // カスタムイベント（同じタブでの更新）をリッスン
  const handleCustomEvent = () => {
    callback()
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(API_KEY_CHANGE_EVENT, handleCustomEvent)
  
  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(API_KEY_CHANGE_EVENT, handleCustomEvent)
  }
}

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
  const apiKey = useSyncExternalStore(subscribe, getApiKey)
  const [commonPrompt, setCommonPrompt] = useState('')
  const [characters, setCharacters] = useState<Character[]>([
    { name: '', description: '', hiddenPrompt: '' }
  ])

  const handleApiKeyChange = (value: string) => {
    setApiKey(value)
  }

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
    onApiKeyChange: handleApiKeyChange,
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