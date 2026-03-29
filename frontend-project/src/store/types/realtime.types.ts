export interface PriceUpdatePayload {
	symbol: string;
	price: number;
}

export type WebSocketPriceUpdateCallback = (data: PriceUpdatePayload) => void;

export type BinancePriceUpdateCallback = (symbol: string, price: number) => void;
