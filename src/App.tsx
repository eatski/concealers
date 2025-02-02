import { useState } from 'react'
import useSWRMutation from 'swr/mutation'
import { sendRequest } from './api/openai'

function App() {
  const [apiKey, setApiKey] = useState('')

  const { trigger, isMutating, error, data } = useSWRMutation<string | null>(
    'chat',
    async () => {
      const result = await sendRequest(apiKey)
      return result
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await trigger()
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="OpenAI APIキーを入力"
        />
        <button type="submit" disabled={!apiKey || isMutating}>
          {isMutating ? '送信中...' : '送信'}
        </button>
      </form>
      
      {isMutating && <div>応答を待っています...</div>}
      {error && <div>{error.message}</div>}
      {data && <div>{data}</div>}
    </div>
  )
}

export default App
