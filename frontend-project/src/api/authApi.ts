import api from "./axiosConfig";
import {
  type LoginRequest,
  type RegisterRequest,
  type AuthResponse,
} from "../store/types";
import type { Portfolio } from "../store/types";

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  register: async (credentials: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      "/auth/register",
      credentials,
    );
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  getProfile: async (): Promise<Portfolio> => {
    const response = await api.get<Portfolio>("/portfolio");
    return response.data;
  },
};
