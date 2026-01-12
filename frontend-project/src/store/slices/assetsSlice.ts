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
  PaginationInfo,
} from "../types";

interface AssetsResponse {
  data: Asset[];
  pagination?: PaginationInfo;
  sortBy?: string;
  sortOrder?: string;
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
      });
  },
});

export const { setFilters, clearFilters } = assetsSlice.actions;
export default assetsSlice.reducer;
