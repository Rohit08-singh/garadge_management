
import api from "./axios";

export const sessionsApi = {
  // Create a new daily register
  createSession: async (sessionData = {}) => {
    const response = await api.post("/sessions/", sessionData);
    return response.data;
  },

  // Get the currently active register
  getCurrentSession: async () => {
    const response = await api.get("/sessions/current");
    return response.data;
  },

  // Get all driver records for a particular register
  getSessionRecords: async (sessionId) => {
    const response = await api.get(
      `/sessions/${sessionId}/records`
    );
    return response.data;
  },

  // Update attendance, fees and vehicle timings
  updateRecord: async (recordId, recordData) => {
    const response = await api.patch(
      `/sessions/records/${recordId}`,
      recordData
    );
    return response.data;
  },
};
