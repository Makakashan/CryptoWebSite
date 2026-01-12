// User & Auth
export interface User {
  id: number;
  username: string;
  balance: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user?: User;
}

// Assets
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

// Orders
export interface Order {
  id: number;
  user_id: number;
  asset_symbol: string;
  order_type: "BUY" | "SELL";
  amount: number;
  price_at_transaction: number;
  timestamp: string;
  status?: string;
}

export interface PlaceOrderRequest {
  asset_symbol: string;
  order_type: "BUY" | "SELL";
  amount: number;
}

// Portfolio
export interface PortfolioAsset {
  asset_symbol: string;
  name?: string;
  amount: number;
  currentPrice?: number;
  value?: number;
  image_url?: string;
  category?: string;
  symbol?: string;
}

export interface Portfolio {
  id: number;
  username: string;
  balance: number;
  assets: PortfolioAsset[];
}

// Stats
export interface UserStats {
  orders: {
    total: number;
    buyOrders: number;
    sellOrders: number;
    totalSpent: number;
    totalEarned: number;
  };
  portfolio: {
    assets: PortfolioAsset[];
    totalValue: number;
    totalAssets: number;
    assetsCount?: number;
  };
  performance: {
    profitLoss: number;
    profitPercentage: number;
  };
}

// ApiResponse
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AssetsResponse {
  data: Asset[];
  pagination?: PaginationInfo;
  sortBy?: string;
  sortOrder?: string;
}

export interface PortfolioResponse {
  id: number;
  username: string;
  balance: number;
  assets: PortfolioAsset[];
}

// Redux State Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AssetsState {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
  filters: AssetsFilters;
  pagination: PaginationInfo | null;
}

export interface PortfolioState {
  portfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
}

export interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}
