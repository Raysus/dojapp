import axios from 'axios';
import { getApiBaseUrl } from '../platform/env';

export const loginRequest = async (email: string, password: string) => {
  const res = await axios.post(`${getApiBaseUrl()}/auth/login`, {
    email,
    password,
  });

  return res.data.access_token;
};
