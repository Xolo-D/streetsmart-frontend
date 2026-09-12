// js/admin-views.js

function renderAdminOverview(){
  const el = document.getElementById('view-adm-overview');
  const k = DATA.kpis;
  el.innerHTML = '<div class="hero"><div class="hero-figure"><div class="label">Network-wide revenue, ' + k.date_start + ' — ' + k.date_end + '</div><div class="num display"><span class="unit">R</span>' + (k.total_revenue/1000000).toFixed(2) + '<span class="unit" style="font-size:32px;color:var(--ink);margin-left:4px;">M</span></div></div><div class="hero-sub">' + k.num_vendors + ' vendor accounts and ' + DATA.suppliers.length + ' supplier accounts under management across ' + k.num_cities + ' cities.</div></div>'
    + '<div class="kpi-row"><div class="kpi"><div class="v">' + k.num_vendors + '</div><div class="l">Vendor accounts</div></div><div class="kpi"><div class="v">' + DATA.suppliers.length + '</div><div class="l">Supplier accounts</div></div><div class="kpi"><div class="v">' + k.num_products + '</div><div class="l">SKUs in catalogue</div></div><div class="kpi"><div class="v">' + DATA.model_perf.r2 + '</div><div class="l">Forecast model R²</div></div><div class="kpi"><div class="v">' + fmtNum(k.total_transactions) + '</div><div class="l">Transactions logged</div></div></div>'
    + '<div class="grid grid-2" style="margin-top:24px;"><div class="panel"><h2>Vendor accounts by city</h2><p class="sub">Where the registered vendor base is concentrated.</p><div class="chart-wrap" style="height:280px;"><canvas id="chart-adm-vendorcity"></canvas></div></div><div class="panel"><h2>Vendor accounts by type</h2><p class="sub">Mix of stall types across the network.</p><div class="chart-wrap" style="height:280px;"><canvas id="chart-adm-vendortype"></canvas></div></div></div>';
  new Chart(document.getElementById('chart-adm-vendorcity'), {
    type:'bar',
    data:{ labels: DATA.vendors_by_city.map(c=>c.city), datasets:[{data: DATA.vendors_by_city.map(c=>c.count), backgroundColor: INDIGO, borderColor: INK, borderWidth:1}] },
    options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{color:LINE}}, y:{grid:{display:false}} } }
  });
  const palette = Object.values(CAT_HEX);
  new Chart(document.getElementById('chart-adm-vendortype'), {
    type:'doughnut',
    data:{ labels: DATA.vendors_by_type.map(c=>c.type), datasets:[{data: DATA.vendors_by_type.map(c=>c.count), backgroundColor: DATA.vendors_by_type.map((c,i)=>palette[i%palette.length]), borderColor:'#FBF8EF', borderWidth:2}] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'58%', plugins:{legend:{position:'bottom', labels:{boxWidth:10,padding:8,color:'#6B675C'}}} }
  });
}

let vendorSearch = '';
function renderAdminVendors(){
  const el = document.getElementById('view-adm-vendors');
  el.innerHTML =
    '<div class="panel">'
    + '<h2>Manage vendors</h2>'
    + '<p class="sub">' + DATA.vendors.length + ' vendor accounts, ranked by revenue. Search by vendor ID or city.</p>'
    + '<div class="filter-row">'
    +   '<button id="add-vendor-btn" class="filter-btn active" style="background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border:none;font-weight:700;padding:10px 20px;">➕ Add vendor</button>'
    +   '<input id="vendor-search" type="text" placeholder="Search vendor ID or city…" class="filter-btn" style="cursor:text; min-width:220px; text-align:left;">'
    + '</div>'
    + '<div class="table-scroll">'
    + '<table><thead><tr><th>Vendor</th><th>City</th><th>Type</th><th class="num">Revenue</th><th class="num">Transactions</th><th class="num">SKUs sold</th><th>Actions</th></tr></thead>'
    + '<tbody id="adm-vendors-body"></tbody></table>'
    + '</div></div>';

  const input = document.getElementById('vendor-search');
  input.value = vendorSearch;
  input.oninput = (e) => { vendorSearch = e.target.value; renderVendorRows(); };

  document.getElementById('add-vendor-btn').onclick = openAddVendorModal;

  renderVendorRows();
}

