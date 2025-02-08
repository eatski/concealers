import { describe, it, expect } from 'vitest'
import { OpenAI } from 'openai'
import seedrandom from 'seedrandom'
import { executeCharacterRoutine } from '../executeCharacterRoutine'
import { commonPrompt, characters } from './fixtures/characterFixtures'
import { applyTestHooks } from '../../libs/msw-cache/vitest'
import { type RoutineResult } from '../../shared'

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

    it(
      '10回の会話が繰り返される',
      { timeout: 1800000 }, // 30分 = 30 * 60 * 1000
      async () => {
        const history: RoutineResult[] = []
        const iterations = 8
        
        for (let i = 0; i < iterations; i++) {
          const result = await executeCharacterRoutine(
            openai,
            commonPrompt,
            characters,
            history,
            rng
          )
          
          history.push(result)
        }
        
        expect(history.map(item => item.speech)).toMatchSnapshot('complete history')
      },
    )
  })
})