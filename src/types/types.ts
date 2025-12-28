import { Request } from "express";
import { Database } from "sqlite";
import sqlite3 from "sqlite3";

export interface User {
  id: number;
  username: string;
  password: string;
  balance: number;
}

export interface PortfolioAsset {
  id: number;
  user_id: number;
  asset_symbol: string;
  amount: number;
}

export interface Order {
  id: number;
  user_id: number;
  asset_symbol: string;
  order_type: "BUY" | "SELL";
  amount: number;
  price_at_transaction: number;
  timestamp: Date;
}

export interface OrderWithTotal extends Order {
  total: number;
}

export interface Asset {
  id: number;
  symbol: string;
  name: string;
  image_url: string | null;
  category: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface AssetWithPrice extends Asset {
  price: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sort: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
}

export interface AssetFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface OrderFilters {
  assetSymbol?: string;
  orderType?: "BUY" | "SELL";
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface UserFilters {
  search?: string;
  minBalance?: number;
  maxBalance?: number;
}

export interface BinanceTicker {
  symbol: string;
  price: string;
  quoteVolume: string;
  priceChange: string;
  priceChangePercent: string;
  volume: string;
}

export interface BinancePriceResponse {
  symbol: string;
  price: string;
}

export interface CoinGeckoListItem {
  id: string;
  symbol: string;
  name: string;
}

export interface CoinGeckoImage {
  thumb?: string;
  small?: string;
  large?: string;
}

export interface CoinGeckoDescription {
  en?: string;
  [key: string]: string | undefined;
}

export interface CoinGeckoDetail {
  id: string;
  symbol: string;
  name: string;
  image?: CoinGeckoImage;
  description?: CoinGeckoDescription;
  categories?: string[];
  market_cap_rank?: number;
  market_data?: any;
}

export interface JWTPayload {
  id: number;
  username: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface PriceMap {
  [symbol: string]: number;
}

export interface PairMap {
  [binanceSymbol: string]: string;
}

export type PriceUpdateCallback = (symbol: string, price: number) => void;

export type DB = Database<sqlite3.Database, sqlite3.Statement>;
