import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getAllUsers: () => api.get('/users'),
  deleteUser: (id) => api.delete(`/users/${id}`),
  toggleUserActive: (id) => api.put(`/users/${id}/toggle-active`),
};

// Restaurant API
export const restaurantAPI = {
  getAll: () => api.get('/restaurants'),
  getById: (id) => api.get(`/restaurants/${id}`),
  getByOwner: (ownerId) => api.get(`/restaurants/owner/${ownerId}`),
  create: (data) => api.post('/restaurants', data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
  delete: (id) => api.delete(`/restaurants/${id}`),
  getMenu: (id) => api.get(`/restaurants/${id}/menu`),
  addMenuItem: (id, data) => api.post(`/restaurants/${id}/menu`, data),
  updateMenuItem: (restaurantId, itemId, data) => 
    api.put(`/restaurants/${restaurantId}/menu/${itemId}`, data),
  deleteMenuItem: (restaurantId, itemId) => 
    api.delete(`/restaurants/${restaurantId}/menu/${itemId}`),
  search: (query) => api.get(`/restaurants/search?query=${query}`),
};

// Order API
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getById: (id) => api.get(`/orders/${id}`),
  getAll: () => api.get('/orders'),
  getMyOrders: () => api.get('/orders/my-orders'),
  getByRestaurant: (restaurantId) => api.get(`/orders/restaurant/${restaurantId}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status?status=${status}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
  confirm: (id) => api.put(`/orders/${id}/confirm`),
};

// Payment API
export const paymentAPI = {
  process: (data) => api.post('/payments/process', data),
  createCheckoutSession: (data) => api.post('/payments/create-checkout-session', data),
  verify: (sessionId) => api.get(`/payments/verify/${sessionId}`),
  getByOrder: (orderId) => api.get(`/payments/order/${orderId}`),
  getAll: () => api.get('/payments'),
};

// Delivery API
export const deliveryAPI = {
  getByOrder: (orderId) => api.get(`/delivery/order/${orderId}`),
  getAvailable: () => api.get('/delivery/available'),
  getMyDeliveries: () => api.get('/delivery/my-deliveries'),
  accept: (id) => api.put(`/delivery/${id}/accept`),
  updateStatus: (id, status) => api.put(`/delivery/${id}/status?status=${status}`),
  getAgentDeliveries: (agentId) => api.get(`/delivery/agent/${agentId}`),
  getAllAgents: () => api.get('/delivery/agents'),
  getAll: () => api.get('/delivery/all'),
  registerAgent: (data) => api.post('/delivery/agents/register', data),
};

export default api;
