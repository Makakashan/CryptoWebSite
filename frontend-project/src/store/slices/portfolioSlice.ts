import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { portfolioApi } from "../../api/portfolioApi";
import type { Portfolio, PortfolioAsset } from "../../types";

interface PortfolioState {
  portfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: PortfolioState = {
  portfolio: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

export const fetchPortfolio = createAsyncThunk<
  Portfolio,
  void,
  { rejectValue: string }
>("portfolio/fetchPortfolio", async (_, { rejectWithValue }) => {
  try {
    const response = await portfolioApi.getPortfolio();
    return response;
  } catch (error) {
    if (error instanceof AxiosError) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch portfolio",
      );
    }
    return rejectWithValue("Failed to fetch portfolio");
  }
});

export const updatePortfolioAsset = createAsyncThunk<
  void,
  { symbol: string; quantity: number },
  { rejectValue: string }
>(
  "portfolio/updateAsset",
  async ({ symbol, quantity }, { rejectWithValue }) => {
    try {
      await portfolioApi.updatePortfolioAsset(symbol, quantity);
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to update asset",
        );
      }
      return rejectWithValue("Failed to update asset");
    }
  },
);

export const deletePortfolioAsset = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("portfolio/deleteAsset", async (symbol, { rejectWithValue }) => {
  try {
    await portfolioApi.deletePortfolioAsset(symbol);
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

const portfolioSlice = createSlice({
  name: "portfolio",
  initialState,
  reducers: {
    clearPortfolio: (state) => {
      state.portfolio = null;
      state.error = null;
      state.lastFetched = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch portfolio
      .addCase(fetchPortfolio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolio = action.payload;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch portfolio";
      })
      // Update asset
      .addCase(updatePortfolioAsset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePortfolioAsset.fulfilled, (state) => {
        state.isLoading = false;
        // Invalidate cache to force refetch
        state.lastFetched = null;
      })
      .addCase(updatePortfolioAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to update asset";
      })
      // Delete asset
      .addCase(deletePortfolioAsset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletePortfolioAsset.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove asset from local state
        if (state.portfolio?.assets) {
          state.portfolio.assets = state.portfolio.assets.filter(
            (asset: PortfolioAsset) => asset.symbol !== action.payload,
          );
        }
      })
      .addCase(deletePortfolioAsset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to delete asset";
      });
  },
});

export const { clearPortfolio, clearError } = portfolioSlice.actions;
export default portfolioSlice.reducer;
