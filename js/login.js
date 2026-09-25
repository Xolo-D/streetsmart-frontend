// js/login.js

/* ============================================================
   ROLE TABS
   ============================================================ */

const ROLE_TABS = {
  vendor: [
    {id:'overview', label:'Overview', icon:'overview'},
    {id:'sales', label:'Sales', icon:'sales'},
    {id:'predictions', label:'What to stock', icon:'inventory'},
    {id:'inventory', label:'Inventory & reorder', icon:'inventory'},
    {id:'suppliers', label:'Suppliers', icon:'suppliers'}
  ],
  supplier: [
    {id:'sup-overview', label:'Overview', icon:'overview'},
    {id:'sup-products', label:'My products', icon:'inventory'},
    {id:'sup-discounts', label:'Discounts', icon:'sales'},
    {id:'sup-demand', label:'Demand for my stock', icon:'forecast'}
  ],
  admin: [
    {id:'adm-overview', label:'Overview', icon:'overview'},
    {id:'adm-vendors', label:'Vendors', icon:'sales'},
    {id:'adm-suppliers', label:'Suppliers', icon:'suppliers'},
    {id:'adm-pending', label:'Pending users', icon:'forecast'},
    {id:'adm-data', label:'System data', icon:'inventory'},
    {id:'adm-reports', label:'Reports', icon:'forecast'}
  ]
};

/* ============================================================
   DOM REFERENCES
   ============================================================ */

const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const sidebarNav = document.getElementById('sidebar-nav');
const sidebarUser = document.getElementById('sidebar-user');
const viewsEl = document.getElementById('views');
const sessionBar = document.getElementById('session-bar');
const pageTitle = document.getElementById('page-title');

/* ============================================================
   SESSION
   ============================================================ */

const session = { role:null, supplierId:null, vendorId:null, user:null };
const renderedTabs = new Set();
let isLoggingIn = false;

/* ============================================================
   SCREEN SWITCH
   ============================================================ */

function showLoginScreen(){
  loginScreen.classList.remove('hidden');
  appShell.classList.add('hidden');
  sidebarNav.innerHTML = '';
  sidebarUser.innerHTML = '';
  viewsEl.innerHTML = '';
  sessionBar.innerHTML = '';
  if (pageTitle) pageTitle.innerHTML = '';
  isLoggingIn = false;
  bindLoginForm();
}

function showAppShell(){
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
}

/* ============================================================
   TABS
   ============================================================ */

function showTab(id){
  document.querySelectorAll('#sidebar-nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  document.querySelectorAll('#views section.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + id));

  const tab = ROLE_TABS[session.role].find(t => t.id === id);
  if (tab && pageTitle){
    pageTitle.innerHTML = '<h1 class="text-2xl text-white display">' + tab.label + '</h1><p class="text-xs text-slate-500">Everything here</p>';
  }

  if (!renderedTabs.has(id)){
    renderedTabs.add(id);
    try {
      RENDER[id]();
    } catch (err){
      console.error('Render error for tab', id, err);
    }
  }
}

function buildNavFor(role){
  sidebarNav.innerHTML = '';
  viewsEl.innerHTML = '';
  renderedTabs.clear();

  ROLE_TABS[role].forEach(t => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.tab = t.id;
    btn.className = 'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-100 hover:bg-blue-500/10 transition-all text-left w-full';
    btn.innerHTML = '<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + getIconPath(t.icon) + '</svg>' +
      '<span>' + t.label + '</span>';
    btn.onclick = () => showTab(t.id);
    sidebarNav.appendChild(btn);

    const sec = document.createElement('section');
    sec.className = 'view';
    sec.id = 'view-' + t.id;
    viewsEl.appendChild(sec);
  });

  const style = document.createElement('style');
  style.textContent = `
    #sidebar-nav button.active {
      background: linear-gradient(135deg, rgba(30,78,140,0.15) 0%, rgba(46,111,191,0.08) 100%) !important;
      color: #1E4E8C !important;
      box-shadow: inset 3px 0 0 #1E4E8C;
    }
    #views section.view { display: none; }
    #views section.view.active { display: block; animation: fadein 0.3s ease; }
    @keyframes fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  `;
  if (!document.getElementById('dynamic-tab-styles')){
    style.id = 'dynamic-tab-styles';
    document.head.appendChild(style);
  }

  loadAlertsBadge();
  loadPendingUsersBadge();
}

