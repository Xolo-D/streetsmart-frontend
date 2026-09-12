// js/login.js
const ROLE_TABS = {
  vendor: [
    {id:'overview', label:'Overview', icon:'overview'},
    {id:'sales', label:'Sales', icon:'sales'},
    {id:'forecast', label:'Demand forecast', icon:'forecast'},
    {id:'predictions', label:'AI Predictions', icon:'forecast'},
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
    {id:'adm-data', label:'System data', icon:'inventory'},
    {id:'adm-reports', label:'Reports', icon:'forecast'}
  ]
};

const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const sidebarNav = document.getElementById('sidebar-nav');
const sidebarUser = document.getElementById('sidebar-user');
const viewsEl = document.getElementById('views');
const sessionBar = document.getElementById('session-bar');
const pageTitle = document.getElementById('page-title');

const session = { role:null, supplierId:null, user:null };
const renderedTabs = new Set();

/* ============ SHOW / HIDE SCREENS ============ */

function showLoginScreen(){
  loginScreen.classList.remove('hidden');
  appShell.classList.add('hidden');
  sidebarNav.innerHTML = '';
  sidebarUser.innerHTML = '';
  viewsEl.innerHTML = '';
  sessionBar.innerHTML = '';
  if (pageTitle) pageTitle.innerHTML = '';
}

function showAppShell(){
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
}

/* ============ TAB HANDLING ============ */

function showTab(id){
  document.querySelectorAll('#sidebar-nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  document.querySelectorAll('#views section.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + id));

  const tab = ROLE_TABS[session.role].find(t => t.id === id);
  if (tab && pageTitle){
    pageTitle.innerHTML = '<h1 class="text-2xl text-white display">' + tab.label + '</h1><p class="text-xs text-slate-500">Everything here</p>';
  }

  if (!renderedTabs.has(id)){ renderedTabs.add(id); RENDER[id](); }
}

function buildNavFor(role){
  sidebarNav.innerHTML = '';
  viewsEl.innerHTML = '';
  renderedTabs.clear();
  ROLE_TABS[role].forEach(t => {
    const btn = document.createElement('button');
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

  // Add active-state styling
  const style = document.createElement('style');
  style.textContent = `
    #sidebar-nav button.active {
      background: linear-gradient(135deg, rgba(59,130,246,0.20) 0%, rgba(6,182,212,0.12) 100%) !important;
      color: #93C5FD !important;
      box-shadow: inset 3px 0 0 #3B82F6;
    }
    #views section.view { display: none; }
    #views section.view.active { display: block; animation: fadein 0.3s ease; }
    @keyframes fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  `;
  if (!document.getElementById('dynamic-tab-styles')){
    style.id = 'dynamic-tab-styles';
    document.head.appendChild(style);
  }
}

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

/* ============ SIDEBAR USER CARD ============ */

function renderSidebarUser(){
  if (!session.user) { sidebarUser.innerHTML = ''; return; }
  const name = session.user.name || session.user.email || '?';
  const initials = name.split(/[\s@.]/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('') || '?';
  const roleLabel = { vendor: 'Vendor', supplier: 'Supplier', admin: 'Administrator' }[session.role];
  sidebarUser.innerHTML =
    '<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">' + initials + '</div>' +
    '<div class="overflow-hidden">' +
      '<div class="text-[11px] text-slate-500 font-medium">Hello,</div>' +
      '<div class="text-sm font-bold text-white truncate">' + name + '</div>' +
      '<div class="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">' + roleLabel + '</div>' +
    '</div>';
}

/* ============ LOGIN HANDLERS ============ */

async function handleLogin(event){
  if (event) event.preventDefault();
  const emailEl = document.getElementById('login-email');
  const passwordEl = document.getElementById('login-password');
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('submit-btn');

  const email = emailEl.value.trim().toLowerCase();
  const password = passwordEl.value;

  errorEl.textContent = '';

  if (!email || !password){
    errorEl.textContent = 'Please enter both email and password.';
    return;
  }

  // Show spinner
  btn.disabled = true;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg><span>Verifying…</span>';

  try {
    const { token, user } = await API.login(email, password);
    API.setToken(token);

    // Reveal app shell
    session.role = user.role;
    session.supplierId = user.supplierId || null;
    session.user = user;

    showAppShell();
    buildNavFor(user.role);
    renderSidebarUser();
    renderSessionBar();
    showTab(ROLE_TABS[user.role][0].id);
  } catch (err){
    errorEl.textContent = '❌ ' + err.message;
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

function logout(){
  const lastEmail = session.user ? session.user.email : '';
  session.role = null;
  session.supplierId = null;
  session.user = null;
  API.setToken(null);
  showLoginScreen();
  const emailEl = document.getElementById('login-email');
  if (emailEl && lastEmail) emailEl.value = lastEmail;
  const pwd = document.getElementById('login-password');
  if (pwd) pwd.value = '';
  const err = document.getElementById('login-error');
  if (err) err.textContent = '';
}

/* ============ SESSION BAR ============ */

function renderSessionBar(){
  const labels = { vendor:'Vendor', supplier:'Supplier', admin:'Administrator' };
  let extra = '';
  if (session.role === 'supplier'){
    extra = '<select id="supplier-switch" class="text-xs px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg cursor-pointer font-semibold">' +
      DATA.suppliers.map(s => '<option value="' + s.id + '"' + (s.id===session.supplierId?' selected':'') + '>' + s.name + '</option>').join('') +
      '</select>';
  }
  sessionBar.innerHTML =
    '<span class="text-xs font-semibold px-3 py-2 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/25">Signed in — ' + labels[session.role] + '</span>' +
    extra +
    '<button id="logout-btn" class="text-xs font-semibold px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg transition-all">Sign out</button>';

  document.getElementById('logout-btn').onclick = logout;
  if (session.role === 'supplier'){
    document.getElementById('supplier-switch').onchange = (e) => {
      session.supplierId = e.target.value;
      ['sup-overview','sup-products','sup-discounts','sup-demand'].forEach(id => renderedTabs.delete(id));
      const active = document.querySelector('#sidebar-nav button.active').dataset.tab;
      showTab(active);
    };
  }
}

/* ============ INIT (page load) ============ */

function initLoginScreen(){
  // Password toggle
  const toggleBtn = document.getElementById('toggle-pwd');
  if (toggleBtn){
    toggleBtn.onclick = () => {
      const pwd = document.getElementById('login-password');
      if (pwd.type === 'password'){ pwd.type = 'text'; toggleBtn.textContent = 'Hide'; }
      else { pwd.type = 'password'; toggleBtn.textContent = 'Show'; }
    };
  }

  // Demo autofill
  document.querySelectorAll('.demo-fill').forEach(btn => {
    btn.onclick = () => {
      document.getElementById('login-email').value = btn.dataset.email;
      document.getElementById('login-password').value = btn.dataset.pass;
      document.getElementById('login-error').textContent = '';
    };
  });
}

// On page load, we're at the login screen
showLoginScreen();
initLoginScreen();