import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

/**
 * ファイルシステムベースのキャッシュを提供するクラス。
 * データはJSON形式で保存され、キーはMD5ハッシュ化されます。
 * 
 * @example
 * ```typescript
 * const cache = new FileSystemCache('./cache')
 * 
 * // データの保存
 * await cache.set('my-key', { data: 'キャッシュするデータ' })
 * 
 * // データの取得
 * const data = await cache.get<{ data: string }>('my-key')
 * ```
 */
export class FileSystemCache {
  private cacheDir: string

  /**
   * FileSystemCacheのインスタンスを作成します。
   * 指定されたディレクトリが存在しない場合は自動的に作成されます。
   * 
   * @param options - キャッシュの設定オプション
   */
  constructor(options: string | { basePath: string }) {
    this.cacheDir = typeof options === 'string' ? options : options.basePath
    this.ensureCacheDirectory()
  }

  /**
   * キャッシュディレクトリの存在を確認し、存在しない場合は作成します。
   * @private
   */
  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  /**
   * キャッシュキーからファイルパスを生成します。
   * キーはMD5ハッシュ化され、ファイルシステムで安全なパスとなります。
   * 
   * @param key - キャッシュキー
   * @returns ハッシュ化されたファイルパス
   */
  public getPath(key: string): string {
    const hash = crypto.createHash('md5').update(key).digest('hex')
    return path.join(this.cacheDir, hash)
  }

  /**
   * キャッシュディレクトリ内の全ファイル情報を取得します。
   * 
   * @returns キャッシュファイルの情報
   */
  public async load(): Promise<{ files: Array<{ path: string }> }> {
    const files = await fs.promises.readdir(this.cacheDir)
    return {
      files: files.map(file => ({
        path: path.join(this.cacheDir, file)
      }))
    }
  }

  /**
   * キャッシュにデータを保存します。
   * データはJSON形式で保存されます。
   * 
   * @param key - キャッシュキー
   * @param value - 保存するデータ（JSON.stringifyで変換可能なデータ）
   * @throws JSON.stringifyでエラーが発生した場合
   */
  async set(key: string, value: unknown): Promise<void> {
    const filePath = this.getPath(key)
    const data = JSON.stringify(value)
    await fs.promises.writeFile(filePath, data, 'utf-8')
  }

  /**
   * キャッシュからデータを取得します。
   * 
   * @template T - 取得するデータの型
   * @param key - キャッシュキー
   * @returns キャッシュされたデータ、存在しない場合はnull
   * @throws JSON.parseでエラーが発生した場合
   */
  async get<T>(key: string): Promise<T | null> {
    const filePath = this.getPath(key)
    
    try {
      const data = await fs.promises.readFile(filePath, 'utf-8')
      return JSON.parse(data) as T
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null
      }
      throw error
    }
  }

  /**
   * キャッシュの存在を確認します。
   * 
   * @param key - キャッシュキー
   * @returns キャッシュが存在する場合はtrue、存在しない場合はfalse
   */
  async has(key: string): Promise<boolean> {
    const filePath = this.getPath(key)
    try {
      await fs.promises.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * キャッシュを削除します。
   * 
   * @param key - キャッシュキー
   * @returns 削除に成功した場合はtrue、キャッシュが存在しない場合はfalse
   * @throws ファイル削除時にエラーが発生した場合（ENOENT以外）
   */
  async delete(key: string): Promise<boolean> {
    const filePath = this.getPath(key)
    try {
      await fs.promises.unlink(filePath)
      return true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false
      }
      throw error
    }
  }

  /**
   * 全てのキャッシュを削除します。
   * キャッシュディレクトリ内の全てのファイルが削除されます。
   * 
   * @throws ファイル削除時にエラーが発生した場合
   */
  async clear(): Promise<void> {
    const files = await fs.promises.readdir(this.cacheDir)
    await Promise.all(
      files.map(file => fs.promises.unlink(path.join(this.cacheDir, file)))
    )
  }
}