
import api from "./axios";

export const reportsApi = {
  // Get daily garage report
  getDailyReport: async (reportDate) => {
    const response = await api.get("/reports/daily", {
      params: {
        report_date: reportDate,
      },
    });

    return response.data;
  },
};

export default reportsApi;
