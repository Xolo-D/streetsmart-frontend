// js/app.js
const RENDER = {
  // Vendor
  overview: renderOverview,
  sales: renderSales,
  forecast: renderForecast,
  predictions: renderPredictions,
  inventory: renderInventory,
  suppliers: renderSuppliers,
  // Supplier
  'sup-overview': renderSupplierOverview,
  'sup-products': renderSupplierProducts,
  'sup-discounts': renderSupplierDiscounts,
  'sup-demand': renderSupplierDemand,
  // Admin
  'adm-overview': renderAdminOverview,
  'adm-vendors': renderAdminVendors,
  'adm-suppliers': renderAdminSuppliers,
  'adm-data': renderAdminData,
  'adm-reports': renderAdminReports
};

// Login screen is initialized by login.js on page load.