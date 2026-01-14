// Orders Domain Types

import type { PaginationInfo } from "./common.types";

export interface Order {
  id: number;
  user_id: number;
  asset_symbol: string;
  order_type: "BUY" | "SELL";
  amount: number;
  price_at_transaction: number;
  timestamp: string;
}

export interface PlaceOrderRequest {
  asset_symbol: string;
  order_type: "BUY" | "SELL";
  amount: number;
}

export interface OrdersFilters {
  asset_symbol?: string;
  order_type?: "BUY" | "SELL";
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  filters: OrdersFilters;
  pagination: PaginationInfo | null;
}
