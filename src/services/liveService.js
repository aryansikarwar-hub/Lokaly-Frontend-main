import api from "./api";

/**
 * Live streaming API client
 */
export const liveService = {
  /**
   * Fetch featured streams for homepage card carousel
   */
  getFeatured: async (limit = 8) => {
    const { data } = await api.get(`/live/featured?limit=${limit}`);
    return data;
  },

  /**
   * Fetch all sessions by status
   */
  listSessions: async (status = "live") => {
    const { data } = await api.get(`/live/sessions?status=${status}`);
    return data;
  },

  /**
   * Fetch single session by ID
   */
  getSession: async (sessionId) => {
    const { data } = await api.get(`/live/sessions/${sessionId}`);
    return data;
  },
};

export default liveService;