// js/app.js

const RENDER = {
  // Vendor
  overview: renderOverview,
  sales: renderSales,
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
  'adm-pending': renderAdminPending,
  'adm-data': renderAdminData,
  'adm-reports': renderAdminReports
};

/* ============================================================
   MOBILE MENU
   ============================================================ */

function initMobileMenu(){
  const hamburger = document.getElementById('hamburger-btn');
  const sidebar = document.querySelector('#app-shell aside');
  const overlay = document.getElementById('sidebar-overlay');

  if (!hamburger || !sidebar || !overlay) return;

  hamburger.onclick = () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  };
  overlay.onclick = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  };
}

document.addEventListener('click', (e) => {
  if (window.innerWidth <= 900 && e.target.closest('#sidebar-nav button')){
    setTimeout(() => {
      const sidebar = document.querySelector('#app-shell aside');
      const overlay = document.getElementById('sidebar-overlay');
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    }, 200);
  }
});

document.addEventListener('DOMContentLoaded', initMobileMenu);