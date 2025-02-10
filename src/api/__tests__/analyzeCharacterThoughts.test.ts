import { describe, it, expect } from 'vitest'
import { OpenAI } from 'openai'
import { createCharacterThoughts } from '../analyzeCharacterThoughts'
import { applyTestHooks } from '../../libs/msw-cache/vitest'
import { type Character, type RoutineResult } from '../../shared'

const commonPrompt = `
## 概要
あなたたちは探偵事務所のメンバーです。
最近、街で連続強盗事件が発生しており、その捜査を依頼されました。
事件の真相を探るため、それぞれが持つ情報を共有し合う必要があります。

## 基本ルール
- 各自が持つ情報は慎重に扱う必要があります
- 相手の反応を見ながら、適切なタイミングで情報を開示してください
- 他のメンバーの発言から、真相のヒントを見つけ出してください
`.trim()

const characters: Character[] = [
  {
    name: '佐藤刑事',
    description: 'ベテラン刑事。冷静な判断力と鋭い洞察力を持つ。',
    hiddenPrompt: '実は犯人の手口から、これが内部犯行である可能性が高いと気づいている。'
  },
  {
    name: '山田探偵',
    description: '新進気鋭の私立探偵。独自の情報網を持つ。',
    hiddenPrompt: '犯行現場付近で不審な警備員の姿を目撃している。'
  }
]

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

describe('createCharacterThoughts', () => {
  applyTestHooks()

  it('履歴がない状態でのキャラクターの思考を生成できる', async () => {
    const currentCharacter = characters[0]
    const history: RoutineResult[] = []

    const result = await createCharacterThoughts({
      openai,
      commonPrompt,
      currentCharacter,
      allCharacters: characters,
      history,
      relevantMemories: []
    })

    expect(result).toMatchSnapshot()
  })

  it('履歴が3件ある状態でのキャラクターの思考を生成できる', async () => {
    const currentCharacter = characters[0]
    const history: RoutineResult[] = [
      {
        characterMemories: [{
          characterName: characters[1].name,
          memories: []
        }],
        speech: {
          characterName: characters[1].name,
          speech: '現場周辺の警備体制に不審な点がありました。'
        }
      },
      {
        characterMemories: [{
          characterName: characters[1].name,
          memories: []
        }],
        speech: {
          characterName: characters[1].name,
          speech: '特に夜間の警備に空白の時間帯があったようです。'
        }
      },
      {
        characterMemories: [{
          characterName: characters[1].name,
          memories: []
        }],
        speech: {
          characterName: characters[1].name,
          speech: 'その時間帯に不審な人物の出入りがあったという目撃情報もあります。'
        }
      }
    ]

    const result = await createCharacterThoughts({
      openai,
      commonPrompt,
      currentCharacter,
      allCharacters: characters,
      history,
      relevantMemories: []
    })

    expect(result).toMatchSnapshot()
  })
})