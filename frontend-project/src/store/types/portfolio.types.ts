// Portfolio Domain Types
export type SortKey = "symbol" | "amount" | "value" | "pnl";

export type SortOrder = "asc" | "desc";

export interface PortfolioAsset {
	asset_symbol: string;
	amount: number;
	name?: string;
	currentPrice?: number;
	image_url?: string;
}

export interface Portfolio {
	id: number;
	username: string;
	balance: number;
	avatar?: string | null;
	assets: PortfolioAsset[];
}

export interface PortfolioState {
	portfolio: Portfolio | null;
	isLoading: boolean;
	error: string | null;
}

export type AssetPnl = {
	invested: number;
	realized: number;
	currentAmount: number;
	netProfit: number;
	netProfitPercent: number;
};
