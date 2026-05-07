import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ordersApi } from "../../api/ordersApi";
import type { Order, OrdersFilters, PlaceOrderRequest } from "../types";

interface OrdersState {
	orders: Order[];
	isLoading: boolean;
	error: string | null;
	filters: OrdersFilters;
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	} | null;
}

const initialState: OrdersState = {
	orders: [],
	isLoading: false,
	error: null,
	filters: {
		page: 1,
		limit: 20,
		sortBy: "timestamp",
		sortOrder: "desc",
	},
	pagination: null,
};

export const fetchOrders = createAsyncThunk(
	"orders/fetchOrders",
	async (filters: OrdersFilters | undefined, { rejectWithValue }) => {
		try {
			const response = await ordersApi.getOrders(filters);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || "Failed to fetch orders");
		}
	},
);

export const placeOrder = createAsyncThunk(
	"orders/placeOrder",
	async (orderData: PlaceOrderRequest, { rejectWithValue }) => {
		try {
			const response = await ordersApi.placeOrder(orderData);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || "Failed to place order");
		}
	},
);

const ordersSlice = createSlice({
	name: "orders",
	initialState,
	reducers: {
		setOrdersFilters: (state, action) => {
			state.filters = { ...state.filters, ...action.payload };
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
				state.orders = action.payload.data || [];
				state.pagination = action.payload.pagination || null;
			})
			.addCase(fetchOrders.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(placeOrder.fulfilled, (state, action) => {
				state.orders.unshift(action.payload as Order);
			});
	},
});

export const { setOrdersFilters } = ordersSlice.actions;
export default ordersSlice.reducer;
