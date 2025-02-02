import { useState } from 'react'
import useSWRMutation from 'swr/mutation'
import { sendRequest, type CharacterResponse } from './api/openai'
import { type FormMode, type Character } from './shared'
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Stack
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

function App() {
  const [mode, setMode] = useState<FormMode>('input')
  const [apiKey, setApiKey] = useState('')
  const [characters, setCharacters] = useState<Character[]>([
    { name: '', description: '', hiddenPrompt: '' }
  ])

  const { trigger, isMutating, error, data } = useSWRMutation<CharacterResponse[]>(
    'chat',
    () => sendRequest(apiKey, characters)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'input') {
      setMode('confirm')
    } else {
      await trigger()
    }
  }

  const handleBack = () => {
    setMode('input')
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
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          正体隠匿系TRPGテスター
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {mode === 'input' ? (
              // 入力モード
              <>
                {characters.map((character, index) => (
                  <Card key={index}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6">
                            キャラクター {index + 1}
                          </Typography>
                          <IconButton
                            onClick={() => removeCharacter(index)}
                            disabled={characters.length === 1}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>

                        <TextField
                          fullWidth
                          label="名前"
                          value={character.name}
                          onChange={(e) => handleCharacterChange(index, 'name', e.target.value)}
                          placeholder="キャラクターの名前"
                          variant="outlined"
                        />

                        <TextField
                          fullWidth
                          label="説明"
                          value={character.description}
                          onChange={(e) => handleCharacterChange(index, 'description', e.target.value)}
                          placeholder="キャラクターの説明"
                          multiline
                          rows={3}
                          variant="outlined"
                        />

                        <TextField
                          fullWidth
                          label="隠しプロンプト"
                          value={character.hiddenPrompt}
                          onChange={(e) => handleCharacterChange(index, 'hiddenPrompt', e.target.value)}
                          placeholder="キャラクターの隠しプロンプト"
                          multiline
                          rows={3}
                          variant="outlined"
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  startIcon={<AddIcon />}
                  onClick={addCharacter}
                  variant="outlined"
                  fullWidth
                >
                  キャラクターを追加
                </Button>

                <Paper elevation={3}>
                  <Box sx={{ p: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <TextField
                        fullWidth
                        type="password"
                        label="OpenAI APIキー"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        variant="outlined"
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={!apiKey || characters.some(char => !char.name || !char.description || !char.hiddenPrompt)}
                        sx={{
                          height: '56px',
                          minWidth: { xs: '100%', md: '200px' }
                        }}
                      >
                        確認画面へ
                      </Button>
                    </Stack>
                  </Box>
                </Paper>
              </>
            ) : (
              // 確認モード
              <>
                <Box sx={{ mb: 2 }}>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                  >
                    入力画面に戻る
                  </Button>
                </Box>

                {characters.map((character, index) => (
                  <Card key={index}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Typography variant="h6">
                          キャラクター {index + 1}
                        </Typography>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            名前
                          </Typography>
                          <Typography>
                            {character.name}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            説明
                          </Typography>
                          <Typography>
                            {character.description}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            隠しプロンプト
                          </Typography>
                          <Typography>
                            {character.hiddenPrompt}
                          </Typography>
                        </Box>

                        {data && data[index] && (
                          <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                            <Stack spacing={1}>
                              <Typography variant="subtitle2">
                                次の発言：
                              </Typography>
                              <Typography>
                                {data[index].nextStatement}
                              </Typography>
                              <Typography variant="subtitle2">
                                発言への意欲：{data[index].urgency}/5
                              </Typography>
                            </Stack>
                          </Paper>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isMutating}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  {isMutating ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'APIに送信'
                  )}
                </Button>
              </>
            )}
          </Stack>
        </form>

        <Stack spacing={2} sx={{ mt: 3 }}>
          {isMutating && (
            <Alert severity="info">
              応答を待っています...
            </Alert>
          )}
          {error && (
            <Alert severity="error">
              {error.message}
            </Alert>
          )}
        </Stack>
      </Box>
    </Container>
  )
}

export default App
