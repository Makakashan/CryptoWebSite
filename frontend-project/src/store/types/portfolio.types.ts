// Portfolio Domain Types

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
  assets: PortfolioAsset[];
}

export interface PortfolioState {
  portfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
}
