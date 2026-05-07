import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { portfolioApi } from "../../api/portfolioApi";
import type { Portfolio } from "../types";

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

export const fetchPortfolio = createAsyncThunk<Portfolio, void, { rejectValue: string }>(
	"portfolio/fetchPortfolio",
	async (_, { rejectWithValue }) => {
		try {
			const response = await portfolioApi.getPortfolio();
			return response;
		} catch (error: unknown) {
			return rejectWithValue(getApiErrorMessage(error, "Failed to fetch portfolio"));
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
				state.portfolio = action.payload;
			})
			.addCase(fetchPortfolio.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload ?? "Failed to fetch portfolio";
			});
	},
});

export default portfolioSlice.reducer;
