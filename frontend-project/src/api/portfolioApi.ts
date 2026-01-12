import axiosInstance from "./axiosConfig";
import type { Portfolio } from "../store/types";

export const portfolioApi = {
  getPortfolio: async (): Promise<Portfolio> => {
    const response = await axiosInstance.get<Portfolio>("/portfolio");
    return response.data;
  },

  updatePortfolioAsset: async (
    symbol: string,
    quantity: number,
  ): Promise<void> => {
    await axiosInstance.put(`/portfolio/${symbol}`, { quantity });
  },

  deletePortfolioAsset: async (symbol: string): Promise<void> => {
    await axiosInstance.delete(`/portfolio/${symbol}`);
  },
};
