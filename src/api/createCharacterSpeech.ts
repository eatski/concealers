import { OpenAI } from 'openai'
import type { Character, CharacterThought, CharacterSpeech, RoutineResult } from '../shared'

function selectSpeakingCharacter(
  thoughts: CharacterThought[],
  random: () => number = Math.random
): CharacterThought | null {
  if (thoughts.length === 0) return null

  // 最も高い発言意欲を持つキャラクターを見つける
  const maxUrgency = Math.max(...thoughts.map(t => t.urgency))
  const highestUrgencyThoughts = thoughts.filter(t => t.urgency === maxUrgency)

  // 最も高い発言意欲を持つキャラクターが複数いる場合はランダムに1人選択
  return highestUrgencyThoughts[Math.floor(random() * highestUrgencyThoughts.length)]
}

function createSpeechPrompt(
  character: Character,
  thought: CharacterThought,
  allCharacters: Character[],
  commonPrompt: string,
  history: RoutineResult[]
) {
  const otherCharacters = allCharacters.filter(char => char.name !== character.name)

  return `
<共通の情報>
${commonPrompt}
</共通の情報>
<あなたの情報>
名前: ${character.name}
説明: ${character.description}
隠している情報: ${character.hiddenPrompt}
現在の考え: ${thought.thought}
</あなたの情報>
<他のキャラクター>
${otherCharacters.map(char => `
名前: ${char.name}
説明: ${char.description}
`).join('\n')}
${history.length > 0
  ? `
</他のキャラクター>
<これまでの会話>
${history.map((routine) => `
${routine.thoughts
.filter(t => t.characterName === character.name)
.map(t => `あなたの考え: ${t.thought}`).join('\n')}
${routine.speech
? `${routine.speech.characterName === character.name ? "あなた" : routine.speech.characterName}の発言: ${routine.speech.speech}`
: '発言なし'}`
).join('\n')}
`
  : ''}
</これまでの会話>
`.trim()
}

export async function createCharacterSpeech(
  openai: OpenAI,
  commonPrompt: string,
  characters: Character[],
  thoughts: CharacterThought[],
  history: RoutineResult[],
  random: () => number = Math.random
): Promise<CharacterSpeech | null> {
  if (characters.length === 0 || thoughts.length === 0) return null

  // 発言するキャラクターの思考を選択
  const selectedThought = selectSpeakingCharacter(thoughts, random)
  if (!selectedThought) return null

  // 選択された思考に対応するキャラクターを取得
  const selectedCharacter = characters.find(c => c.name === selectedThought.characterName)
  if (!selectedCharacter) return null

  const prompt = createSpeechPrompt(selectedCharacter, selectedThought, characters, commonPrompt, history)
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: 'system',
        content: '与えられた状況に基づいて、キャラクターらしい自然な発言を生成してください。発言は100文字程度に収めてください。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    functions: [
      {
        name: 'generateSpeech',
        description: 'キャラクターの発言を生成',
        parameters: {
          type: 'object',
          properties: {
            speech: {
              type: 'string',
              description: 'キャラクターの発言内容'
            }
          },
          required: ['speech']
        }
      }
    ],
    function_call: { name: 'generateSpeech' }
  })

  const functionCall = completion.choices[0].message.function_call
  if (!functionCall || !functionCall.arguments) {
    throw new Error('APIからの応答が不正です')
  }

  const response = JSON.parse(functionCall.arguments) as { speech: string }
  return {
    characterName: selectedCharacter.name,
    speech: response.speech
  }
}