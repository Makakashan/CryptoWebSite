import { CACHE_KEYS, API_DELAYS, BATCH_SIZES } from "../constants";

const CRYPTOCOMPARE_BASE_URL = "https://www.cryptocompare.com";
const CACHE_EXPIRY_DAYS = 30;

interface CachedIcon {
  url: string;
  timestamp: number;
}

class IconLoaderService {
  private pendingRequests: Map<string, Promise<string | null>> = new Map();

  async getIconUrl(symbol: string): Promise<string | null> {
    const baseAsset = symbol.replace(/USDT$/, "").toUpperCase();

    const cached = this.getFromCache(baseAsset);
    if (cached) {
      return cached;
    }

    const pending = this.pendingRequests.get(baseAsset);
    if (pending) {
      return pending;
    }

    const request = this.fetchIconUrl(baseAsset);
    this.pendingRequests.set(baseAsset, request);

    try {
      const url = await request;
      return url;
    } finally {
      this.pendingRequests.delete(baseAsset);
    }
  }

  private async fetchIconUrl(baseAsset: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/coin/generalinfo?fsyms=${baseAsset}&tsym=USD`,
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.Data && data.Data.length > 0) {
        const coinInfo = data.Data[0].CoinInfo;
        if (coinInfo.ImageUrl) {
          const fullUrl = `${CRYPTOCOMPARE_BASE_URL}${coinInfo.ImageUrl}`;
          this.saveToCache(baseAsset, fullUrl);
          return fullUrl;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error fetching icon for ${baseAsset}:`, error);
      return null;
    }
  }

  private getFromCache(baseAsset: string): string | null {
    try {
      const cacheKey = `${CACHE_KEYS.CRYPTO_ICON_PREFIX}${baseAsset}`;
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const data: CachedIcon = JSON.parse(cached);
      const now = Date.now();
      const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      if (now - data.timestamp < expiryTime) {
        return data.url;
      }

      localStorage.removeItem(cacheKey);
      return null;
    } catch (error) {
      console.error(`Error reading cache for ${baseAsset}:`, error);
      return null;
    }
  }

  private saveToCache(baseAsset: string, url: string): void {
    try {
      const cacheKey = `${CACHE_KEYS.CRYPTO_ICON_PREFIX}${baseAsset}`;
      const data: CachedIcon = {
        url,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {
      // Ignore cache errors
    }
  }

  async preloadIcons(symbols: string[]): Promise<void> {
    const BATCH_SIZE = BATCH_SIZES.ICON_PRELOAD;
    const DELAY_BETWEEN_BATCHES = API_DELAYS.ICON_BATCH_DELAY;

    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(batch.map((symbol) => this.getIconUrl(symbol)));

      if (i + BATCH_SIZE < symbols.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_BATCHES),
        );
      }
    }
  }

  clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_KEYS.CRYPTO_ICON_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Ignore errors
    }
  }
}

export const iconLoaderService = new IconLoaderService();