/* ============================================================
   BADGES
   ============================================================ */

async function loadAlertsBadge(){
  try {
    const alerts = await API.alerts();
    if (alerts.count > 0){
      const invBtn = document.querySelector('#sidebar-nav button[data-tab="inventory"]');
      if (invBtn && !invBtn.querySelector('.nav-badge')){
        const badge = document.createElement('span');
        badge.className = 'nav-badge';
        badge.textContent = alerts.count;
        invBtn.appendChild(badge);
      }
      const supBtn = document.querySelector('#sidebar-nav button[data-tab="sup-products"]');
      if (supBtn && !supBtn.querySelector('.nav-badge')){
        const badge = document.createElement('span');
        badge.className = 'nav-badge';
        badge.textContent = alerts.count;
        supBtn.appendChild(badge);
      }
    }
  } catch (e){ /* silent */ }
}

async function loadPendingUsersBadge(){
  if (session.role !== 'admin') return;
  try {
    const users = await API.pendingUsers();
    if (users.length > 0){
      const btn = document.querySelector('#sidebar-nav button[data-tab="adm-pending"]');
      if (btn && !btn.querySelector('.nav-badge')){
        const badge = document.createElement('span');
        badge.className = 'nav-badge';
        badge.textContent = users.length;
        btn.appendChild(badge);
      }
    }
  } catch (e){ /* silent */ }
}

/* ============================================================
   ICON PATHS
   ============================================================ */

function getIconPath(icon){
  const paths = {
    overview: '<path d="M3 12l4-4 4 4 6-8 4 4"/>',
    sales: '<rect x="3" y="10" width="4" height="10"/><rect x="10" y="5" width="4" height="15"/><rect x="17" y="13" width="4" height="7"/>',
    forecast: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    inventory: '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
    suppliers: '<path d="M3 16V6h11v10"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'
  };
  return paths[icon] || paths.overview;
}

/* ============================================================
   SIDEBAR USER CARD
   ============================================================ */

function renderSidebarUser(){
  if (!session.user) { sidebarUser.innerHTML = ''; return; }

  const roleLabel = { vendor:'Vendor', supplier:'Supplier', admin:'Administrator' }[session.role];
  let displayName, subLabel, initials, avatarGradient;

  if (session.role === 'supplier'){
    const supplier = DATA.suppliers.find(s => s.id === session.supplierId) || DATA.suppliers[0];
    displayName = supplier.name;
    subLabel = supplier.id + ' Â· ' + supplier.city;
    initials = supplier.name.split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('').slice(0, 2);
    avatarGradient = 'from-blue-500 to-cyan-500';
  } else if (session.role === 'vendor'){
    const vendorId = session.vendorId || 'â€”';
    const vendor = (typeof DATA !== 'undefined' && DATA.vendors)
      ? DATA.vendors.find(v => v.id === vendorId)
      : null;
    displayName = vendor ? (vendor.id + ' Â· ' + vendor.city) : (session.user.name || 'New Vendor');
    subLabel = session.user.email || 'vendor@streetsmart.co.za';
    initials = vendorId === 'â€”' ? 'NV' : vendorId.replace('V', '').slice(-2);
    avatarGradient = 'from-cyan-500 to-blue-600';
  } else {
    displayName = session.user.name || 'System Administrator';
    subLabel = session.user.email || 'admin@streetsmart.co.za';
    initials = 'SA';
    avatarGradient = 'from-blue-600 to-indigo-600';
  }

  sidebarUser.innerHTML =
    '<div class="w-10 h-10 rounded-lg bg-gradient-to-br ' + avatarGradient + ' flex items-center justify-center text-white font-bold flex-shrink-0 text-xs">' + initials + '</div>' +
    '<div class="overflow-hidden">' +
      '<div class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">' + roleLabel + '</div>' +
      '<div class="text-sm font-bold text-white truncate">' + displayName + '</div>' +
      '<div class="text-[10px] text-blue-400 font-medium truncate">' + subLabel + '</div>' +
    '</div>';
}