function renderVendorRows(){
  const body = document.getElementById('adm-vendors-body');
  if (!body) return;
  const q = vendorSearch.trim().toLowerCase();
  const filtered = DATA.vendors.filter(v => !q || v.id.toLowerCase().indexOf(q) !== -1 || v.city.toLowerCase().indexOf(q) !== -1);
  const rows = filtered.slice(0, 100);

  body.innerHTML = rows.map(v =>
    '<tr>'
    + '<td class="name-cell">' + v.id + '</td>'
    + '<td>' + v.city + '</td>'
    + '<td>' + v.type + '</td>'
    + '<td class="num">' + fmtR(v.revenue) + '</td>'
    + '<td class="num">' + v.transactions + '</td>'
    + '<td class="num">' + v.products + '</td>'
    + '<td style="display:flex;gap:6px;">'
    +   '<button class="filter-btn edit-vendor-btn" data-id="' + v.id + '">Edit</button>'
    +   '<button class="filter-btn delete-vendor-btn" data-id="' + v.id + '" style="color:var(--danger);">Delete</button>'
    + '</td>'
    + '</tr>'
  ).join('')
  + (filtered.length > 100 ? '<tr><td colspan="7" class="sub-cell" style="padding:14px 10px;">Showing first 100 matches — refine your search to narrow further.</td></tr>' : '');

  body.querySelectorAll('.edit-vendor-btn').forEach(btn => {
    btn.onclick = () => openEditVendorModal(btn.dataset.id);
  });
  body.querySelectorAll('.delete-vendor-btn').forEach(btn => {
    btn.onclick = () => deleteVendor(btn.dataset.id);
  });
}

/* ==================== ADD / EDIT VENDOR MODAL ==================== */

function openAddVendorModal(){
  showVendorModal(null);
}

function openEditVendorModal(id){
  const vendor = DATA.vendors.find(v => v.id === id);
  if (!vendor){
    alert('❌ Vendor not found');
    return;
  }
  showVendorModal(vendor);
}

function showVendorModal(vendor){
  const isEdit = !!vendor;
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(10,22,40,0.75); z-index:9999;
    display:flex; align-items:center; justify-content:center; padding:20px;
    backdrop-filter: blur(4px);
  `;

  const cities = (DATA.cities || []).map(c => c.city);
  const types = ['Food Vendor', 'Drink Vendor', 'Snack Vendor', 'Sweet Vendor', 'General Vendor', 'Accessory Vendor', 'Fruit Vendor'];

  const cityOptions = cities.map(c =>
    `<option value="${c}" ${vendor && vendor.city === c ? 'selected' : ''}>${c}</option>`
  ).join('');
  const typeOptions = types.map(t =>
    `<option value="${t}" ${vendor && vendor.type === t ? 'selected' : ''}>${t}</option>`
  ).join('');

  overlay.innerHTML = `
    <div style="background:var(--panel); border:1px solid var(--line-2); border-radius:20px; max-width:600px; width:100%; padding:32px; box-shadow:var(--shadow-lg); max-height:90vh; overflow-y:auto;">
      <h2 style="font-family:'Space Grotesk'; font-size:22px; margin:0 0 6px; color:var(--ink);">${isEdit ? 'Edit vendor' : 'Add new vendor'}</h2>
      <p style="font-size:13px; color:var(--muted); margin:0 0 24px;">${isEdit ? 'Update vendor account information.' : 'Create a new vendor account.'}</p>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Vendor ID</label>
          <input id="v-id" value="${vendor ? vendor.id : ''}" ${isEdit ? 'disabled' : ''} placeholder="V0301" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; ${isEdit ? 'opacity:0.6;' : ''}">
        </div>
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">City</label>
          <select id="v-city" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
            ${cityOptions}
          </select>
        </div>
      </div>

      <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Type</label>
      <select id="v-type" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; margin-bottom:16px;">
        ${typeOptions}
      </select>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Revenue (R)</label>
          <input id="v-revenue" type="number" step="0.01" value="${vendor ? vendor.revenue : ''}" placeholder="0.00" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Profit (R)</label>
          <input id="v-profit" type="number" step="0.01" value="${vendor ? vendor.profit : ''}" placeholder="0.00" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:20px;">
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Units sold</label>
          <input id="v-units" type="number" value="${vendor ? vendor.units : ''}" placeholder="0" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Transactions</label>
          <input id="v-transactions" type="number" value="${vendor ? vendor.transactions : ''}" placeholder="0" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">SKUs sold</label>
          <input id="v-products" type="number" value="${vendor ? vendor.products : ''}" placeholder="0" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
      </div>

      <div id="v-error" style="color:var(--danger); font-size:13px; min-height:18px; margin-bottom:14px;"></div>

      <div style="display:flex; gap:10px;">
        <button id="v-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button>
        <button id="v-submit" style="flex:2; padding:12px; background:linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%); color:#fff; border:none; border-radius:10px; font-family:'Inter'; font-weight:700; font-size:14px; cursor:pointer;">
          ${isEdit ? 'Save changes' : 'Create vendor'}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#v-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#v-submit').onclick = async () => {
    const errorEl = overlay.querySelector('#v-error');
    errorEl.textContent = '';

    const payload = {
      id: overlay.querySelector('#v-id').value.trim(),
      city: overlay.querySelector('#v-city').value,
      type: overlay.querySelector('#v-type').value,
      revenue: parseFloat(overlay.querySelector('#v-revenue').value) || 0,
      profit: parseFloat(overlay.querySelector('#v-profit').value) || 0,
      units: parseInt(overlay.querySelector('#v-units').value) || 0,
      transactions: parseInt(overlay.querySelector('#v-transactions').value) || 0,
      products: parseInt(overlay.querySelector('#v-products').value) || 0
    };

    if (!payload.id || !payload.city || !payload.type){
      errorEl.textContent = '❌ ID, city, and type are required.';
      return;
    }

    try {
      if (isEdit){
        const res = await API.updateVendor(vendor.id, payload);
        Object.assign(vendor, res.vendor);
        alert(`✅ Vendor ${vendor.id} updated`);
      } else {
        const res = await API.addVendor(payload);
        DATA.vendors.unshift(res.vendor);
        alert(`✅ Vendor ${payload.id} created`);
      }
      overlay.remove();
      renderAdminVendors();
    } catch (err){
      errorEl.textContent = '❌ ' + err.message;
    }
  };
}

