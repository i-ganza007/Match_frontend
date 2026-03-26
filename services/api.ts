import axios from 'axios';

const API_BASE_URL = 'https://match-backend-jz3n.onrender.com';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Keep for cookie support (backend sends both)
});

// Request interceptor - Add Bearer token to headers
api.interceptors.request.use(
  async (config) => {
    const { getAuthToken } = await import('./secureStorage');
    const token = await getAuthToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Added Bearer token to request:', config.url);
    } else {
      // Public routes don't need a token — skip the warning for them
      const publicRoutes = ['/auth/signup', '/auth/login'];
      const isPublic = publicRoutes.some(r => config.url?.includes(r));
      if (!isPublic) {
        console.log('⚠️ No token found for request:', config.url);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — just propagate errors.
// We intentionally do NOT auto-logout on 401. The Render free-tier backend
// regenerates its JWT secret on every cold-start, so a 401 does NOT mean the
// user's credentials are wrong — it just means the server restarted. Each
// feature handles 401 on its own (show error / retry). The user must only
// ever be signed out by explicitly pressing "Log Out".
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export default api;
export { API_BASE_URL };
