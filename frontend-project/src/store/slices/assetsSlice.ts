import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { assetsApi } from "../../api/assetsApi";
import type {
  Asset,
  AssetsFilters,
  PaginationInfo,
  AssetsResponse,
} from "../../types";

interface AssetsState {
  assets: Asset[];
  currentAsset: Asset | null;
  filters: AssetsFilters;
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
}

const initialState: AssetsState = {
  assets: [],
  currentAsset: null,
  filters: {
    page: 1,
    limit: 10,
    sortBy: "price",
    sortOrder: "desc",
  },
  isLoading: false,
  error: null,
  pagination: null,
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

export const fetchAssetBySymbol = createAsyncThunk<
  Asset,
  string,
  { rejectValue: string }
>("assets/fetchAssetBySymbol", async (symbol, { rejectWithValue }) => {
  try {
    const response = await assetsApi.getAsset(symbol);
    return response;
  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch asset",
      );
    }
    return rejectWithValue("Failed to fetch asset");
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
    clearCurrentAsset: (state) => {
      state.currentAsset = null;
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
      .addCase(fetchAssetBySymbol.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAssetBySymbol.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAsset = action.payload;
      })
      .addCase(fetchAssetBySymbol.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch asset";
      });
  },
});

export const { setFilters, clearFilters, clearCurrentAsset } =
  assetsSlice.actions;
export default assetsSlice.reducer;
