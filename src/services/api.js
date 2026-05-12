import axios from "axios";
import { useAuthStore } from "../store/authStore";

// ============================================
// API BASE URL
// ============================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://lokaly-backend-main.onrender.com/api";

const DEBUG = true;

// ============================================
// AXIOS INSTANCE
// ============================================

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes
});

console.log("[api] baseURL =", API_BASE_URL);

// ============================================
// REQUEST INTERCEPTOR
// ============================================

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (DEBUG) {
      console.log(
        `%c→ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
        "color:#6B5A82",
        {
          params: config.params,
          data: config.data,
          hasToken: !!token,
        },
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

api.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log(
        `%c← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        "color:#51CF66",
        response.data,
      );
    }

    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    console.error(
      `%c✗ ${status || "NETWORK"} ${method || ""} ${url || ""}`,
      "color:#E85A5A;font-weight:bold",
      {
        message: error.message,
        responseData: error.response?.data,
        baseURL: error.config?.baseURL,
      },
    );

    // Auto logout on unauthorized — but NOT on upload endpoint
    // (upload 401 was caused by missing auth middleware, not expired session)
    const isUpload = url?.includes("/upload");
    if (status === 401 && !isUpload) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);

// ============================================
// RECOMMENDATION APIs
// ============================================

/**
 * Search-based recommendations
 */
export const searchRecommendations = async (query, city = null) => {
  const { data } = await api.post("/recommendations/search", { query, city });

  return data;
};

/**
 * Home page recommendations
 */
export const getForYouRecommendations = async (
  city = null,
  interest = null,
) => {
  const { data } = await api.get("/recommendations/for-you", {
    params: { city, interest },
  });

  return data;
};

/**
 * Similar products
 */
export const getSimilarProducts = async (productId) => {
  const { data } = await api.get(`/recommendations/similar/${productId}`);

  return data;
};

// ============================================
// EXPORT
// ============================================

export default api;