/* ============================================================
   LOGIN FORM
   ============================================================ */

function bindLoginForm(){
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const pwdInput = document.getElementById('login-password');

  if (!form) return;

  form.setAttribute('novalidate', '');
  if (emailInput) emailInput.removeAttribute('required');
  if (pwdInput) pwdInput.removeAttribute('required');

  form.onsubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogin();
    return false;
  };

  const toggleBtn = document.getElementById('toggle-pwd');
  if (toggleBtn){
    toggleBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const pwd = document.getElementById('login-password');
      if (pwd.type === 'password'){
        pwd.type = 'text';
        toggleBtn.textContent = 'Hide';
      } else {
        pwd.type = 'password';
        toggleBtn.textContent = 'Show';
      }
    };
  }

  bindSignupForm();
  bindForgotForm();
}

/* ============================================================
   SIGNUP
   ============================================================ */

let selectedSignupRole = 'vendor';

function setRoleButton(role){
  selectedSignupRole = role;
  document.querySelectorAll('.role-btn').forEach(b => {
    const isMe = b.dataset.role === role;
    b.style.background = isMe ? '#1E4E8C' : '#F5F0E1';
    b.style.color = isMe ? '#fff' : '#000';
    b.style.border = isMe ? '1px solid #1E4E8C' : '1px solid rgba(0,0,0,0.15)';
  });
  const vendorFields = document.getElementById('signup-vendor-fields');
  if (vendorFields) vendorFields.style.display = role === 'vendor' ? 'block' : 'none';
}

function bindSignupForm(){
  const showSignup = document.getElementById('show-signup');
  const showLogin = document.getElementById('show-login');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const forgotForm = document.getElementById('forgot-form');
  const formTitle = document.getElementById('form-title');
  const formSubtitle = document.getElementById('form-subtitle');

  if (!showSignup || !signupForm) return;

  showSignup.onclick = (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    if (forgotForm) forgotForm.classList.add('hidden');
    formTitle.textContent = 'Create your account';
    formSubtitle.textContent = 'Sign up to get started. An administrator will approve your account.';
    setRoleButton('vendor');
  };

  showLogin.onclick = (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    if (forgotForm) forgotForm.classList.add('hidden');
    formTitle.textContent = 'Welcome back';
    formSubtitle.textContent = 'Sign in to access your vendor, supplier, or administrator dashboard.';
  };

  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      setRoleButton(btn.dataset.role);
    };
  });

  signupForm.onsubmit = async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('signup-error');
    const okEl = document.getElementById('signup-success');
    errEl.textContent = '';
    okEl.classList.add('hidden');

    const payload = {
      name: document.getElementById('signup-name').value.trim(),
      email: document.getElementById('signup-email').value.trim().toLowerCase(),
      password: document.getElementById('signup-password').value,
      role: selectedSignupRole,
      city: selectedSignupRole === 'vendor' ? (document.getElementById('signup-city')?.value || null) : null,
      type: selectedSignupRole === 'vendor' ? (document.getElementById('signup-type')?.value || null) : null
    };

    if (!payload.name || !payload.email || !payload.password){
      errEl.textContent = 'Please fill in all fields.';
      return;
    }
    if (payload.password.length < 6){
      errEl.textContent = 'Password must be at least 6 characters.';
      return;
    }

    const btn = document.getElementById('signup-submit');
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Creatingâ€¦';

    try {
      await API.register(payload);
      okEl.textContent = 'âœ“ Account created! An administrator will approve it shortly. You can sign in once approved.';
      okEl.classList.remove('hidden');
      signupForm.reset();
      setRoleButton('vendor');
    } catch (err){
      errEl.textContent = 'âŒ ' + err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  };
}

