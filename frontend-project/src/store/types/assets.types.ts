export interface Asset {
	symbol: string;
	name: string;
	price?: number;
	current_price?: number;
	price_change_24h?: number;
	image_url: string | null;
	category?: string;
	description?: string | null;
	is_active?: boolean;
	updated_at?: string;
}

export interface CreateAssetDto {
	symbol: string;
	name: string;
	image_url?: string;
	category?: string;
	description?: string | null;
	is_active?: boolean;
}

export type UpdateAssetDto = Partial<CreateAssetDto>;

export interface AssetsFilters {
	search?: string;
	category?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	page?: number;
	limit?: number;
}

export interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface AssetsResponse {
	data: Asset[];
	pagination?: PaginationInfo;
}

export interface ChartDataResponse {
	data: Record<string, number[]>;
}
