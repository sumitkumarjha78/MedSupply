import axiosClient from './axiosClient';

// Auth Service (/api/auth)
export const authApi = {
  login: (credentials) => axiosClient.post('/api/auth/login', credentials).then((r) => r.data),
  register: (payload) => axiosClient.post('/api/auth/register', payload).then((r) => r.data),
  createStaff: (payload) =>
    axiosClient.post('/api/auth/admin/users', payload).then((r) => r.data),
  me: () => axiosClient.get('/api/auth/me').then((r) => r.data),
};

// Product Service (/api/products)
export const productApi = {
  getAll: () => axiosClient.get('/api/products').then((r) => r.data),
  getById: (id) => axiosClient.get(`/api/products/${id}`).then((r) => r.data),
  create: (payload) => axiosClient.post('/api/products', payload).then((r) => r.data),
  update: (id, payload) => axiosClient.put(`/api/products/${id}`, payload).then((r) => r.data),
  remove: (id) => axiosClient.delete(`/api/products/${id}`),
};

// Inventory Service (/api/inventory)
export const inventoryApi = {
  getAll: () => axiosClient.get('/api/inventory').then((r) => r.data),
  getByProductId: (productId) =>
    axiosClient.get(`/api/inventory/${productId}`).then((r) => r.data),
  initialize: ({ productId, quantity }) =>
    axiosClient
      .post('/api/inventory', { productId, quantity: Number(quantity) })
      .then((r) => r.data),
  updateStock: (productId, quantity) =>
    axiosClient
      .put(`/api/inventory/${productId}`, { quantity: Number(quantity) })
      .then((r) => r.data),
};

// Order Service (/api/orders)
export const orderApi = {
  create: ({ facilityName, items }) =>
    axiosClient.post('/api/orders', { facilityName, items }).then((r) => r.data),
  getAll: () => axiosClient.get('/api/orders').then((r) => r.data),
  getById: (id) => axiosClient.get(`/api/orders/${id}`).then((r) => r.data),
  cancel: (id) =>
    axiosClient.patch(`/api/orders/${id}/status`, { status: 'CANCELLED' }).then((r) => r.data),
};