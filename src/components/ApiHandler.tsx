import useSWRMutation from 'swr/mutation'
import {
  Container,
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Stack
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { createCharacterThoughts } from '../api/analyzeCharacterThoughts'
import { createCharacterSpeech } from '../api/createCharacterSpeech'
import { type GameStateProps } from './GameStateProvider'
import { type RoutineResult } from '../shared'
import { useState } from 'react'

function ApiHandler({
  apiKey,
  commonPrompt,
  characters,
  onModeChange
}: GameStateProps) {
  const [history, setHistory] = useState<RoutineResult[]>([])

  const {
    trigger,
    isMutating,
    error,
    data
  } = useSWRMutation<RoutineResult>(
    'chat',
    async () => {
      const thoughts = await createCharacterThoughts(apiKey, commonPrompt, characters, history)
      const speech = await createCharacterSpeech(apiKey, commonPrompt, characters, thoughts, history)
      
      const result: RoutineResult = {
        thoughts: thoughts.map((thought, index) => ({
          characterName: characters[index].name,
          thought: thought.thought,
          urgency: thought.urgency
        })),
        speech: speech ? {
          characterName: speech.character.name,
          speech: speech.speech
        } : null
      }
      
      setHistory(prev => [...prev, result])
      return result
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await trigger()
  }

  const handleBack = () => {
    onModeChange('input')
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          正体隠匿系TRPGテスター
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
          各キャラクターの思考と最も話したいキャラクターの発言を確認できます
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Box sx={{ mb: 2 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
              >
                入力画面に戻る
              </Button>
            </Box>

            <Card>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={3}>
                  <Typography variant="h6">
                    共通の情報
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {commonPrompt}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {characters.map((character, index) => (
              <Card key={index}>
                <CardContent sx={{ p: 4 }}>
                  <Stack spacing={3}>
                    <Typography variant="h6">
                      キャラクター {index + 1}
                    </Typography>

                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        名前
                      </Typography>
                      <Typography variant="body1">
                        {character.name}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        説明
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {character.description}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        隠しプロンプト
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {character.hiddenPrompt}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}

            {data && (
              <>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h5" gutterBottom>
                    キャラクターの思考
                  </Typography>
                  <Stack spacing={2}>
                    {data.thoughts.map((response, index) => (
                      <Paper key={index} sx={{ p: 3, bgcolor: 'grey.50' }}>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" color="primary">
                              {characters[index].name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              発言への意欲：{
                                response.urgency === 1 ? '1 (聞き手)' :
                                response.urgency === 2 ? '2 (普通)' :
                                '3 (積極的)'
                              }
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {response.thought}
                          </Typography>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>

                {data.speech && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" gutterBottom>
                      発言
                    </Typography>
                    <Paper sx={{ p: 3, bgcolor: 'primary.light' }}>
                      <Stack spacing={2}>
                        <Typography variant="h6" color="white">
                          {data.speech.characterName}
                        </Typography>
                        <Typography variant="body1" color="white" sx={{ whiteSpace: 'pre-wrap' }}>
                          {data.speech.speech}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Box>
                )}

                {history.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" gutterBottom>
                      これまでの履歴
                    </Typography>
                    <Stack spacing={3}>
                      {history.map((routine, index) => (
                        <Paper key={index} sx={{ p: 3 }}>
                          <Stack spacing={3}>
                            <Box>
                              <Typography variant="subtitle1" gutterBottom>
                                各キャラクターの思考
                              </Typography>
                              <Stack spacing={2}>
                                {routine.thoughts.map((thought, thoughtIndex) => (
                                  <Box key={thoughtIndex}>
                                    <Typography variant="subtitle2" color="primary">
                                      {thought.characterName}（発言意欲: {thought.urgency}）
                                    </Typography>
                                    <Typography variant="body2">
                                      {thought.thought}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            </Box>

                            {routine.speech && (
                              <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                  発言
                                </Typography>
                                <Box sx={{ pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
                                  <Typography variant="subtitle2" color="primary">
                                    {routine.speech.characterName}
                                  </Typography>
                                  <Typography variant="body2">
                                    {routine.speech.speech}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}
              </>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={isMutating}
              fullWidth
              sx={{ height: 56, mt: 2 }}
            >
              {isMutating ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                data ? '次のルーチンを実行' : 'ルーチンを開始'
              )}
            </Button>
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

export default ApiHandler