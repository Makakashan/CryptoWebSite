import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { assetsApi } from "../../api/assetsApi";
import { binanceWebSocketService } from "../../services/binanceWebSocket";
import type {
	AssetsFilters,
	Asset,
	CreateAssetDto,
	UpdateAssetDto,
	ChartDataResponse,
	AssetsResponse,
} from "../types";

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

export const fetchAssets = createAsyncThunk<
	AssetsResponse,
	AssetsFilters | undefined,
	{ rejectValue: string }
>("assets/fetchAssets", async (filters, { rejectWithValue }) => {
	try {
		const response = await assetsApi.getAssets(filters);
		return response;
	} catch (error: unknown) {
		return rejectWithValue(getApiErrorMessage(error, "Failed to fetch assets"));
	}
});

export const fetchChartData = createAsyncThunk<
	ChartDataResponse,
	{ symbols: string[]; interval?: string; limit?: number },
	{ rejectValue: string }
>("assets/fetchChartData", async ({ symbols, interval, limit }, { rejectWithValue }) => {
	try {
		const response = await assetsApi.getChartData(symbols, interval, limit);
		return response;
	} catch (error: unknown) {
		return rejectWithValue(getApiErrorMessage(error, "Failed to fetch chart data"));
	}
});

export const createAsset = createAsyncThunk<Asset, CreateAssetDto, { rejectValue: string }>(
	"assets/createAsset",
	async (asset, { rejectWithValue }) => {
		try {
			const response = await assetsApi.createAsset(asset);
			return response;
		} catch (error: unknown) {
			return rejectWithValue(getApiErrorMessage(error, "Failed to create asset"));
		}
	},
);

export const updateAsset = createAsyncThunk<
	Asset,
	{ symbol: string; data: UpdateAssetDto },
	{ rejectValue: string }
>("assets/updateAsset", async ({ symbol, data }, { rejectWithValue }) => {
	try {
		const response = await assetsApi.updateAsset(symbol, data);
		return response;
	} catch (error: unknown) {
		return rejectWithValue(getApiErrorMessage(error, "Failed to update asset"));
	}
});

export const deleteAsset = createAsyncThunk<string, string, { rejectValue: string }>(
	"assets/deleteAsset",
	async (symbol, { rejectWithValue }) => {
		try {
			await assetsApi.deleteAsset(symbol);
			return symbol;
		} catch (error: unknown) {
			return rejectWithValue(getApiErrorMessage(error, "Failed to delete asset"));
		}
	},
);

const assetsSlice = createSlice({
	name: "assets",
	initialState,
	reducers: {
		setFilters: (state, action: PayloadAction<AssetsFilters>) => {
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
				state.assets = (action.payload.data || []).map((asset) => {
					const cachedPrice = binanceWebSocketService.getPrice(asset.symbol);
					return cachedPrice !== undefined ? { ...asset, current_price: cachedPrice } : asset;
				});
				state.pagination = action.payload.pagination || null;
			})
			.addCase(fetchAssets.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload ?? "Failed to fetch assets";
			})
			.addCase(fetchChartData.fulfilled, (state, action) => {
				const data = action.payload.data || {};
				state.chartData = { ...state.chartData, ...data };
			})
			.addCase(createAsset.fulfilled, (state, action) => {
				state.assets.unshift(action.payload);
			})
			.addCase(updateAsset.fulfilled, (state, action) => {
				const index = state.assets.findIndex((a) => a.symbol === action.payload.symbol);
				if (index !== -1) {
					state.assets[index] = action.payload;
				}
			})
			.addCase(deleteAsset.fulfilled, (state, action) => {
				state.assets = state.assets.filter((a) => a.symbol !== action.payload);
			});
	},
});

export const { setFilters, clearError } = assetsSlice.actions;
export default assetsSlice.reducer;
