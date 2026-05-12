import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://lokaly-backend-main.onrender.com/api";
const DEBUG = true;

const api = axios.create({ baseURL: API_BASE_URL, timeout: 120000 });
console.log("[api] baseURL =", API_BASE_URL);

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (DEBUG)
      console.log(
        `%c→ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
        "color:#6B5A82",
        { params: config.params, data: config.data, hasToken: !!token },
      );
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    if (DEBUG)
      console.log(
        `%c← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        "color:#51CF66",
        response.data,
      );
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    console.error(
      `%c✗ ${status || "NETWORK"} ${error.config?.method?.toUpperCase() || ""} ${url || ""}`,
      "color:#E85A5A;font-weight:bold",
      {
        message: error.message,
        responseData: error.response?.data,
        baseURL: error.config?.baseURL,
      },
    );

    // ✅ Only auto-logout on 401 for non-upload endpoints
    // Upload 401 was caused by missing auth middleware (now fixed), not expired session
    if (status === 401 && !url?.includes("/upload")) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);

export const searchRecommendations = async (query, city = null) => {
  const { data } = await api.post("/recommendations/search", { query, city });
  return data;
};
export const getForYouRecommendations = async (
  city = null,
  interest = null,
) => {
  const { data } = await api.get("/recommendations/for-you", {
    params: { city, interest },
  });
  return data;
};
export const getSimilarProducts = async (productId) => {
  const { data } = await api.get(`/recommendations/similar/${productId}`);
  return data;
};

export default api;
