import { useState, useEffect } from "react";
import { iconLoaderService } from "../services/iconLoader";

interface UseIconLoaderOptions {
	symbol: string;
	initialImageUrl: string | null;
	enabled?: boolean;
}

export const useIconLoader = ({ symbol, initialImageUrl, enabled = true }: UseIconLoaderOptions) => {
	const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);

	useEffect(() => {
		if (!enabled || initialImageUrl) return;
		const load = async () => {
			const url = await iconLoaderService.loadIcon(symbol);
			if (url) setImageUrl(url);
		};
		load();
	}, [symbol, initialImageUrl, enabled]);

	return { imageUrl };
};
