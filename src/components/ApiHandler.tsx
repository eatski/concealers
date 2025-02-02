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
import { sendRequest, type CharacterResponse } from '../api/openai'
import { type GameStateProps } from './GameStateProvider'

function ApiHandler({
  apiKey,
  characters,
  onModeChange
}: GameStateProps) {
  const { trigger, isMutating, error, data } = useSWRMutation<CharacterResponse[]>(
    'chat',
    () => sendRequest(apiKey, characters)
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

                    {data && data[index] && (
                      <Paper sx={{ p: 3, bgcolor: 'grey.100' }}>
                        <Stack spacing={2}>
                          <Typography variant="subtitle1">
                            次の発言：
                          </Typography>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {data[index].nextStatement}
                          </Typography>
                          <Typography variant="subtitle1">
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