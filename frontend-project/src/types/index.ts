export interface User {
  id: number;
  username: string;
  balance: number;
}

export interface AssetsFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface Asset {
  symbol: string;
  name: string;
  image_url: string | null;
  category: string;
  description: string | null;
  is_active: boolean;
  current_price?: number;
  price?: number;
  price_change_24h?: number;
}

export interface Order {
  id: number;
  user_id: number;
  asset_symbol: string;
  order_type: "BUY" | "SELL";
  amount: number;
  price_at_transaction: number;
  timestamp: string;
}

export interface PortfolioAsset {
  asset_symbol: string;
  name?: string;
  amount: number;
  currentPrice?: number;
  value?: number;
  image_url?: string;
  category?: string;
}

export interface PortfolioResponse {
  username: string;
  balance: number;
  assets: PortfolioAsset[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface AssetsResponse {
  data: Asset[];
  pagination?: PaginationInfo;
  sortBy?: string;
  sortOrder?: string;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
