import axios from 'axios';
import { normalizeApiError } from './errors';
import { AUTH_UNAUTHORIZED_EVENT } from '../features/auth/session-events';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalizedError = normalizeApiError(error);

    if (normalizedError.statusCode === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }

    return Promise.reject(normalizedError);
  },
);
