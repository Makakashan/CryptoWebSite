import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { assetsApi } from "../../api/assetsApi";
import type { AssetsFilters, Asset, ChartDataResponse } from "../types";

interface AssetsState {
	assets: Asset[];
	isLoading: boolean;
	error: string | null;
	filters: AssetsFilters;
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	} | null;
	chartData: Record<string, number[]>;
}

const initialState: AssetsState = {
	assets: [],
	isLoading: false,
	error: null,
	filters: {
		page: 1,
		limit: 12,
		sortBy: "price",
		sortOrder: "desc",
	},
	pagination: null,
	chartData: {},
};

export const fetchAssets = createAsyncThunk(
	"assets/fetchAssets",
	async (filters: AssetsFilters | undefined, { rejectWithValue }) => {
		try {
			const response = await assetsApi.getAssets(filters);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || "Failed to fetch assets");
		}
	},
);

export const fetchChartData = createAsyncThunk(
	"assets/fetchChartData",
	async (
		{ symbols, interval, limit }: { symbols: string[]; interval?: string; limit?: number },
		{ rejectWithValue },
	) => {
		try {
			const response = await assetsApi.getChartData(symbols, interval, limit);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || "Failed to fetch chart data");
		}
	},
);

export const createAsset = createAsyncThunk(
	"assets/createAsset",
	async (asset: any, { rejectWithValue }) => {
		try {
			const response = await assetsApi.createAsset(asset);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || "Failed to create asset");
		}
	},
);

export const updateAsset = createAsyncThunk(
	"assets/updateAsset",
	async ({ symbol, data }: { symbol: string; data: any }, { rejectWithValue }) => {
		try {
			const response = await assetsApi.updateAsset(symbol, data);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || "Failed to update asset");
		}
	},
);

export const deleteAsset = createAsyncThunk(
	"assets/deleteAsset",
	async (symbol: string, { rejectWithValue }) => {
		try {
			await assetsApi.deleteAsset(symbol);
			return symbol;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || "Failed to delete asset");
		}
	},
);

const assetsSlice = createSlice({
	name: "assets",
	initialState,
	reducers: {
		setFilters: (state, action) => {
			state.filters = { ...state.filters, ...action.payload };
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchAssets.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(fetchAssets.fulfilled, (state, action) => {
				state.isLoading = false;
				state.assets = action.payload.data || [];
				state.pagination = action.payload.pagination || null;
			})
			.addCase(fetchAssets.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(fetchChartData.fulfilled, (state, action) => {
				const data = (action.payload as ChartDataResponse).data || {};
				state.chartData = { ...state.chartData, ...data };
			})
			.addCase(createAsset.fulfilled, (state, action) => {
				state.assets.unshift(action.payload as Asset);
			})
			.addCase(updateAsset.fulfilled, (state, action) => {
				const index = state.assets.findIndex((a) => a.symbol === (action.payload as Asset).symbol);
				if (index !== -1) {
					state.assets[index] = action.payload as Asset;
				}
			})
			.addCase(deleteAsset.fulfilled, (state, action) => {
				state.assets = state.assets.filter((a) => a.symbol !== action.payload);
			});
	},
});

export const { setFilters, clearError } = assetsSlice.actions;
export default assetsSlice.reducer;
