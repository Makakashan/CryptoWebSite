import { useEffect, useRef } from "react";
import { useAppDispatch } from "../store/hooks";
import { binanceWebSocketService } from "../services/binanceWebSocket";
import { updateAssetPrice } from "../store/slices/assetsSlice";
import type { UseBinanceWebSocketProps } from "../store/types";

export const useBinanceWebSocket = ({
	symbols,
	enabled = true,
}: UseBinanceWebSocketProps) => {
	const dispatch = useAppDispatch();
	const prevSymbolsRef = useRef<string>("");
	const symbolsKey = [...symbols].sort().join(",");

	useEffect(() => {
		if (!enabled || symbolsKey.length === 0) {
			binanceWebSocketService.updateSymbols([]);
			return;
		}
		const normalizedSymbols = symbolsKey.split(",");

		// Only update WebSocket if symbols actually changed
		if (prevSymbolsRef.current === symbolsKey) {
			return;
		}

		prevSymbolsRef.current = symbolsKey;

		// Subscribe to price updates
		const handlePriceUpdate = (symbol: string, price: number) => {
			dispatch(updateAssetPrice({ symbol, price }));
		};

		binanceWebSocketService.subscribe(handlePriceUpdate);

		// Connect to WebSocket with current symbols
		binanceWebSocketService.updateSymbols(normalizedSymbols);

		return () => {
			binanceWebSocketService.unsubscribe(handlePriceUpdate);
			binanceWebSocketService.updateSymbols([]);
		};
	}, [symbolsKey, enabled, dispatch]);

	return {
		disconnect: () => binanceWebSocketService.disconnect(),
		getPrice: (symbol: string) => binanceWebSocketService.getPrice(symbol),
		getAllPrices: () => binanceWebSocketService.getAllPrices(),
	};
};
