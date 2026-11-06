
import api from "./axios";

export const driversApi = {
  // Register a new driver
  createDriver: async (driverData) => {
    const response = await api.post("/drivers/", driverData);
    return response.data;
  },

  // Get all drivers
  getDrivers: async (params = {}) => {
    const response = await api.get("/drivers/", { params });
    return response.data;
  },

  // Get a single driver by ID
  getDriverById: async (driverId) => {
    const response = await api.get(`/drivers/${driverId}`);
    return response.data;
  },

  // Update driver information
  updateDriver: async (driverId, driverData) => {
    const response = await api.patch(
      `/drivers/${driverId}`,
      driverData
    );
    return response.data;
  },

  // Deactivate a driver
  deactivateDriver: async (driverId) => {
    const response = await api.patch(
      `/drivers/${driverId}/deactivate`
    );
    return response.data;
  },
};
