import axios from 'axios';
import { LOGIN_ROUTE } from '../shared/utils/constsLinks';

export const api = axios.create({
  baseURL:import.meta.env.VITE_API_URL || 'http://localhost:4200/api',
  headers:{
    'Content-type':'application/json'
  }
})

api.interceptors.request.use((config)=>{
  const token = localStorage.getItem('token')
  if(token){
    config.headers.Authorization = `Bearer ${token}`
}
  return config;
})


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.location.href = LOGIN_ROUTE;
    }

    return Promise.reject(error);
  }
);
