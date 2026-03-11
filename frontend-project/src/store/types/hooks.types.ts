export interface UseBinanceWebSocketProps {
	symbols: string[];
	enabled?: boolean;
}

export interface UseIconLoaderProps {
	symbol: string;
	initialImageUrl: string | null;
	enabled?: boolean;
}

export interface UseIconLoaderResult {
	imageUrl: string | null;
	isLoading: boolean;
}
