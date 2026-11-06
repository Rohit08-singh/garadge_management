
import api from "./axios";

export const notificationsApi = {
  // Get all notifications
  getNotifications: async (params = {}) => {
    const response = await api.get("/notifications/", {
      params,
    });

    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.patch(
      `/notifications/${notificationId}/read`
    );

    return response.data;
  },
};

export default notificationsApi;
