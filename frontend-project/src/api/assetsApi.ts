import api from "./axiosConfig";
import { type AssetsFilters, type AssetsResponse } from "../types/index.js";

export const assetsApi = {
  getAssets: async (filters?: AssetsFilters): Promise<AssetsResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<AssetsResponse>(
      `/assets?${params.toString()}`,
    );
    return response.data;
  },

  getAsset: async (symbol: string) => {
    const response = await api.get(`/assets/${symbol}`);
    return response.data;
  },
};
