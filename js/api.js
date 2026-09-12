// js/api.js — talks to backend
const API_BASE = 'http://localhost:3000/api';

const API = {
  token: localStorage.getItem('ss_token') || null,

  setToken(t){
    this.token = t;
    if (t) localStorage.setItem('ss_token', t);
    else localStorage.removeItem('ss_token');
  },

  async request(path, options = {}){
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const res = await fetch(API_BASE + path, { ...options, headers });
    if (!res.ok){
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  },

  // ---- Auth ----
  login: (email, password) => API.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),

  // ---- Read-only dashboard data ----
  kpis: () => API.request('/kpis'),
  monthly: () => API.request('/sales/monthly'),
  categories: () => API.request('/sales/categories'),
  cities: () => API.request('/cities'),
  vendorTypes: () => API.request('/vendor-types'),
  vendors: (search) => API.request('/vendors' + (search ? '?search=' + encodeURIComponent(search) : '')),
  vendorsByCity: () => API.request('/vendors-by-city'),
  vendorsByType: () => API.request('/vendors-by-type'),
  suppliers: () => API.request('/suppliers'),
  supplier: (id) => API.request('/suppliers/' + id),
  supplierDemand: (id) => API.request('/suppliers/' + id + '/demand'),
  supplierStatus: () => API.request('/supplier-status'),
  products: () => API.request('/products'),
  reorder: () => API.request('/reorder'),
  predictions: () => API.request('/predictions'),
  modelMetrics: () => API.request('/model-metrics'),

  // ---- Products (vendor actions) ----
  updateProductPrice: (id, unit_price) => API.request('/products/' + id, {
    method: 'PATCH',
    body: JSON.stringify({ unit_price })
  }),
  addProduct: (product) => API.request('/products', {
    method: 'POST',
    body: JSON.stringify(product)
  }),
  updateStock: (id, current_stock) => API.request('/products/' + id + '/stock', {
    method: 'PATCH',
    body: JSON.stringify({ current_stock })
  }),
  receiveStock: (id, quantity) => API.request('/products/' + id + '/receive', {
    method: 'POST',
    body: JSON.stringify({ quantity })
  }),

  // ---- Sales ----
  recordSale: (product_id, quantity) => API.request('/sales', {
    method: 'POST',
    body: JSON.stringify({ product_id, quantity })
  }),
  salesLog: () => API.request('/sales-log'),

  // ---- Supplier self-management ----
  updateSupplier: (id, data) => API.request('/suppliers/' + id, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  addSupplierProduct: (supplierId, product) => API.request('/suppliers/' + supplierId + '/products', {
    method: 'POST',
    body: JSON.stringify(product)
  }),
  updateSupplierProduct: (supplierId, productId, data) => API.request('/suppliers/' + supplierId + '/products/' + productId, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  removeSupplierProduct: (supplierId, productId) => API.request('/suppliers/' + supplierId + '/products/' + productId, {
    method: 'DELETE'
  }),

  // ---- Vendor CRUD (admin) ----
  addVendor: (vendor) => API.request('/vendors', {
    method: 'POST',
    body: JSON.stringify(vendor)
  }),
  updateVendor: (id, data) => API.request('/vendors/' + id, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteVendor: (id) => API.request('/vendors/' + id, {
    method: 'DELETE'
  }),

  // ---- Supplier discounts ----
  createDiscount: (data) => API.request('/discounts', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  discounts: () => API.request('/discounts'),
  supplierDiscounts: (supplierId) => API.request('/suppliers/' + supplierId + '/discounts'),
  deleteDiscount: (id) => API.request('/discounts/' + id, {
    method: 'DELETE'
  })
};