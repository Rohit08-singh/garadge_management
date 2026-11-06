
import api from "./axios";

export const authApi = {
  // Login owner or operator
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // Get current logged-in user
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Create a new operator (owner only)
  createOperator: async (operatorData) => {
    const response = await api.post("/auth/operators", operatorData);
    return response.data;
  },
};
