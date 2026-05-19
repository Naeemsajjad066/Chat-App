/**
 * Message API — all message/user HTTP calls in one place.
 */
import api from "./client.js";

export const messageApi = {
  getUsers:        ()           => api.get("/api/messages/user"),
  getMessages:     (userId)     => api.get(`/api/messages/${userId}`),
  sendMessage:     (userId, data) => api.post(`/api/messages/send/${userId}`, data),
  markSeen:        (msgId)      => api.put(`/api/messages/mark/${msgId}`),
  deleteMessages:  (userId)     => api.delete(`/api/messages/delete/${userId}`),
};
