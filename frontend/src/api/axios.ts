import axios from 'axios';
import { getApiBaseUrl } from '../platform/env';
import { getCachedToken } from '../platform/token';

export const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use(config => {
  const token = getCachedToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
