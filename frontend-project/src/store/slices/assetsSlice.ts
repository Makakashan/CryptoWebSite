import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { assetsApi } from "../../api/assetsApi";
import type {
  AssetsFilters,
  AssetsState,
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
  AssetsResponse,
} from "../types/assets.types";

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
  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch assets",
      );
    }
    return rejectWithValue("Failed to fetch assets");
  }
});

export const fetchChartData = createAsyncThunk<
  Record<string, number[]>,
  string[],
  { rejectValue: string }
>("assets/fetchChartData", async (symbols, { rejectWithValue }) => {
  try {
    const response = await assetsApi.getChartData(symbols, "15m", 96);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch chart data",
      );
    }
    return rejectWithValue("Failed to fetch chart data");
  }
});

export const createAsset = createAsyncThunk<
  Asset,
  CreateAssetDto,
  { rejectValue: string }
>("assets/createAsset", async (assetData, { rejectWithValue }) => {
  try {
    const response = await assetsApi.createAsset(assetData);
    return response;
  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create asset",
      );
    }
    return rejectWithValue("Failed to create asset");
  }
});

export const updateAsset = createAsyncThunk<
  Asset,
  { symbol: string; data: UpdateAssetDto },
  { rejectValue: string }
>("assets/updateAsset", async ({ symbol, data }, { rejectWithValue }) => {
  try {
    const response = await assetsApi.updateAsset(symbol, data);
    return response;
  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update asset",
      );
    }
    return rejectWithValue("Failed to update asset");
  }
});

export const deleteAsset = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("assets/deleteAsset", async (symbol, { rejectWithValue }) => {
  try {
    await assetsApi.deleteAsset(symbol);
    return symbol;
  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete asset",
      );
    }
    return rejectWithValue("Failed to delete asset");
  }
});

const assetsSlice = createSlice({
  name: "assets",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<AssetsFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearChartData: (state) => {
      state.chartData = {};
    },
    updateAssetPrice: (
      state,
      action: PayloadAction<{ symbol: string; price: number }>,
    ) => {
      const asset = state.assets.find(
        (a) => a.symbol === action.payload.symbol,
      );
      if (asset) {
        asset.price = action.payload.price;
      }
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
        state.assets = action.payload.data;
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch assets";
      })
      .addCase(fetchChartData.fulfilled, (state, action) => {
        state.chartData = { ...state.chartData, ...action.payload };
      })
      .addCase(fetchChartData.rejected, (_, action) => {
        console.error("Failed to fetch chart data:", action.payload);
      })
      .addCase(createAsset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assets.unshift(action.payload);
      })
      .addCase(createAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to create asset";
      })
      .addCase(updateAsset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.assets.findIndex(
          (a) => a.symbol === action.payload.symbol,
        );
        if (index !== -1) {
          state.assets[index] = action.payload;
        }
      })
      .addCase(updateAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to update asset";
      })
      .addCase(deleteAsset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assets = state.assets.filter((a) => a.symbol !== action.payload);
      })
      .addCase(deleteAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to delete asset";
      });
  },
});

export const { setFilters, clearFilters, clearChartData, updateAssetPrice } =
  assetsSlice.actions;
export default assetsSlice.reducer;
