
import api from "./axios";

export const paymentsApi = {
  // Submit a new payment
  createPayment: async (paymentData) => {
    const response = await api.post("/payments/", paymentData);
    return response.data;
  },

  // Get payment history
  getPayments: async (params = {}) => {
    const response = await api.get("/payments/", { params });
    return response.data;
  },

  // Owner approves a pending payment
  approvePayment: async (paymentId) => {
    const response = await api.patch(
      `/payments/${paymentId}/approve`
    );
    return response.data;
  },

  // Owner rejects a pending payment
  rejectPayment: async (paymentId, rejectionData) => {
    const response = await api.patch(
      `/payments/${paymentId}/reject`,
      rejectionData
    );
    return response.data;
  },
};
