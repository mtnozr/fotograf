import axios from 'axios';

// Use relative path '/api'. 
// In development, Vite proxy will forward to localhost:3001.
// In production (Vercel), it will be handled by Vercel rewrites to the serverless function.
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (username, password) => {
  const response = await api.post('/login', { username, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getPhotos = async () => {
  const response = await api.get('/photos');
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const createCategory = async (name) => {
  const response = await api.post('/categories', { name });
  return response.data;
};

export const uploadPhotos = async (formData, onUploadProgress) => {
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const deletePhoto = async (id) => {
  // Send ID as query param to handle characters like slashes in public_id
  const response = await api.delete('/photos', { params: { id } });
  return response.data;
};

// Blog Posts API
export const getPosts = async () => {
  const response = await api.get('/posts');
  return response.data;
};

export const createPost = async (formData, onUploadProgress) => {
  const response = await api.post('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const updatePost = async (id, formData, onUploadProgress) => {
  const response = await api.put('/posts', formData, {
    params: { id },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const deletePost = async (id) => {
  const response = await api.delete('/posts', { params: { id } });
  return response.data;
};

// About Page API
export const getAbout = async () => {
  const response = await api.get('/about');
  return response.data;
};

export const saveAbout = async (formData) => {
  const response = await api.post('/about', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default api;
