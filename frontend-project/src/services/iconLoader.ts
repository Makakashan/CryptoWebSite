import { CACHE_KEYS, API_DELAYS, BATCH_SIZES } from "../constants";
import api from "../api/axiosConfig";
import type { CachedIcon } from "../store/types";

const CACHE_EXPIRY_DAYS = 30;
const MISS_CACHE_EXPIRY_DAYS = 7;

class IconLoaderService {
	private pendingRequests: Map<string, Promise<string | null>> = new Map();

	async getIconUrl(symbol: string): Promise<string | null> {
		const baseAsset = symbol.replace(/USDT$/, "").toUpperCase();

		const cached = this.getFromCache(baseAsset);
		if (cached !== undefined) {
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
			const response = await api.get<{ imageUrl: string | null }>(
				`/assets/icon/${encodeURIComponent(baseAsset)}`,
			);
			const url = response.data.imageUrl || null;
			this.saveToCache(baseAsset, url);
			return url;
		} catch {
			return null;
		}
	}

	private getFromCache(baseAsset: string): string | null | undefined {
		try {
			const cacheKey = `${CACHE_KEYS.CRYPTO_ICON_PREFIX}${baseAsset}`;
			const cached = localStorage.getItem(cacheKey);

			if (!cached) {
				return undefined;
			}

			const data: CachedIcon = JSON.parse(cached);
			const now = Date.now();
			const expiryDays = data.url ? CACHE_EXPIRY_DAYS : MISS_CACHE_EXPIRY_DAYS;
			const expiryTime = expiryDays * 24 * 60 * 60 * 1000;

			if (now - data.timestamp < expiryTime) {
				return data.url;
			}

			localStorage.removeItem(cacheKey);
			return undefined;
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error(`Error reading cache for ${baseAsset}:`, error);
			}
			return undefined;
		}
	}

	private saveToCache(baseAsset: string, url: string | null): void {
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
				await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
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
