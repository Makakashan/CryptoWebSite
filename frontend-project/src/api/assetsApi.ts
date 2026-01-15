import api from "./axiosConfig";
import type {
  AssetsFilters,
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
} from "../store/types";

interface AssetsResponse {
  data: Asset[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sortBy?: string;
  sortOrder?: string;
}

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

  getAsset: async (symbol: string): Promise<Asset> => {
    const response = await api.get(`/assets/${symbol}`);
    return response.data;
  },

  createAsset: async (asset: CreateAssetDto): Promise<Asset> => {
    const response = await api.post("/assets", asset);
    return response.data.asset;
  },

  updateAsset: async (
    symbol: string,
    asset: UpdateAssetDto,
  ): Promise<Asset> => {
    const response = await api.put(`/assets/${symbol}`, asset);
    return response.data.asset;
  },

  deleteAsset: async (symbol: string): Promise<void> => {
    await api.delete(`/assets/${symbol}`);
  },
};
