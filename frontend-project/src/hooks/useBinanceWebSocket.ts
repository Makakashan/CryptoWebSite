import { useEffect, useId } from "react";
import { binanceWebSocketService } from "../services/binanceWebSocket";

interface UseBinanceWebSocketOptions {
	symbols: string[];
	enabled?: boolean;
}

export const useBinanceWebSocket = ({ symbols, enabled = true }: UseBinanceWebSocketOptions) => {
	const reactId = useId();
	const sourceId = `ws-${reactId.replace(/:/g, "")}`;

	useEffect(() => {
		if (!enabled || symbols.length === 0) {
			binanceWebSocketService.clearSymbols(sourceId);
			return;
		}
		binanceWebSocketService.updateSymbols(symbols, sourceId);
		return () => {
			binanceWebSocketService.clearSymbols(sourceId);
		};
	}, [symbols, enabled, sourceId]);
};
