import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { ordersApi } from "../../api/ordersApi";
import type { Order, OrdersFilters, PlaceOrderRequest, OrdersResponse } from "../types";

interface ApiErrorShape {
	response?: {
		data?: {
			message?: string;
		};
	};
}

const hasApiErrorResponse = (error: unknown): error is ApiErrorShape =>
	typeof error === "object" && error !== null && "response" in error;

const getApiErrorMessage = (error: unknown, fallback: string) =>
	hasApiErrorResponse(error) ? error.response?.data?.message || fallback : fallback;

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

export const fetchOrders = createAsyncThunk<
	OrdersResponse,
	OrdersFilters | undefined,
	{ rejectValue: string }
>("orders/fetchOrders", async (filters, { rejectWithValue }) => {
	try {
		const response = await ordersApi.getOrders(filters);
		return response;
	} catch (error: unknown) {
		return rejectWithValue(getApiErrorMessage(error, "Failed to fetch orders"));
	}
});

export const placeOrder = createAsyncThunk<Order, PlaceOrderRequest, { rejectValue: string }>(
	"orders/placeOrder",
	async (orderData, { rejectWithValue }) => {
		try {
			const response = await ordersApi.placeOrder(orderData);
			return response;
		} catch (error: unknown) {
			return rejectWithValue(getApiErrorMessage(error, "Failed to place order"));
		}
	},
);

const ordersSlice = createSlice({
	name: "orders",
	initialState,
	reducers: {
		setOrdersFilters: (state, action: PayloadAction<OrdersFilters>) => {
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
				state.error = action.payload ?? "Failed to fetch orders";
			})
			.addCase(placeOrder.fulfilled, (state, action) => {
				state.orders.unshift(action.payload);
			});
	},
});

export const { setOrdersFilters } = ordersSlice.actions;
export default ordersSlice.reducer;
