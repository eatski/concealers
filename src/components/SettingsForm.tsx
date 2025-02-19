import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  Paper,
  Stack
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { type GameStateProps } from './GameStateProvider'

function SettingsForm({
  apiKey,
  commonPrompt,
  characters,
  onCharacterChange,
  onAddCharacter,
  onRemoveCharacter,
  onApiKeyChange,
  onCommonPromptChange,
  onModeChange
}: GameStateProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onModeChange('confirm')
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          正体隠匿系TRPGテスター
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <TextField
                  fullWidth
                  label="共通の情報"
                  value={commonPrompt}
                  onChange={(e) => onCommonPromptChange(e.target.value)}
                  placeholder="全キャラクターが知っている共通の情報"
                  multiline
                  rows={4}
                  variant="outlined"
                />
              </CardContent>
            </Card>

            {characters.map((character, index) => (
              <Card key={index}>
                <CardContent sx={{ p: 4 }}>
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">
                        キャラクター {index + 1}
                      </Typography>
                      <IconButton
                        onClick={() => onRemoveCharacter(index)}
                        disabled={characters.length === 1}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <TextField
                      fullWidth
                      label="名前"
                      value={character.name}
                      onChange={(e) => onCharacterChange(index, 'name', e.target.value)}
                      placeholder="キャラクターの名前"
                      variant="outlined"
                    />

                    <TextField
                      fullWidth
                      label="説明"
                      value={character.description}
                      onChange={(e) => onCharacterChange(index, 'description', e.target.value)}
                      placeholder="キャラクターの説明"
                      multiline
                      rows={4}
                      variant="outlined"
                    />

                    <TextField
                      fullWidth
                      label="隠しプロンプト"
                      value={character.hiddenPrompt}
                      onChange={(e) => onCharacterChange(index, 'hiddenPrompt', e.target.value)}
                      placeholder="キャラクターの隠しプロンプト"
                      multiline
                      rows={4}
                      variant="outlined"
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={onAddCharacter}
              variant="outlined"
              fullWidth
              sx={{ height: 56 }}
            >
              キャラクターを追加
            </Button>

            <Paper elevation={3}>
              <Box sx={{ p: 4 }}>
                <Stack direction="row" spacing={3}>
                  <TextField
                    fullWidth
                    type="password"
                    label="OpenAI APIキー"
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    variant="outlined"
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={
                      !apiKey || 
                      !commonPrompt ||
                      characters.some(char => !char.name || !char.description || !char.hiddenPrompt)
                    }
                    sx={{
                      height: '56px',
                      minWidth: '200px'
                    }}
                  >
                    確認画面へ
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Stack>
        </form>
      </Box>
    </Container>
  )
}

export default SettingsForm