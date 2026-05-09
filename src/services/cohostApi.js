import api from './api';

// ============= COHOST CRUD =============

export const fetchCoHosts = async (params = {}) => {
  const { data } = await api.get('/cohosts', { params });
  return data; // { success, count, total, page, pages, data: [...] }
};

export const fetchMyCoHostProfile = async () => {
  const { data } = await api.get('/cohosts/me');
  return data.data; // null if user is not a cohost
};

export const fetchCoHostById = async (id) => {
  const { data } = await api.get(`/cohosts/${id}`);
  return data.data;
};

export const applyAsCoHost = async (payload) => {
  const { data } = await api.post('/cohosts', payload);
  return data.data;
};

export const updateCoHost = async (id, payload) => {
  const { data } = await api.put(`/cohosts/${id}`, payload);
  return data.data;
};

export const deleteCoHost = async (id) => {
  const { data } = await api.delete(`/cohosts/${id}`);
  return data;
};

export const toggleAvailability = async (id) => {
  const { data } = await api.patch(`/cohosts/${id}/availability`);
  return data.data;
};

// ============= BOOKING =============

export const bookCoHost = async (id, { scheduledAt, duration, notes }) => {
  const { data } = await api.post(`/cohosts/${id}/book`, {
    scheduledAt,
    duration,
    notes,
  });
  return data.data;
};

export const fetchBookedSlots = async (id, dateStr) => {
  // dateStr: "YYYY-MM-DD"
  const { data } = await api.get(`/cohosts/${id}/slots`, { params: { date: dateStr } });
  return data.data; // [{ start, end, duration }]
};

export const fetchMyBookings = async () => {
  const { data } = await api.get('/cohosts/bookings/me');
  return data.data;
};

export const cancelBooking = async (bookingId, reason = '') => {
  const { data } = await api.patch(`/cohosts/bookings/${bookingId}/cancel`, { reason });
  return data.data;
};