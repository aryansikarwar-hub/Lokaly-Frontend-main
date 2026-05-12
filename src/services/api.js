import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const DEBUG = true; // flip to false to silence

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

console.log('[api] baseURL =', API_BASE);

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` };

  // Don't set Content-Type for FormData — let browser handle multipart/form-data with boundary
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
      delete config.headers.common?.['Content-Type'];
      delete config.headers.common?.['content-type'];
    }
  }

  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log(
      `%c→ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      'color:#6B5A82',
      { params: config.params, data: config.data instanceof FormData ? '[FormData]' : config.data, hasToken: !!token }
    );
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log(
        `%c← ${res.status} ${res.config.method?.toUpperCase()} ${res.config.url}`,
        'color:#51CF66',
        res.data
      );
    }
    return res;
  },
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url;
    const method = err.config?.method?.toUpperCase();
    // eslint-disable-next-line no-console
    console.error(
      `%c✗ ${status || 'NETWORK'} ${method || ''} ${url || ''}`,
      'color:#E85A5A;font-weight:bold',
      {
        message: err.message,
        responseData: err.response?.data,
        baseURL: err.config?.baseURL,
      }
    );
    if (status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

// ============================================
// 🆕 Recommendation API (HuggingFace AI model)
// ============================================

/**
 * Search-based recommendations
 * @param {string} query - Search query (e.g., "biryani", "haircut")
 * @param {string|null} city - Optional city filter
 */
export const searchRecommendations = async (query, city = null) => {
  const { data } = await api.post('/recommendations/search', { query, city });
  return data;
};

/**
 * Home page "Recommended for you"
 * @param {string|null} city - User's city
 * @param {string|null} interest - Optional interest/category
 */
export const getForYouRecommendations = async (city = null, interest = null) => {
  const { data } = await api.get('/recommendations/for-you', {
    params: { city, interest },
  });
  return data;
};

/**
 * Product detail page "Similar items"
 * @param {string} productId - MongoDB product ID
 */
export const getSimilarProducts = async (productId) => {
  const { data } = await api.get(`/recommendations/similar/${productId}`);
  return data;
};

export default api;