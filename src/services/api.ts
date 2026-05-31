import axios from 'axios';

// Central API Axios instance configured with base proxy path
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT token into Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token refreshing states to prevent overlapping requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Parse C# ApiResponse wrappers & manage token refreshes
api.interceptors.response.use(
  (response) => {
    // Automatically unpack successful backend wrappers
    if (response.data && response.data.success === true) {
      return response.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh automatically if 401 unauthorized is received
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        // Clean session and notify auth context of logout
        localStorage.clear();
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(error);
      }

      try {
        // Direct call to axios to prevent loop interceptors
        const response = await axios.post('/api/v1/auth/refresh-token', { refreshToken });
        const data = response.data;
        
        // Unpack token payload
        const { accessToken, refreshToken: newRefreshToken } = data.data || {};

        if (!accessToken) {
          throw new Error('Access token not returned from refresh');
        }

        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Wipe local storage on fatal refresh fail and trigger logout
        localStorage.clear();
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshError);
      }
    }

    // Unpack C# error wrappers for easy consumption in components
    const apiError = error.response?.data;
    if (apiError && apiError.success === false) {
      return Promise.reject({
        message: apiError.message || 'An error occurred',
        errors: apiError.errors || [],
        status: error.response.status,
      });
    }

    return Promise.reject({
      message: error.message || 'Network error occurred',
      errors: [],
      status: error.response?.status || 500,
    });
  }
);

export default api;
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  traceId: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
