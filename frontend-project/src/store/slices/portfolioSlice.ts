import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { portfolioApi } from "../../api/portfolioApi";
import type { Portfolio } from "../types";

interface PortfolioState {
	portfolio: Portfolio | null;
	isLoading: boolean;
	error: string | null;
}

const initialState: PortfolioState = {
	portfolio: null,
	isLoading: false,
	error: null,
};

export const fetchPortfolio = createAsyncThunk(
	"portfolio/fetchPortfolio",
	async (_, { rejectWithValue }) => {
		try {
			const response = await portfolioApi.getPortfolio();
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || "Failed to fetch portfolio");
		}
	},
);

const portfolioSlice = createSlice({
	name: "portfolio",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchPortfolio.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(fetchPortfolio.fulfilled, (state, action) => {
				state.isLoading = false;
				state.portfolio = action.payload as Portfolio;
			})
			.addCase(fetchPortfolio.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			});
	},
});

export default portfolioSlice.reducer;
