import type { Character } from '../../../shared'

export const commonPrompt = `
探偵たちが密室で起きた殺人事件の真相を探っています。
被害者である沢山初子は密室で発見され、凶器は見つかっていません。
探偵たちはそれぞれ重要な情報を持っていますが、全てを共有したくない理由も抱えています。
`.trim()

export const characters: Character[] = [
  {
    name: '新田たける',
    description: 'ベテラン探偵。冷静な判断力と鋭い洞察力を持つ。',
    hiddenPrompt: '実は被害者の遺産を狙っている。被害者から遺産相続の約束を取り付けていた。'
  },
  {
    name: '山下太郎',
    description: '新人探偵。熱心だが経験不足。',
    hiddenPrompt: '被害者の親族から依頼を受けて、新田探偵を監視している。'
  },
  {
    name: "沢山修二",
    description: '第一発見者であり、被害者の夫。妻の死に深く悲しんでいる。探偵を呼んだのは彼だ。',
    hiddenPrompt: '修二は初子を殺害した犯人である。修二は家にある包丁で初子を殺害し、怪しまれないために自ら探偵を呼んだ。'
  },
  {
    name: '田中美智子',
    description: '被害者の親友。初子の死にショックを受けている。',
    hiddenPrompt: "沢山修二と浮気している。"
  }
]