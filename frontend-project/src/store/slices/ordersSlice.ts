import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { ordersApi } from "../../api/ordersApi";
import type { Order, PlaceOrderRequest, PaginationInfo } from "../../types";

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    type?: "BUY" | "SELL";
    status?: string;
    page?: number;
    limit?: number;
  };
  pagination: PaginationInfo | null;
}

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    limit: 20,
  },
  pagination: null,
};

export const fetchOrders = createAsyncThunk<
  { data: Order[]; pagination?: PaginationInfo },
  void,
  { rejectValue: string }
>("orders/fetchOrders", async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState() as { orders: OrdersState };
    const response = await ordersApi.getOrders(state.orders.filters);
    return response;
  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders",
      );
    }
    return rejectWithValue("Failed to fetch orders");
  }
});

export const fetchOrderById = createAsyncThunk<
  Order,
  number,
  { rejectValue: string }
>("orders/fetchOrderById", async (orderId, { rejectWithValue }) => {
  try {
    const response = await ordersApi.getOrderById(orderId);
    return response;
  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order",
      );
    }
    return rejectWithValue("Failed to fetch order");
  }
});

export const placeOrder = createAsyncThunk<
  Order,
  PlaceOrderRequest,
  { rejectValue: string }
>("orders/placeOrder", async (orderData, { rejectWithValue }) => {
  try {
    const response = await ordersApi.placeOrder(orderData);
    return response;
  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to place order",
      );
    }
    return rejectWithValue("Failed to place order");
  }
});

export const cancelOrder = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("orders/cancelOrder", async (orderId, { rejectWithValue }) => {
  try {
    await ordersApi.cancelOrder(orderId);
    return orderId;
  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel order",
      );
    }
    return rejectWithValue("Failed to cancel order");
  }
});

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setFilters: (
      state,
      action: PayloadAction<Partial<OrdersState["filters"]>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data;
        state.pagination = action.payload.pagination || null;
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch orders";
      })
      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch order";
      })
      // Place order
      .addCase(placeOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add new order to the beginning of the list
        state.orders.unshift(action.payload);
        state.error = null;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to place order";
      })
      // Cancel order
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update order status in the list
        const orderIndex = state.orders.findIndex(
          (order) => order.id === action.payload,
        );
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = "CANCELLED";
        }
        state.error = null;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to cancel order";
      });
  },
});

export const { setFilters, clearFilters, clearCurrentOrder, clearError } =
  ordersSlice.actions;
export default ordersSlice.reducer;
