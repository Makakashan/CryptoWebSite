import { useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import { binanceWebSocketService } from "../services/binanceWebSocket";
import { updateAssetPrice } from "../store/slices/assetsSlice";

interface UseBinanceWebSocketProps {
  symbols: string[];
  enabled?: boolean;
}

export const useBinanceWebSocket = ({
  symbols,
  enabled = true,
}: UseBinanceWebSocketProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      return;
    }

    // Subscribe to price updates
    const handlePriceUpdate = (symbol: string, price: number) => {
      dispatch(updateAssetPrice({ symbol, price }));
    };

    binanceWebSocketService.subscribe(handlePriceUpdate);

    // Connect to WebSocket with current symbols
    binanceWebSocketService.updateSymbols(symbols);

    return () => {
      binanceWebSocketService.unsubscribe(handlePriceUpdate);
    };
  }, [symbols, enabled, dispatch]);

  return {
    disconnect: () => binanceWebSocketService.disconnect(),
    getPrice: (symbol: string) => binanceWebSocketService.getPrice(symbol),
    getAllPrices: () => binanceWebSocketService.getAllPrices(),
  };
};
