import api from "./axiosConfig.js";

export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post("/auth/login", { username, password });
    return response.data;
  },

  register: async (username: string, password: string) => {
    const response = await api.post("/auth/register", { username, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  // Отримати дані поточного користувача
  getProfile: async () => {
    const response = await api.get("/portfolio"); // Повертає username + balance
    return response.data;
  },
};
