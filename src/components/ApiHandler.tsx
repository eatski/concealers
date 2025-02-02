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
import { analyzeCharacterThoughts, type CharacterThoughtAnalysis } from '../api/analyzeCharacterThoughts'
import { type GameStateProps } from './GameStateProvider'

function ApiHandler({
  apiKey,
  characters,
  onModeChange
}: GameStateProps) {
  const { trigger, isMutating, error, data } = useSWRMutation<CharacterThoughtAnalysis[]>(
    'chat',
    () => analyzeCharacterThoughts(apiKey, characters)
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
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                  会話ログ
                </Typography>
                <Stack spacing={2}>
                  {data.map((response, index) => (
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
                'APIに送信'
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