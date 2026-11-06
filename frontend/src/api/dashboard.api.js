
import api from "./axios";

export const dashboardApi = {
  // Get garage dashboard summary
  getSummary: async () => {
    const response = await api.get("/dashboard/summary");
    return response.data;
  },
};

export default dashboardApi;
