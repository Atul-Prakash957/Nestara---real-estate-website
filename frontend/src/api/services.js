import api from './axios';

// ---------------- AUTH ----------------
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
   me: () => api.get('/auth/me'),
  bootstrapAdmin: (data) => api.post('/auth/bootstrap-admin', data),
};

// ---------------- PROPERTIES ----------------
export const propertyApi = {
  list: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  create: (formData) =>
    api.post('/properties', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/properties/${id}`, data),
  remove: (id) => api.delete(`/properties/${id}`),
  myListings: () => api.get('/properties/my-listings'),
  propertyTypes: () => api.get('/properties/property-types'),
  featuredProjects: () => api.get('/properties/featured-projects'),
};

// ---------------- USER ACTIVITY ----------------
export const userApi = {
  shortlist: () => api.get('/properties/shortlist'),
  addShortlist: (propertyId) => api.post(`/properties/${propertyId}/shortlist`),
  removeShortlist: (propertyId) => api.delete(`/properties/${propertyId}/shortlist`),
  recentlyViewed: () => api.get('/properties/recently-viewed'),
  recentSearches: () => api.get('/properties/recent-searches'),
  saveSearch: (data) => api.post('/properties/recent-searches', data),
  contactOwner: (propertyId, data) => api.post(`/properties/${propertyId}/contact`, data),
};

// ---------------- ADMIN ----------------
export const adminApi = {
  dashboardStats: () => api.get('/admin/dashboard-stats'),
  properties: (status) => api.get('/admin/properties', { params: status ? { status } : {} }),
  updateStatus: (id, status) => api.patch(`/admin/properties/${id}/status`, { status }),
  toggleFeatured: (id, isFeatured) => api.patch(`/admin/properties/${id}/feature`, { isFeatured }),
  users: () => api.get('/admin/users'),
  toggleUserActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  createFeaturedProject: (data) => api.post('/admin/featured-projects', data),
  featuredProjectsAdmin: () => api.get('/admin/featured-projects'),
  updateFeaturedProject: (id, data) => api.put(`/admin/featured-projects/${id}`, data),
  toggleFeaturedProjectActive: (id) => api.patch(`/admin/featured-projects/${id}/toggle-active`),
  deleteFeaturedProject: (id) => api.delete(`/admin/featured-projects/${id}`),
};
