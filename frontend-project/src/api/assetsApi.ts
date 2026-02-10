import api from "./axiosConfig";
import type {
  AssetsFilters,
  Asset,
  CreateAssetDto,
  UpdateAssetDto,
  AssetsResponse,
  ChartDataResponse,
} from "../store/types";

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

  getChartData: async (
    symbols: string[],
    interval: string = "1h",
    limit: number = 24,
  ): Promise<ChartDataResponse> => {
    const response = await api.post<ChartDataResponse>("/assets/chart", {
      symbols,
      interval,
      limit,
    });
    return response.data;
  },
};