async function deleteVendor(id){
  const vendor = DATA.vendors.find(v => v.id === id);
  if (!vendor) return;
  if (!confirm(`Delete vendor ${id} (${vendor.city})? This cannot be undone.`)) return;

  try {
    await API.deleteVendor(id);
    DATA.vendors = DATA.vendors.filter(v => v.id !== id);
    alert(`✅ Vendor ${id} deleted`);
    renderAdminVendors();
  } catch (err){
    alert('❌ ' + err.message);
  }
}

/* ==================== MANAGE SUPPLIERS (Admin) ==================== */

function renderAdminSuppliers(){
  const el = document.getElementById('view-adm-suppliers');
  el.innerHTML = '<div class="panel"><h2>Manage suppliers</h2><p class="sub">' + DATA.suppliers.length + ' active suppliers across the network.</p><div class="table-scroll" style="max-height:460px;"><table><thead><tr><th>Supplier</th><th>City</th><th>Category</th><th class="num">Rating</th><th class="num">On-time %</th><th>Status</th><th></th></tr></thead><tbody>'
    + DATA.suppliers.map(s => '<tr><td class="name-cell">' + s.name + '</td><td>' + s.city + '</td><td>' + s.category + '</td><td class="num">' + s.rating.toFixed(1) + '</td><td class="num">' + s.on_time + '%</td><td><span class="chip ' + (s.status==='Preferred'?'low':s.status==='Reliable'?'medium':'soon') + '">' + s.status + '</span></td><td><button class="filter-btn" onclick="alert(\'Supplier account management is available via the Supplier role.\')">View</button></td></tr>').join('')
    + '</tbody></table></div></div>';
}

/* ==================== MANAGE SYSTEM DATA ==================== */

