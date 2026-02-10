// Assets Domain Types

import type { PaginationInfo } from "./common.types";

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

export interface CreateAssetDto {
  symbol: string;
  name: string;
  image_url?: string | null;
  category?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateAssetDto {
  name?: string;
  image_url?: string | null;
  category?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface AssetsState {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
  filters: AssetsFilters;
  pagination: PaginationInfo | null;
  chartData: Record<string, number[]>;
}

export interface AssetsResponse {
  data: Asset[];
  pagination?: PaginationInfo;
  sortBy?: string;
  sortOrder?: string;
}

export interface ChartDataResponse {
  data: Record<string, number[]>;
  interval: string;
  limit: number;
}
