import { api } from '../api/axios';

export const getMyDojos = async () => {
  const res = await api.get('/dojos/mine');
  return res.data;
};