/* ============================================================
   FORGOT PASSWORD
   ============================================================ */

function bindForgotForm(){
  const showForgot = document.getElementById('show-forgot');
  const forgotBack = document.getElementById('forgot-back');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const forgotForm = document.getElementById('forgot-form');
  const formTitle = document.getElementById('form-title');
  const formSubtitle = document.getElementById('form-subtitle');

  if (!showForgot || !forgotForm) return;

  showForgot.onclick = (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    forgotForm.classList.remove('hidden');
    formTitle.textContent = 'Reset your password';
    formSubtitle.textContent = "Enter your email and we'll generate a reset code.";
    document.getElementById('forgot-step-1').classList.remove('hidden');
    document.getElementById('forgot-step-2').classList.add('hidden');
    document.getElementById('forgot-error').textContent = '';
    document.getElementById('forgot-success').classList.add('hidden');
    document.getElementById('forgot-email').value = '';
    document.getElementById('forgot-code').value = '';
    document.getElementById('forgot-newpass').value = '';
  };

  forgotBack.onclick = (e) => {
    e.preventDefault();
    forgotForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    formTitle.textContent = 'Welcome back';
    formSubtitle.textContent = 'Sign in to access your vendor, supplier, or administrator dashboard.';
  };

  document.getElementById('forgot-request').onclick = async () => {
    const errEl = document.getElementById('forgot-error');
    const okEl = document.getElementById('forgot-success');
    errEl.textContent = '';
    okEl.classList.add('hidden');
    const email = document.getElementById('forgot-email').value.trim().toLowerCase();
    if (!email){ errEl.textContent = 'Please enter your email.'; return; }

    try {
      const res = await API.forgotPassword(email);
      document.getElementById('forgot-code-display').textContent = res.code || '------';
      document.getElementById('forgot-step-1').classList.add('hidden');
      document.getElementById('forgot-step-2').classList.remove('hidden');
      okEl.textContent = 'âœ“ Code generated. See the demo code above.';
      okEl.classList.remove('hidden');
    } catch (err){
      errEl.textContent = 'âŒ ' + err.message;
    }
  };

  document.getElementById('forgot-submit').onclick = async () => {
    const errEl = document.getElementById('forgot-error');
    const okEl = document.getElementById('forgot-success');
    errEl.textContent = '';
    okEl.classList.add('hidden');
    const email = document.getElementById('forgot-email').value.trim().toLowerCase();
    const code = document.getElementById('forgot-code').value.trim();
    const newPassword = document.getElementById('forgot-newpass').value;

    if (!code || code.length !== 6){ errEl.textContent = 'Enter the 6-digit code.'; return; }
    if (!newPassword || newPassword.length < 6){ errEl.textContent = 'New password must be at least 6 characters.'; return; }

    try {
      await API.resetPassword(email, code, newPassword);
      okEl.textContent = 'âœ“ Password updated! Redirecting to sign inâ€¦';
      okEl.classList.remove('hidden');
      setTimeout(() => {
        document.getElementById('forgot-back').click();
      }, 1500);
    } catch (err){
      errEl.textContent = 'âŒ ' + err.message;
    }
  };
}

/* ============================================================
   LOGIN HANDLER
   ============================================================ */

