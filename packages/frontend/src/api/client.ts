import axios from "axios";
import { STORAGE_KEYS } from "@uit-volunteer-map/shared";

const rawApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const baseURL = rawApiUrl
  ? rawApiUrl.endsWith("/api")
    ? rawApiUrl
    : `${rawApiUrl}/api`
  : "/api";

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type SessionListener = (token: string) => void;
const sessionListeners = new Set<SessionListener>();
export function onUnauthorized(listener: SessionListener) {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
}

// Keep Axios status/config available to callers while preserving the server message.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage = error.response?.data?.error;
    const message = typeof serverMessage === 'string' ? serverMessage : error.message || "An error occurred";
    error.message = message;
    const authorization = error.config?.headers?.Authorization;
    const failedToken = typeof authorization === 'string' ? authorization.replace(/^Bearer /, '') : null;
    if (error.response?.status === 401 && failedToken && !error.config?.url?.startsWith('/auth/')) {
      sessionListeners.forEach(listener => listener(failedToken));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
