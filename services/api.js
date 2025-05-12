
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://192.168.0.114:8000/api', // Asegúrate de que esta IP es correcta
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente a cada solicitud
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const login = async (email, password) => {
  try {
    const response = await api.post('/login/', { email, password });

    if (response.data?.token) {
      await AsyncStorage.setItem('token', response.data.token); // Guardar token
    }

    return response.data;
  } catch (error) {
    console.error('Error en login:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Error desconocido' };
  }
};

export const register = async (fullName, username, email, password) => {
  try {
    const response = await api.post('/register/', {
      fullName,
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Error en register:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Error desconocido' };
  }
};

export const logout = async () => {
  await AsyncStorage.removeItem('token'); // Borrar token al cerrar sesión
};

export default api;
