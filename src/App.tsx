import { useState } from 'react'
import { OpenAI, APIError } from 'openai'
import useSWRMutation from 'swr/mutation'

function App() {
  const [apiKey, setApiKey] = useState('')
  const [response, setResponse] = useState<string | null>(null)

  async function sendRequest() {
    if (!apiKey) return null
    
    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    })

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'こんにちは' }]
      })

      return completion.choices[0].message.content
    } catch (error) {
      console.error('Error:', error)
      if (error instanceof APIError) {
        if (error.status === 401) {
          throw new Error('APIキーが無効です')
        } else if (error.status === 429) {
          throw new Error('リクエスト制限に達しました')
        }
      }
      throw new Error('予期せぬエラーが発生しました')
    }
  }

  const { trigger, isMutating, error } = useSWRMutation(
    'chat',
    async () => {
      const result = await sendRequest()
      return result
    },
    {
      onSuccess: (data) => {
        setResponse(data)
      }
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResponse(null)
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
      {response && <div>{response}</div>}
    </div>
  )
}

export default App
