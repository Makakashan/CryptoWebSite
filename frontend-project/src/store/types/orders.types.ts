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
	use_max?: boolean;
}

export interface OrdersFilters {
	asset_symbol?: string;
	order_type?: "BUY" | "SELL";
	dateFrom?: string;
	dateTo?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	page?: number;
	limit?: number;
}

export interface OrdersResponse {
	data: Order[];
	pagination?: PaginationInfo;
}

export interface PaginationInfo {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}
