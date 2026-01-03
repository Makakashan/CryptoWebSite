import axiosInstance from "./axiosConfig";
import type {
  Order,
  PlaceOrderRequest,
  ApiResponse,
  PaginationInfo,
} from "../types";

export const ordersApi = {
  getOrders: async (filters?: {
    type?: "BUY" | "SELL";
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Order[]; pagination?: PaginationInfo }> => {
    const response = await axiosInstance.get<ApiResponse<Order[]>>("/orders", {
      params: filters,
    });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getOrderById: async (id: number): Promise<Order> => {
    const response = await axiosInstance.get<ApiResponse<Order>>(
      `/orders/${id}`,
    );
    return response.data.data;
  },

  placeOrder: async (orderData: PlaceOrderRequest): Promise<Order> => {
    const response = await axiosInstance.post<ApiResponse<Order>>(
      "/orders/place",
      orderData,
    );
    return response.data.data;
  },

  cancelOrder: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/orders/${id}`);
  },
};