function renderAdminData(){
  const el = document.getElementById('view-adm-data');
  const allProducts = DATA.reorder_all || [];

  el.innerHTML =
    '<div class="panel">' +
      '<h2>System data</h2>' +
      '<p class="sub">The datasets currently powering StreetSmart. Click any row to edit inline.</p>' +
      '<div class="filter-row">' +
        '<button id="data-tab-cities" class="filter-btn active">Cities (' + (DATA.cities || []).length + ')</button>' +
        '<button id="data-tab-categories" class="filter-btn">Categories (' + (DATA.categories || []).length + ')</button>' +
        '<button id="data-tab-suppliers" class="filter-btn">Suppliers (' + DATA.suppliers.length + ')</button>' +
      '</div>' +
      '<div id="data-content"></div>' +
    '</div>';

  let activeTab = 'cities';

  function renderTab(){
    const content = document.getElementById('data-content');

    if (activeTab === 'cities'){
      content.innerHTML =
        '<div class="filter-row"><button id="add-city-btn" class="filter-btn active" style="padding:8px 16px;">➕ Add city</button></div>' +
        '<table><thead><tr><th>City</th><th>Vendors</th><th>Revenue</th><th></th></tr></thead><tbody>' +
        (DATA.cities || []).map(c => {
          const vendorCount = (DATA.vendors || []).filter(v => v.city === c.city).length;
          return '<tr>' +
            '<td class="name-cell">' + c.city + '</td>' +
            '<td class="num">' + vendorCount + '</td>' +
            '<td class="num">' + fmtR(c.revenue || 0) + '</td>' +
            '<td><button class="filter-btn" onclick="alert(\'City editing is a demo feature.\')">Edit</button></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>';
      document.getElementById('add-city-btn').onclick = () => alert('✅ City added (demo). In production this would POST to the backend.');
    }

    if (activeTab === 'categories'){
      content.innerHTML =
        '<div class="filter-row"><button id="add-cat-btn" class="filter-btn active" style="padding:8px 16px;">➕ Add category</button></div>' +
        '<table><thead><tr><th>Category</th><th>Products</th><th>Revenue</th><th></th></tr></thead><tbody>' +
        (DATA.categories || []).map(c => {
          const productCount = allProducts.filter(p => p.category === c.category).length;
          return '<tr>' +
            '<td class="name-cell"><span class="swatch" style="background:' + (CAT_HEX[c.category] || '#999') + '"></span> ' + c.category + '</td>' +
            '<td class="num">' + productCount + '</td>' +
            '<td class="num">' + fmtR(c.revenue || 0) + '</td>' +
            '<td><button class="filter-btn" onclick="alert(\'Category editing is a demo feature.\')">Edit</button></td>' +
          '</tr>';
        }).join('') +
        '</tbody></table>';
      document.getElementById('add-cat-btn').onclick = () => alert('✅ Category added (demo).');
    }

    if (activeTab === 'suppliers'){
      content.innerHTML =
        '<table><thead><tr><th>Supplier</th><th>City</th><th>Lead time</th><th>Status</th><th></th></tr></thead><tbody>' +
        DATA.suppliers.map(s =>
          '<tr>' +
            '<td class="name-cell">' + s.name + '</td>' +
            '<td>' + s.city + '</td>' +
            '<td class="num">' + s.lead_time + 'd</td>' +
            '<td><span class="chip ' + (s.status==='Preferred'?'low':s.status==='Reliable'?'medium':'soon') + '">' + s.status + '</span></td>' +
            '<td><button class="filter-btn" onclick="alert(\'Supplier editing is available via the Supplier role.\')">View</button></td>' +
          '</tr>'
        ).join('') +
        '</tbody></table>';
    }
  }

  function setTab(t){
    activeTab = t;
    ['cities','categories','suppliers'].forEach(k => {
      document.getElementById('data-tab-' + k).classList.toggle('active', k === t);
    });
    renderTab();
  }

  document.getElementById('data-tab-cities').onclick = () => setTab('cities');
  document.getElementById('data-tab-categories').onclick = () => setTab('categories');
  document.getElementById('data-tab-suppliers').onclick = () => setTab('suppliers');

  renderTab();
}

/* ==================== VIEW REPORTS ==================== */

function renderAdminReports(){
  const el = document.getElementById('view-adm-reports');
  const mp = DATA.model_perf;
  el.innerHTML = '<div class="grid grid-2"><div class="panel"><h2>Revenue by month, network-wide</h2><p class="sub">All vendors, all cities.</p><div class="chart-wrap" style="height:280px;"><canvas id="chart-rep-monthly"></canvas></div></div><div class="panel"><h2>Revenue by category</h2><p class="sub">Full catalogue performance.</p><div class="chart-wrap" style="height:280px;"><canvas id="chart-rep-category"></canvas></div></div></div>'
    + '<div class="panel"><h2>Forecast model summary</h2><p class="sub">Current XGBoost demand model in production.</p><div class="stat-strip"><div class="cell"><div class="v">' + mp.r2 + '</div><div class="l">R² score</div></div><div class="cell"><div class="v">' + mp.mae + '</div><div class="l">MAE (units)</div></div><div class="cell"><div class="v">' + mp.rmse + '</div><div class="l">RMSE (units)</div></div><div class="cell"><div class="v">' + mp.mape + '%</div><div class="l">MAPE</div></div></div></div>'
    + '<div class="panel"><h2>Top 10 vendors by revenue</h2><p class="sub">Highest-performing accounts network-wide.</p><table><thead><tr><th>Vendor</th><th>City</th><th class="num">Revenue</th><th class="num">Transactions</th></tr></thead><tbody>'
    + DATA.vendors.slice(0,10).map(v => '<tr><td class="name-cell">' + v.id + '</td><td>' + v.city + '</td><td class="num">' + fmtR(v.revenue) + '</td><td class="num">' + v.transactions + '</td></tr>').join('')
    + '</tbody></table></div>';
  new Chart(document.getElementById('chart-rep-monthly'), {type:'line',data:{labels: DATA.monthly.map(m=>m.month), datasets:[{label:'Revenue', data: DATA.monthly.map(m=>m.revenue), borderColor:VERM, backgroundColor:'rgba(196,67,43,0.15)', fill:true, tension:0.25, pointRadius:3, borderWidth:2.5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:LINE}},x:{grid:{display:false}}}}});
  new Chart(document.getElementById('chart-rep-category'), {type:'bar',data:{labels: DATA.categories.map(c=>c.category), datasets:[{data: DATA.categories.map(c=>c.revenue), backgroundColor: DATA.categories.map(c=>CAT_HEX[c.category]), borderColor: INK, borderWidth:1}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:LINE},ticks:{callback:v=>fmtR(v)}},y:{grid:{display:false}}}}});
}