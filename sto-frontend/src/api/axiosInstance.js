import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request Interceptor: Attach Auth Token or Session
api.interceptors.request.use(
  (config) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      } else {
        delete config.headers.Authorization;
      }
    } catch {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Format errors and handle connectivity & session expiry
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 Unauthorized: Sesi kedaluwarsa atau token tidak valid -> Bersihkan sesi total
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('sto_currentUser');
        sessionStorage.removeItem('sto_redirect_after_login');
        delete api.defaults.headers.common['Authorization'];
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      } catch {
        // ignore
      }
    }

    if (!error.response) {
      console.warn('[Axios API] Server backend offline / tidak merespons. Menggunakan mode demonstrasi lokal.');
    }
    return Promise.reject(error);
  }
);

/**
 * Reset Authorization headers completely across all axios instances
 */
export const clearAuthHeaders = () => {
  delete api.defaults.headers.common['Authorization'];
  delete axios.defaults.headers.common['Authorization'];
};

export default api;
