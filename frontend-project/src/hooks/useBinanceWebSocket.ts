import { useEffect, useRef } from "react";
import { binanceWebSocketService } from "../services/binanceWebSocket";

interface UseBinanceWebSocketOptions {
	symbols: string[];
	enabled?: boolean;
}

export const useBinanceWebSocket = ({ symbols, enabled = true }: UseBinanceWebSocketOptions) => {
	const sourceIdRef = useRef(`ws-${Math.random().toString(36).slice(2)}`);

	useEffect(() => {
		if (!enabled || symbols.length === 0) {
			binanceWebSocketService.clearSymbols(sourceIdRef.current);
			return;
		}
		binanceWebSocketService.updateSymbols(symbols, sourceIdRef.current);
		return () => {
			binanceWebSocketService.clearSymbols(sourceIdRef.current);
		};
	}, [symbols, enabled]);
};
