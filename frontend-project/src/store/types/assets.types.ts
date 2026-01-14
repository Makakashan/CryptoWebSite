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

export interface AssetsState {
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
  filters: AssetsFilters;
  pagination: PaginationInfo | null;
}
