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
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log(
      `%c→ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      'color:#6B5A82',
      { params: config.params, data: config.data, hasToken: !!token }
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

export default api;
