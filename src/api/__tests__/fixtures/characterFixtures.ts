import type { Character, RoutineResult } from '../../../shared'

export const commonPrompt = `
探偵たちが密室で起きた殺人事件の真相を探っています。
被害者は密室で発見され、凶器は見つかっていません。
探偵たちはそれぞれ重要な情報を持っていますが、全てを共有したくない理由も抱えています。
`.trim()

export const characters: Character[] = [
  {
    name: '新田探偵',
    description: 'ベテラン探偵。冷静な判断力と鋭い洞察力を持つ。',
    hiddenPrompt: '実は被害者の遺産を狙っている。被害者から遺産相続の約束を取り付けていた。'
  },
  {
    name: '山下探偵',
    description: '新人探偵。熱心だが経験不足。',
    hiddenPrompt: '被害者の親族から依頼を受けて、新田探偵を監視している。'
  }
]

export const sampleHistory: RoutineResult[] = [{
  thoughts: [
    {
      characterName: '新田探偵',
      thought: '山下が何か隠しているようだ。もう少し様子を見よう。',
      urgency: 1
    },
    {
      characterName: '山下探偵',
      thought: '新田探偵の行動が怪しい。もっと証拠を集めないと。',
      urgency: 2
    }
  ],
  speech: {
    characterName: '山下探偵',
    speech: '新田さん、被害者の関係者から何か聞いていませんか？'
  }
}]