import { unlink } from "node:fs/promises";
import {
  http,
  type DefaultBodyType,
  HttpResponse,
  type StrictRequest,
  bypass,
} from "msw";
import { setupServer } from "msw/node";
import { FileSystemCache } from "../file-system-cache";

interface CacheData {
  request: Record<string, unknown>;
  response: unknown;
}

class ResponseCache {
  private readonly usedCachePath = new Set<string>();
  constructor(private readonly cache: FileSystemCache) {}

  private static async configToRequestRecord(
    config: StrictRequest<DefaultBodyType>,
  ): Promise<Record<string, unknown>> {
    return {
      url: config.url,
      body: await config.text(),
      method: config.method,
    };
  }

  public async get(
    configForKey: StrictRequest<DefaultBodyType>,
  ): Promise<unknown> {
    const record = await ResponseCache.configToRequestRecord(configForKey);
    const key = JSON.stringify(record);
    this.usedCachePath.add(this.cache.getPath(key));
    const cached = await this.cache.get<CacheData>(key);
    return cached?.response;
  }

  public async set(
    configForKey: StrictRequest<DefaultBodyType>,
    value: unknown,
  ) {
    const record = await ResponseCache.configToRequestRecord(configForKey);
    const key = JSON.stringify(record);
    this.usedCachePath.add(this.cache.getPath(key));
    await this.cache.set(key, {
      request: record,
      response: value,
    });
  }

  public async clearUnusedCache() {
    const caches = await this.cache.load();
    const pathes = caches.files
      .map((file) => file.path)
      .filter((path) => !this.usedCachePath.has(path));
    await Promise.all(pathes.map(unlink));
  }
}

export const initMswCacheServer = (basePath: string) => {
  const cache = new ResponseCache(
    new FileSystemCache({
      basePath: basePath,
    }),
  );
  const server = setupServer(
    http.all("*", async ({request}) => {
      const cached = await cache.get(request.clone());
      if (typeof cached === "object") {
        return HttpResponse.json(cached);
      }
      console.log("Cache not hit. ", request.url);
    	const response = await fetch(bypass(request));
      if (response.status === 200) {
        const text = await response.clone().json();
        await cache.set(request, text);
      }
      return HttpResponse.json(await response.json());
    }),
  );
  return {
    listen: () => server.listen(),
    close: () => {
      server.close();
      return cache.clearUnusedCache();
    },
  };
};
