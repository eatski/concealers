import { useState } from 'react'
import useSWRMutation from 'swr/mutation'
import { sendRequest } from './api/openai'

interface Character {
  name: string
  description: string
  hiddenPrompt: string
}

function App() {
  const [apiKey, setApiKey] = useState('')
  const [characters, setCharacters] = useState<Character[]>([
    { name: '', description: '', hiddenPrompt: '' }
  ])

  const { trigger, isMutating, error, data } = useSWRMutation<string | null>(
    'chat',
    async () => {
      const result = await sendRequest(apiKey, characters)
      return result
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await trigger()
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

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          {characters.map((character, index) => (
            <div key={index}>
              <div>
                <h3>キャラクター {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeCharacter(index)}
                  disabled={characters.length === 1}
                >
                  削除
                </button>
              </div>

              <div>
                <label>名前</label>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => handleCharacterChange(index, 'name', e.target.value)}
                  placeholder="キャラクターの名前"
                />
              </div>

              <div>
                <label>説明</label>
                <textarea
                  value={character.description}
                  onChange={(e) => handleCharacterChange(index, 'description', e.target.value)}
                  placeholder="キャラクターの説明"
                  rows={3}
                />
              </div>

              <div>
                <label>隠しプロンプト</label>
                <textarea
                  value={character.hiddenPrompt}
                  onChange={(e) => handleCharacterChange(index, 'hiddenPrompt', e.target.value)}
                  placeholder="キャラクターの隠しプロンプト"
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addCharacter}
        >
          キャラクターを追加
        </button>

        <div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="OpenAI APIキーを入力"
          />
          <button
            type="submit"
            disabled={!apiKey || isMutating}
          >
            {isMutating ? '送信中...' : '送信'}
          </button>
        </div>
      </form>
      
      {isMutating && <div>応答を待っています...</div>}
      {error && <div>{error.message}</div>}
      {data && <div>{data}</div>}
    </div>
  )
}

export default App
