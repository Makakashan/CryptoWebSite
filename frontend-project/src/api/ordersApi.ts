import axiosInstance from "./axiosConfig";
import type { Order, PlaceOrderRequest, PaginationInfo } from "../store/types";

interface OrdersFilters {
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

interface OrdersResponse {
  data: Order[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sorting?: {
    sortBy: string;
    sortOrder: string;
  };
}

export const ordersApi = {
  getOrders: async (
    filters?: OrdersFilters,
  ): Promise<{ data: Order[]; pagination?: PaginationInfo }> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await axiosInstance.get<OrdersResponse>(
      `/orders/history?${params.toString()}`,
    );

    // Handle both paginated response and direct array
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return {
        data: response.data.data || [],
        pagination: response.data.pagination,
      };
    }

    // Fallback for direct array response
    return {
      data: Array.isArray(response.data) ? response.data : [],
      pagination: undefined,
    };
  },

  getOrderById: async (id: number): Promise<Order> => {
    const response = await axiosInstance.get<{ order: Order }>(`/orders/${id}`);
    return response.data.order;
  },

  placeOrder: async (orderData: PlaceOrderRequest): Promise<Order> => {
    const response = await axiosInstance.post<{
      message: string;
      asset: string;
      price: number;
      total: number;
    }>("/orders/place", orderData);

    // Backend doesn't return full order object, so we construct one
    return {
      id: Date.now(), // Temporary ID
      user_id: 0, // Will be filled by backend
      asset_symbol: response.data.asset,
      order_type: orderData.order_type,
      amount: orderData.amount,
      price_at_transaction: response.data.price,
      timestamp: new Date().toISOString(),
    };
  },

  cancelOrder: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/orders/${id}`);
  },
};
