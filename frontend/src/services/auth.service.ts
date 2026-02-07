import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const loginRequest = async (email: string, password: string) => {
  const res = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });

  return res.data.access_token;
};
