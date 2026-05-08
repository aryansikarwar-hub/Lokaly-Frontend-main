import api from "./api";

const API = "/notifications";

export const getNotifications = async (params = {}) => {
  const res = await api.get(API, { params });
  return res.data;
};

export const getUnreadCount = async () => {
  const res = await api.get(`${API}/unread-count`);
  return res.data?.count || 0;
};

export const markNotificationRead = async (id) => {
  const res = await api.patch(`${API}/${id}/read`);
  return res.data;
};
export const clearNotifications = async () => {
  const res = await api.delete(API);
  return res.data;
};
export const markAllNotificationsRead = async () => {
  const res = await api.patch(`${API}/read`);
  return res.data;
};