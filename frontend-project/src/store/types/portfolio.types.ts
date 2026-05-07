import type { User } from "./auth.types";

export interface PortfolioAsset {
	asset_symbol: string;
	amount: number;
}

export interface Portfolio {
	balance: number;
	assets: PortfolioAsset[];
}

export interface UserProfile extends User {
	assets: PortfolioAsset[];
}

export interface AssetPnl {
	invested: number;
	realized: number;
	currentAmount: number;
	netProfit: number;
	netProfitPercent: number;
}

export type SortKey = "symbol" | "amount" | "value" | "pnl";
export type SortOrder = "asc" | "desc";
