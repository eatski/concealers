import { describe, test, expect, afterEach, beforeEach } from 'vitest'
import { FileSystemCache } from './index'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('FileSystemCache', () => {
  const tempDir = path.join(os.tmpdir(), 'fs-cache-test-' + Math.random().toString(36).slice(2))
  const cache = new FileSystemCache(tempDir)
  const cache2 = new FileSystemCache(tempDir)

  beforeEach(async () => {
    await fs.promises.mkdir(tempDir, { recursive: true })
  })

  afterEach(async () => {
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true })
    }
  })

  test('キャッシュの書き込みと読み込み', async () => {
    const testData = { message: 'こんにちは世界' }
    // 1つ目のインスタンスで書き込み
    await cache.set('test-key', testData)
    // 2つ目のインスタンスで読み込み
    const result = await cache2.get<typeof testData>('test-key')
    expect(result).toEqual(testData)
  })

  test('存在しないキーの読み込み', async () => {
    const result = await cache.get('non-existent-key')
    expect(result).toBeNull()
  })

  test('キャッシュの存在確認', async () => {
    // 1つ目のインスタンスで書き込み
    await cache.set('test-key', 'テストデータ')
    // 2つ目のインスタンスで読み込み
    expect(await cache2.has('test-key')).toBe(true)
    expect(await cache2.has('non-existent-key')).toBe(false)
  })

  test('キャッシュの削除', async () => {
    // 1つ目のインスタンスで書き込み
    await cache.set('test-key', 'テストデータ')
    expect(await cache2.has('test-key')).toBe(true)
    
    // 2つ目のインスタンスで削除
    const deleteResult = await cache2.delete('test-key')
    expect(deleteResult).toBe(true)
    // 1つ目のインスタンスでも削除されていることを確認
    expect(await cache.has('test-key')).toBe(false)
  })

  test('存在しないキャッシュの削除', async () => {
    const deleteResult = await cache.delete('non-existent-key')
    expect(deleteResult).toBe(false)
  })

  test('キャッシュのクリア', async () => {
    // 1つ目のインスタンスでデータを設定
    await cache.set('key1', 'データ1')
    await cache.set('key2', 'データ2')
    
    // 2つ目のインスタンスでクリア
    await cache2.clear()
    
    // 1つ目のインスタンスでも削除されていることを確認
    expect(await cache.has('key1')).toBe(false)
    expect(await cache.has('key2')).toBe(false)
  })

  test('複雑なゲームセッションデータの保存と読み込み', async () => {
    const { gameSessionData } = await import('./__fixtures__/gameSessionFixture')
    
    await cache.set('game-session', gameSessionData)
    const result = await cache.get<typeof gameSessionData>('game-session')
    expect(result).toEqual(gameSessionData)
  })
})