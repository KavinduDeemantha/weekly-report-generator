import { apiClient } from '../../api/client';
import type { AuthenticatedUser } from '../../types/auth';
import type { LoginFormValues, RegisterFormValues } from './schemas';

export const authApi = {
  async me() {
    const response = await apiClient.get<AuthenticatedUser>('/auth/me');
    return response.data;
  },

  async login(values: LoginFormValues) {
    const response = await apiClient.post<AuthenticatedUser>('/auth/login', {
      email: values.email,
      password: values.password,
    });
    return response.data;
  },

  async register(values: RegisterFormValues) {
    const response = await apiClient.post<AuthenticatedUser>('/auth/register', {
      name: values.name,
      email: values.email,
      password: values.password,
    });
    return response.data;
  },

  async logout() {
    await apiClient.post<{ success: true }>('/auth/logout');
  },
};