async function handleLogin(){
  if (isLoggingIn) return;
  isLoggingIn = true;

  const emailEl = document.getElementById('login-email');
  const passwordEl = document.getElementById('login-password');
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('submit-btn');

  if (emailEl) { emailEl.setCustomValidity(''); emailEl.removeAttribute('required'); }
  if (passwordEl) { passwordEl.setCustomValidity(''); passwordEl.removeAttribute('required'); }

  const email = (emailEl.value || '').trim().toLowerCase();
  const password = passwordEl.value || '';

  errorEl.textContent = '';

  if (!email || !password){
    errorEl.textContent = 'Please enter both email and password.';
    isLoggingIn = false;
    return;
  }

  const originalHTML = btn ? btn.innerHTML : '';
  if (btn){
    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg><span>Verifyingâ€¦</span>';
  }

  try {
    const { token, user } = await API.login(email, password);
    API.setToken(token);

    session.role = user.role;
    session.supplierId = user.supplierId || null;
    session.vendorId = user.vendorId || null;
    session.user = user;

    showAppShell();
    buildNavFor(user.role);
    renderSidebarUser();
    renderSessionBar();
    showTab(ROLE_TABS[user.role][0].id);
    isLoggingIn = false;
  } catch (err){
    errorEl.textContent = 'âŒ ' + (err.message || 'Login failed');
    if (btn){
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
    isLoggingIn = false;
  }
}

/* ============================================================
   LOGOUT
   ============================================================ */

function logout(){
  session.role = null;
  session.supplierId = null;
  session.vendorId = null;
  session.user = null;
  API.setToken(null);

  const pwd = document.getElementById('login-password');
  if (pwd) pwd.value = '';
  const err = document.getElementById('login-error');
  if (err) err.textContent = '';
  const btn = document.getElementById('submit-btn');
  if (btn){
    btn.disabled = false;
    btn.innerHTML = '<span>Sign in to Dashboard</span>';
  }

  showLoginScreen();
}

/* ============================================================
   SESSION BAR
   ============================================================ */

function renderSessionBar(){
  const labels = { vendor:'Vendor', supplier:'Supplier', admin:'Administrator' };
  let extra = '';

  if (session.role === 'supplier'){
    extra = '<select id="supplier-switch" class="text-xs px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg cursor-pointer font-semibold">' +
      DATA.suppliers.map(s => '<option value="' + s.id + '"' + (s.id===session.supplierId?' selected':'') + '>' + s.name + '</option>').join('') +
      '</select>';
  }

  if (session.role === 'admin'){
    const topVendors = (DATA.vendors || []).slice(0, 30);
    extra = '<select id="vendor-switch" class="text-xs px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg cursor-pointer font-semibold">' +
      '<option value="">â€” Preview a vendor â€”</option>' +
      topVendors.map(v => '<option value="' + v.id + '"' + (v.id===session.vendorId?' selected':'') + '>' + v.id + ' Â· ' + v.city + '</option>').join('') +
      '</select>';
  }

  sessionBar.innerHTML =
    '<span class="text-xs font-semibold px-3 py-2 rounded-lg" style="background:rgba(30,78,140,0.15); color:#2E6FBF; border:1px solid rgba(30,78,140,0.25);">Signed in â€” ' + labels[session.role] + '</span>' +
    extra +
    '<button id="logout-btn" type="button" class="text-xs font-semibold px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg transition-all">Sign out</button>';

  document.getElementById('logout-btn').onclick = (e) => {
    e.preventDefault();
    logout();
  };

  if (session.role === 'supplier'){
    const switcher = document.getElementById('supplier-switch');
    if (switcher){
      switcher.onchange = (e) => {
        session.supplierId = e.target.value;
        ['sup-overview','sup-products','sup-discounts','sup-demand'].forEach(id => renderedTabs.delete(id));
        renderSidebarUser();
        const activeBtn = document.querySelector('#sidebar-nav button.active');
        if (activeBtn) showTab(activeBtn.dataset.tab);
      };
    }
  }

  if (session.role === 'admin'){
    const vSwitcher = document.getElementById('vendor-switch');
    if (vSwitcher){
      vSwitcher.onchange = (e) => {
        session.vendorId = e.target.value || null;
        const activeBtn = document.querySelector('#sidebar-nav button.active');
        if (activeBtn) showTab(activeBtn.dataset.tab);
      };
    }
  }
}

/* ============================================================
   INIT
   ============================================================ */

/* ============================================================
   GLOBAL SEARCH
   ============================================================ */

let searchTimer = null;

function initGlobalSearch(){
  const input = document.getElementById('global-search-input');
  const results = document.getElementById('global-search-results');
  if (!input || !results) return;

  function hideResults(){ results.style.display = 'none'; }

  function renderResults(data){
    if (!data.products.length && !data.suppliers.length){
      results.innerHTML = '<div style="padding:20px; text-align:center; color:#6B6B6B; font-size:13px;">No matches found</div>';
      results.style.display = 'block';
      return;
    }

    let html = '';

    if (data.products.length){
      html += '<div style="padding:10px 14px; font-size:10.5px; font-weight:700; color:#6B6B6B; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(0,0,0,0.06);">Products</div>';
      html += data.products.map(p =>
        '<div class="search-result-row" data-type="product" data-id="' + p.id + '" style="padding:10px 14px; cursor:pointer; border-bottom:1px solid rgba(0,0,0,0.04); display:flex; justify-content:space-between; align-items:center;">' +
          '<div>' +
            '<div style="font-weight:600; color:#000; font-size:13.5px;">' + p.name + '</div>' +
            '<div style="font-size:11px; color:#6B6B6B; margin-top:2px;">' + p.category + ' · ' + p.id + '</div>' +
          '</div>' +
          '<div style="font-weight:600; color:#1E4E8C; font-size:13px;">' + fmtR(p.unit_price) + '</div>' +
        '</div>'
      ).join('');
    }

    if (data.suppliers.length){
      html += '<div style="padding:10px 14px; font-size:10.5px; font-weight:700; color:#6B6B6B; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(0,0,0,0.06); margin-top:4px;">Suppliers</div>';
      html += data.suppliers.map(s =>
        '<div class="search-result-row" data-type="supplier" data-id="' + s.id + '" style="padding:10px 14px; cursor:pointer; border-bottom:1px solid rgba(0,0,0,0.04); display:flex; justify-content:space-between; align-items:center;">' +
          '<div>' +
            '<div style="font-weight:600; color:#000; font-size:13.5px;">' + s.name + '</div>' +
            '<div style="font-size:11px; color:#6B6B6B; margin-top:2px;">' + s.city + ' · ' + s.category + '</div>' +
          '</div>' +
          '<div style="font-weight:600; color:#D89A2E; font-size:12px;">★ ' + s.rating.toFixed(1) + '</div>' +
        '</div>'
      ).join('');
    }

    results.innerHTML = html;
    results.style.display = 'block';

    results.querySelectorAll('.search-result-row').forEach(row => {
      row.onmouseenter = () => row.style.background = '#F1EAD5';
      row.onmouseleave = () => row.style.background = 'transparent';
      row.onclick = () => {
        const type = row.dataset.type;
        if (type === 'product'){
          if (session.role === 'vendor') showTab('predictions');
          else if (session.role === 'supplier') showTab('sup-products');
          else showTab('adm-data');
        } else if (type === 'supplier'){
          if (session.role === 'vendor') showTab('suppliers');
          else if (session.role === 'supplier') showTab('sup-overview');
          else showTab('adm-suppliers');
        }
        hideResults();
        input.value = '';
      };
    });
  }

  input.oninput = () => {
    const q = input.value.trim();
    clearTimeout(searchTimer);
    if (q.length < 2){ hideResults(); return; }
    searchTimer = setTimeout(async () => {
      try {
        const data = await API.search(q);
        renderResults(data);
      } catch (e){
        console.error('Search failed', e);
      }
    }, 250);
  };

  input.onfocus = () => {
    if (input.value.trim().length >= 2 && results.innerHTML) results.style.display = 'block';
  };

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#global-search-input') && !e.target.closest('#global-search-results')){
      hideResults();
    }
  });

  input.onkeydown = (e) => {
    if (e.key === 'Escape'){ hideResults(); input.blur(); }
  };
}

/* ============================================================
   INIT
   ============================================================ */

showLoginScreen();
initGlobalSearch();
