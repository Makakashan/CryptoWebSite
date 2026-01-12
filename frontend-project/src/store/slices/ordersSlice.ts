import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { ordersApi } from "../../api/ordersApi";
import type { Order, PlaceOrderRequest, OrdersState } from "../types";

const initialState: OrdersState = {
  orders: [],
  isLoading: false,
  error: null,
};

export const fetchOrders = createAsyncThunk<
  Order[],
  void,
  { rejectValue: string }
>("orders/fetch", async (_, { rejectWithValue }) => {
  try {
    const response = await ordersApi.getOrders();
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders",
      );
    }
    return rejectWithValue("Failed to fetch orders");
  }
});

export const placeOrder = createAsyncThunk<
  Order,
  PlaceOrderRequest,
  { rejectValue: string }
>("orders/place", async (orderData, { rejectWithValue }) => {
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

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearOrders: (state) => {
      state.orders = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch orders";
      })
      .addCase(placeOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.unshift(action.payload);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to place order";
      });
  },
});

export const { clearOrders } = ordersSlice.actions;
export default ordersSlice.reducer;
