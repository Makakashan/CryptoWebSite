import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import { portfolioApi } from "../../api/portfolioApi";
import type { Portfolio, PortfolioState } from "../../types";

const initialState: PortfolioState = {
  portfolio: null,
  isLoading: false,
  error: null,
};

export const fetchPortfolio = createAsyncThunk<
  Portfolio,
  void,
  { rejectValue: string }
>("portfolio/fetch", async (_, { rejectWithValue }) => {
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

const portfolioSlice = createSlice({
  name: "portfolio",
  initialState,
  reducers: {
    clearPortfolio: (state) => {
      state.portfolio = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolio = action.payload;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch portfolio";
      });
  },
});

export const { clearPortfolio } = portfolioSlice.actions;
export default portfolioSlice.reducer;
