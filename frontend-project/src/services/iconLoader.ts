class IconLoaderService {
	private cache: Map<string, string> = new Map();
	private loading: Map<string, Promise<string | null>> = new Map();

	async loadIcon(symbol: string): Promise<string | null> {
		const cached = this.cache.get(symbol);
		if (cached) return cached;
		const loading = this.loading.get(symbol);
		if (loading) return loading;

		const promise = this.fetchIcon(symbol);
		this.loading.set(symbol, promise);
		const result = await promise;
		this.loading.delete(symbol);
		return result;
	}

	private async fetchIcon(symbol: string): Promise<string | null> {
		try {
			const short = symbol.replace("USDT", "").toLowerCase();
			const response = await fetch(`https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/${short}`);
			if (!response.ok) return null;
			const data = await response.json();
			const imageUrl = data?.image?.small || data?.image?.thumb;
			if (imageUrl) {
				this.cache.set(symbol, imageUrl);
				return imageUrl;
			}
			return null;
		} catch {
			return null;
		}
	}

	async preloadIcons(symbols: string[]) {
		await Promise.all(symbols.map((s) => this.loadIcon(s)));
	}
}

export const iconLoaderService = new IconLoaderService();
