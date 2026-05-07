import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../../api/authApi";
import type { LoginRequest, RegisterRequest, User } from "../types";

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

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: true,
	error: null,
};

export const login = createAsyncThunk(
	"auth/login",
	async (credentials: LoginRequest, { rejectWithValue }) => {
		try {
			const response = await authApi.login(credentials);
			return response;
		} catch (error: unknown) {
			return rejectWithValue(getApiErrorMessage(error, "Login failed"));
		}
	},
);

export const register = createAsyncThunk(
	"auth/register",
	async (credentials: RegisterRequest, { rejectWithValue }) => {
		try {
			const response = await authApi.register(credentials);
			return response;
		} catch (error: unknown) {
			return rejectWithValue(getApiErrorMessage(error, "Registration failed"));
		}
	},
);

export const loginWithGoogle = createAsyncThunk(
	"auth/googleLogin",
	async (credential: string, { rejectWithValue }) => {
		try {
			const response = await authApi.googleLogin(credential);
			return response;
		} catch (error: unknown) {
			return rejectWithValue(getApiErrorMessage(error, "Google login failed"));
		}
	},
);

export const fetchProfile = createAsyncThunk(
	"auth/fetchProfile",
	async (_, { rejectWithValue }) => {
		try {
			const response = await authApi.getProfile();
			return response;
		} catch {
			return rejectWithValue(null);
		}
	},
);

export const logout = createAsyncThunk("auth/logout", async () => {
	await authApi.logout();
});

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(login.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(login.fulfilled, (state, action) => {
				state.isLoading = false;
				state.isAuthenticated = true;
				state.user = action.payload.user;
			})
			.addCase(login.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(register.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(register.fulfilled, (state) => {
				state.isLoading = false;
			})
			.addCase(register.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(loginWithGoogle.pending, (state) => {
				state.isLoading = true;
				state.error = null;
			})
			.addCase(loginWithGoogle.fulfilled, (state, action) => {
				state.isLoading = false;
				state.isAuthenticated = true;
				state.user = action.payload.user;
			})
			.addCase(loginWithGoogle.rejected, (state, action) => {
				state.isLoading = false;
				state.error = action.payload as string;
			})
			.addCase(fetchProfile.pending, (state) => {
				state.isLoading = true;
			})
			.addCase(fetchProfile.fulfilled, (state, action) => {
				state.isLoading = false;
				if (action.payload) {
					state.isAuthenticated = true;
					state.user = {
						id: action.payload.id,
						username: action.payload.username,
						balance: action.payload.balance,
						avatar: action.payload.avatar,
					};
				}
			})
			.addCase(fetchProfile.rejected, (state) => {
				state.isLoading = false;
				state.isAuthenticated = false;
			})
			.addCase(logout.fulfilled, (state) => {
				state.user = null;
				state.isAuthenticated = false;
				state.isLoading = false;
			});
	},
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
