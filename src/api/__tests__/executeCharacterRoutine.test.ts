import { describe, it, expect } from 'vitest'
import { OpenAI } from 'openai'
import seedrandom from 'seedrandom'
import { executeCharacterRoutine } from '../executeCharacterRoutine'
import type { RoutineResult } from '../../shared'
import { commonPrompt, characters, sampleHistory } from './fixtures/characterFixtures'
import { applyTestHooks } from '../../libs/msw-cache/vitest'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const seeds = [
  'test-seed-1',
  'test-seed-2',
  'test-seed-3'
] as const

describe('executeCharacterRoutine', () => {
  applyTestHooks();

  describe.each(seeds)('シード値: %s', (seed) => {
    const rng = seedrandom(seed)

    it('探偵たちの思考と発言が生成される', async () => {
      const history: RoutineResult[] = []
      
      const result = await executeCharacterRoutine(
        openai,
        commonPrompt,
        characters,
        history,
        rng
      )

      // スナップショットでの検証
      expect(result).toMatchSnapshot()
    })

    it('会話履歴を考慮して思考と発言が生成される', async () => {
      const result = await executeCharacterRoutine(
        openai,
        commonPrompt,
        characters,
        sampleHistory,
        rng
      )

      // スナップショットでの検証
      expect(result).toMatchSnapshot()
    })
  })
})