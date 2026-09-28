/* ==================== SUPPLIER MODE HELPER ==================== */
function isDemoSupplier(){
  return localStorage.getItem('ss_mode') === 'demo';
}
// js/supplier-views.js

/* ==================== HELPERS ==================== */

function currentSupplier(){
  const fromDemo = (DATA.suppliers || []).find(s => s.id === session.supplierId);
  if (fromDemo) return fromDemo;
  return {
    id: session.supplierId || 'â€”',
    name: (session.user && session.user.name) || 'Supplier',
    city: (session.user && session.user.city) || 'Unknown',
    rating: 0,
    lead_time: 3,
    status: 'Active',
    on_time: 0,
    quality: 0,
    category: (session.user && session.user.type) || 'General'
  };
}

/* ==================== OVERVIEW ==================== */

async function renderSupplierOverview(){
  const el = document.getElementById('view-sup-overview');
  el.innerHTML = '<div class="panel"><p class="sub">Loading your supplier infoâ€¦</p></div>';

  const s = currentSupplier();
  let myProducts = [];
  try { myProducts = await API.mySupplierProducts(); } catch (e){ myProducts = []; }

  const productCount = myProducts.length;
  const catalogValue = myProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.moq || 0)), 0);
  const avgLead = myProducts.length > 0
    ? (myProducts.reduce((sum, p) => sum + (p.lead_time || s.lead_time || 3), 0) / myProducts.length).toFixed(1)
    : (s.lead_time || 3);

  el.innerHTML =
    '<div class="hero">' +
      '<div class="hero-figure">' +
        '<div class="label">Supplier rating</div>' +
        '<div class="num display">' + s.rating.toFixed(1) + '<span class="unit" style="font-size:28px;color:var(--ink);margin-left:6px;">/5</span></div>' +
      '</div>' +
      '<div class="hero-sub">' + s.name + ', based in ' + s.city + '. Default lead time ' + (s.lead_time || 3) + ' day' + (s.lead_time === 1 ? '' : 's') + '. Status: ' + s.status + '.</div>' +
    '</div>' +

    '<div class="kpi-row">' +
      '<div class="kpi"><div class="v">' + productCount + '</div><div class="l">Products you supply</div></div>' +
      '<div class="kpi"><div class="v">' + fmtR(catalogValue) + '</div><div class="l">Catalog value (price Ã— MOQ)</div></div>' +
      '<div class="kpi"><div class="v">' + avgLead + 'd</div><div class="l">Average lead time</div></div>' +
      '<div class="kpi"><div class="v">' + s.quality + '</div><div class="l">Quality score</div></div>' +
    '</div>' +

    '<div class="panel" style="margin-top:24px;">' +
      '<div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px;">' +
        '<div>' +
          '<h2>Your supplier profile</h2>' +
          '<p class="sub" style="margin:0;">Update your business details. Changes save immediately.</p>' +
        '</div>' +
        '<div class="filter-row" style="margin:0;">' +
          '<button id="edit-supplier-btn" class="filter-btn active" style="background:linear-gradient(135deg,#1E4E8C,#2E6FBF); color:#fff; border:none; font-weight:700; padding:10px 20px;">âœï¸ Edit my info</button>' +
          '<button id="export-sup-pdf" class="filter-btn" style="padding:10px 20px;">ðŸ“„ PDF report</button>' +
          '<button id="export-sup-csv" class="filter-btn" style="padding:10px 20px;">ðŸ“¥ Export CSV</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('edit-supplier-btn').onclick = () => openEditSupplierModal();

  document.getElementById('export-sup-pdf').onclick = () => {
    const columns = ['Item', 'Value'];
    const rows = [
      ['Supplier ID', s.id],
      ['Name', s.name],
      ['City', s.city],
      ['Category', s.category],
      ['Rating', s.rating.toFixed(1) + ' / 5'],
      ['On-time delivery', s.on_time + '%'],
      ['Quality score', s.quality],
      ['Default lead time', s.lead_time + ' days'],
      ['Products supplied', productCount],
      ['Catalog value (est.)', fmtR(catalogValue)],
      ['Report generated', new Date().toLocaleString()]
    ];
    exportPDF('Supplier Report â€” ' + s.name, s.id + ' Â· ' + s.city + ' Â· ' + s.category, columns, rows, 'supplier-' + s.id + '-' + new Date().toISOString().slice(0,10) + '.pdf');
  };

  document.getElementById('export-sup-csv').onclick = () => {
    const rows = [{
      'Supplier ID': s.id,
      'Name': s.name,
      'City': s.city,
      'Category': s.category,
      'Rating': s.rating,
      'On-time %': s.on_time,
      'Quality': s.quality,
      'Default lead time (days)': s.lead_time,
      'Products supplied': productCount,
      'Catalog value (R)': catalogValue
    }];
    exportCSV('supplier-' + s.id + '-' + new Date().toISOString().slice(0,10) + '.csv', rows);
  };
}

/* ==================== MY PRODUCTS ==================== */

async function renderSupplierProducts(){
  const el = document.getElementById('view-sup-products');
  el.innerHTML = '<div class="panel"><p class="sub">Loading your catalogâ€¦</p></div>';

  let products = [];
  try { products = await API.mySupplierProducts(); }
  catch (err){
    el.innerHTML = '<div class="panel"><h2>Could not load your catalog</h2><p class="sub" style="color:var(--danger);">' + err.message + '</p></div>';
    return;
  }

  if (products.length === 0){
    el.innerHTML =
      '<div class="panel">' +
        '<h2>Your catalog</h2>' +
        '<p class="sub">You do not supply any products yet.</p>' +
        '<div style="text-align:center; padding:40px 20px;">' +
          '<div style="font-size:56px;">ðŸ“¦</div>' +
          '<div style="font-weight:700; font-size:18px; margin-top:14px;">Browse the catalog to add products</div>' +
          '<p style="color:var(--muted); font-size:14px; margin-top:8px;">Choose which products you want to supply to vendors.</p>' +
          '<button id="browse-catalog-btn" class="filter-btn active" style="margin-top:20px; background:linear-gradient(135deg,#1E4E8C,#2E6FBF); color:#fff; border:none; font-weight:700; padding:12px 24px;">ðŸ“š Browse product catalog</button>' +
        '</div>' +
      '</div>';
    document.getElementById('browse-catalog-btn').onclick = openBrowseCatalogModal;
    return;
  }

  el.innerHTML =
    '<div class="filter-row" style="margin-bottom:22px;">' +
      '<button id="browse-catalog-btn" class="filter-btn active" style="background:linear-gradient(135deg,#1E4E8C,#2E6FBF); color:#fff; border:none; font-weight:700; padding:10px 20px;">ðŸ“š Browse &amp; add more</button>' +
      '<button id="export-prod-csv" class="filter-btn" style="padding:10px 20px;">ðŸ“¥ Export catalog</button>' +
      '<button id="refresh-sup-products" class="filter-btn" style="padding:10px 20px;">ðŸ”„ Refresh</button>' +
    '</div>' +

    '<div class="panel">' +
      '<h2>Products you supply</h2>' +
      '<p class="sub">' + products.length + ' product' + (products.length > 1 ? 's' : '') + ' in your catalog.</p>' +
      '<div class="table-scroll">' +
        '<table>' +
          '<thead><tr><th>Product</th><th>Category</th><th class="num">Your price</th><th class="num">Retail</th><th class="num">MOQ</th><th class="num">Lead time</th><th>Actions</th></tr></thead>' +
          '<tbody>' +
            products.map(p =>
              '<tr>' +
                '<td class="name-cell">' + p.name + '</td>' +
                '<td>' + p.category + '</td>' +
                '<td class="num">' + fmtR(p.price) + '</td>' +
                '<td class="num" style="color:#6B6B6B;">' + fmtR(p.retail_price) + '</td>' +
                '<td class="num">' + p.moq + '</td>' +
                '<td class="num">' + p.lead_time + 'd</td>' +
                '<td style="display:flex; gap:6px;">' +
                  '<button class="filter-btn edit-sup-prod-btn" data-pid="' + p.product_id + '">Edit</button>' +
                  '<button class="filter-btn remove-sup-prod-btn" data-pid="' + p.product_id + '" style="color:var(--danger);">Remove</button>' +
                '</td>' +
              '</tr>'
            ).join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';

  document.getElementById('browse-catalog-btn').onclick = openBrowseCatalogModal;
  document.getElementById('refresh-sup-products').onclick = renderSupplierProducts;

  document.getElementById('export-prod-csv').onclick = () => {
    const rows = products.map(p => ({
      'Product ID': p.product_id,
      'Product': p.name,
      'Category': p.category,
      'Your price (R)': p.price,
      'Retail price (R)': p.retail_price,
      'MOQ': p.moq,
      'Lead time (days)': p.lead_time
    }));
    exportCSV('supplier-catalog-' + new Date().toISOString().slice(0,10) + '.csv', rows);
  };

  el.querySelectorAll('.edit-sup-prod-btn').forEach(btn => {
    btn.onclick = () => {
      const p = products.find(x => x.product_id === btn.dataset.pid);
      if (p) openEditProductModal(p);
    };
  });

  el.querySelectorAll('.remove-sup-prod-btn').forEach(btn => {
    btn.onclick = async () => {
      const pid = btn.dataset.pid;
      const p = products.find(x => x.product_id === pid);
      if (!p) return;
      if (!confirm('Remove "' + p.name + '" from your catalog?')) return;
      try {
        await API.removeSupplierProduct(session.supplierId, pid);
        renderSupplierProducts();
      } catch (err){
        alert('âŒ ' + err.message);
      }
    };
  });
}

/* ==================== EDIT PRODUCT MODAL ==================== */

function openEditProductModal(product){
  const s = currentSupplier();
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';

  overlay.innerHTML =
    '<div style="background:#FBF8EF; border-radius:20px; max-width:520px; width:100%; padding:32px;">' +
      '<h2 style="font-family:\'Space Grotesk\'; font-size:22px; margin:0 0 6px; color:#000;">Edit product</h2>' +
      '<p style="font-size:13px; color:#4A4A4A; margin:0 0 20px;">' + product.name + ' Â· ' + product.category + '</p>' +

      '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Your price (R)</label>' +
      '<input id="ep-price" type="number" step="0.01" value="' + product.price + '" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:16px;">' +

      '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Minimum order quantity</label>' +
      '<input id="ep-moq" type="number" min="1" value="' + product.moq + '" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:16px;">' +

      '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Lead time (days)</label>' +
      '<input id="ep-lead" type="number" min="1" value="' + product.lead_time + '" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:6px;">' +
      '<p style="font-size:11.5px; color:#6B6B6B; margin:0 0 18px;">Your default is ' + (s.lead_time || 3) + ' days. Override per product if needed.</p>' +

      '<div id="ep-error" style="color:#C4432B; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +

      '<div style="display:flex; gap:10px;">' +
        '<button id="ep-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button>' +
        '<button id="ep-save" class="filter-btn active" style="flex:2; padding:12px;">Save changes</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);
  overlay.querySelector('#ep-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#ep-save').onclick = async () => {
    const errEl = overlay.querySelector('#ep-error');
    errEl.textContent = '';
    const price = parseFloat(overlay.querySelector('#ep-price').value);
    const moq = parseInt(overlay.querySelector('#ep-moq').value);
    const lead_time = parseInt(overlay.querySelector('#ep-lead').value);

    if (!price || price <= 0){ errEl.textContent = 'âŒ Enter a valid price.'; return; }
    if (!moq || moq < 1){ errEl.textContent = 'âŒ Enter a valid MOQ.'; return; }
    if (!lead_time || lead_time < 1){ errEl.textContent = 'âŒ Enter a valid lead time.'; return; }

    try {
      await API.updateSupplierProduct(session.supplierId, product.product_id, { price, moq, lead_time });
      overlay.remove();
      alert('âœ… ' + product.name + ' updated');
      renderSupplierProducts();
    } catch (err){
      errEl.textContent = 'âŒ ' + err.message;
    }
  };
}

/* ==================== BROWSE CATALOG MODAL ==================== */

async function openBrowseCatalogModal(){
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';

  overlay.innerHTML =
    '<div style="background:#FBF8EF; border-radius:20px; max-width:900px; width:100%; padding:32px; max-height:90vh; overflow-y:auto;">' +
      '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">' +
        '<div>' +
          '<h2 style="font-family:\'Space Grotesk\'; font-size:22px; margin:0 0 4px; color:#000;">Browse product catalog</h2>' +
          '<p style="font-size:13px; color:#4A4A4A; margin:0;">Click <strong>Add</strong> to start supplying a product.</p>' +
        '</div>' +
        '<button id="bc-close" class="filter-btn" style="padding:8px 16px;">âœ• Close</button>' +
      '</div>' +
      '<div id="bc-loading" style="padding:40px; text-align:center; color:#6B6B6B;">Loading catalogâ€¦</div>' +
      '<div id="bc-body" style="display:none;"></div>' +
    '</div>';

  document.body.appendChild(overlay);
  overlay.querySelector('#bc-close').onclick = () => overlay.remove();

  let catalog = [];
  try {
    catalog = await API.fullCatalog();
  } catch (err){
    overlay.querySelector('#bc-loading').innerHTML = '<span style="color:#C4432B;">Could not load catalog: ' + err.message + '</span>';
    return;
  }

  overlay.querySelector('#bc-loading').style.display = 'none';
  const body = overlay.querySelector('#bc-body');
  body.style.display = 'block';

  // Sort: not-supplied first, then supplied
  catalog.sort((a, b) => (a.i_supply - b.i_supply) || a.name.localeCompare(b.name));

  body.innerHTML =
    '<p style="font-size:12.5px; color:#6B6B6B; margin-bottom:12px;">' +
      catalog.filter(p => p.i_supply === 0).length + ' products available to add Â· ' +
      catalog.filter(p => p.i_supply === 1).length + ' already in your catalog' +
    '</p>' +
    '<div class="table-scroll" style="max-height:60vh;">' +
      '<table>' +
        '<thead><tr><th>Product</th><th>Category</th><th class="num">Retail price</th><th>Status</th><th></th></tr></thead>' +
        '<tbody>' +
          catalog.map(p =>
            '<tr>' +
              '<td class="name-cell">' + p.name + '</td>' +
              '<td>' + p.category + '</td>' +
              '<td class="num">' + fmtR(p.retail_price) + '</td>' +
              '<td>' + (p.i_supply === 1 ? '<span class="chip low">â— You supply</span>' : '<span class="chip medium">Available</span>') + '</td>' +
              '<td>' + (p.i_supply === 1
                ? '<button class="filter-btn" disabled style="opacity:0.5; cursor:not-allowed;">Added</button>'
                : '<button class="filter-btn active bc-add-btn" data-pid="' + p.id + '" data-name="' + p.name.replace(/"/g,'&quot;') + '" data-retail="' + p.retail_price + '" style="background:linear-gradient(135deg,#1E4E8C,#2E6FBF); color:#fff; border:none; font-weight:700;">Add</button>'
              ) + '</td>' +
            '</tr>'
          ).join('') +
        '</tbody>' +
      '</table>' +
    '</div>';

  body.querySelectorAll('.bc-add-btn').forEach(btn => {
    btn.onclick = () => openAddFromCatalogModal(btn.dataset.pid, btn.dataset.name, parseFloat(btn.dataset.retail), overlay);
  });
}

/* ==================== ADD FROM CATALOG MODAL ==================== */

function openAddFromCatalogModal(productId, productName, retailPrice, parentOverlay){
  const s = currentSupplier();
  const suggested = Math.round(retailPrice * 0.75 * 100) / 100;

  const inner = document.createElement('div');
  inner.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:10000; display:flex; align-items:center; justify-content:center; padding:20px;';

  inner.innerHTML =
    '<div style="background:#FBF8EF; border-radius:20px; max-width:520px; width:100%; padding:32px;">' +
      '<h2 style="font-family:\'Space Grotesk\'; font-size:22px; margin:0 0 6px; color:#000;">Add to your catalog</h2>' +
      '<p style="font-size:13px; color:#4A4A4A; margin:0 0 20px;">' + productName + ' Â· Retail ' + fmtR(retailPrice) + '</p>' +

      '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Your price (R)</label>' +
      '<input id="ac-price" type="number" step="0.01" value="' + suggested + '" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:6px;">' +
      '<p style="font-size:11.5px; color:#6B6B6B; margin:0 0 16px;">Suggested: 75% of retail (' + fmtR(suggested) + ')</p>' +

      '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Minimum order quantity</label>' +
      '<input id="ac-moq" type="number" min="1" value="20" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:16px;">' +

      '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Lead time (days)</label>' +
      '<input id="ac-lead" type="number" min="1" value="' + (s.lead_time || 3) + '" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:6px;">' +
      '<p style="font-size:11.5px; color:#6B6B6B; margin:0 0 18px;">Your default is ' + (s.lead_time || 3) + ' days.</p>' +

      '<div id="ac-error" style="color:#C4432B; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +

      '<div style="display:flex; gap:10px;">' +
        '<button id="ac-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button>' +
        '<button id="ac-save" class="filter-btn active" style="flex:2; padding:12px;">Add to catalog</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(inner);
  inner.querySelector('#ac-cancel').onclick = () => inner.remove();

  inner.querySelector('#ac-save').onclick = async () => {
    const errEl = inner.querySelector('#ac-error');
    errEl.textContent = '';
    const price = parseFloat(inner.querySelector('#ac-price').value);
    const moq = parseInt(inner.querySelector('#ac-moq').value);
    const lead_time = parseInt(inner.querySelector('#ac-lead').value);

    if (!price || price <= 0){ errEl.textContent = 'âŒ Enter a valid price.'; return; }
    if (!moq || moq < 1){ errEl.textContent = 'âŒ Enter a valid MOQ.'; return; }
    if (!lead_time || lead_time < 1){ errEl.textContent = 'âŒ Enter a valid lead time.'; return; }

    try {
      await API.addSupplierProduct(session.supplierId, { product_id: productId, price, moq, lead_time });
      inner.remove();
      if (parentOverlay) parentOverlay.remove();
      alert('âœ… ' + productName + ' added to your catalog');
      renderSupplierProducts();
    } catch (err){
      errEl.textContent = 'âŒ ' + err.message;
    }
  };
}

/* ==================== EDIT SUPPLIER INFO MODAL ==================== */

function openEditSupplierModal(){
  const s = currentSupplier();
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';

  const categoryOptions = Object.keys(CAT_HEX || {}).map(c =>
    '<option value="' + c + '"' + (c === s.category ? ' selected' : '') + '>' + c + '</option>'
  ).join('');

  overlay.innerHTML =
    '<div style="background:#FBF8EF; border-radius:20px; max-width:560px; width:100%; padding:32px;">' +
      '<h2 style="font-family:\'Space Grotesk\'; font-size:22px; margin:0 0 6px; color:#000;">Edit supplier info</h2>' +
      '<p style="font-size:13px; color:#4A4A4A; margin:0 0 20px;">Update your business details.</p>' +

      '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Supplier name</label>' +
      '<input id="es-name" value="' + s.name + '" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:16px;">' +

      '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">' +
        '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">City</label><input id="es-city" value="' + s.city + '" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px;"></div>' +
        '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Default lead time (days)</label><input id="es-lead" type="number" min="1" value="' + (s.lead_time || 3) + '" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px;"></div>' +
      '</div>' +

      '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Primary category</label>' +
      '<select id="es-cat" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:18px;">' + categoryOptions + '</select>' +

      '<div style="padding:12px; background:#ECE3CC; border-radius:10px; margin-bottom:20px; font-size:12px; color:#4A4A4A;">' +
        '<strong>Read-only:</strong> rating (' + s.rating + '), on-time (' + s.on_time + '%), quality (' + s.quality + '). Calculated by the system.' +
      '</div>' +

      '<div id="es-error" style="color:#C4432B; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +

      '<div style="display:flex; gap:10px;">' +
        '<button id="es-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button>' +
        '<button id="es-save" class="filter-btn active" style="flex:2; padding:12px;">Save changes</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);
  overlay.querySelector('#es-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#es-save').onclick = async () => {
    const errEl = overlay.querySelector('#es-error');
    errEl.textContent = '';
    const payload = {
      name: overlay.querySelector('#es-name').value.trim(),
      city: overlay.querySelector('#es-city').value.trim(),
      category: overlay.querySelector('#es-cat').value,
      lead_time: parseInt(overlay.querySelector('#es-lead').value)
    };
    if (!payload.name || !payload.city || !payload.category){ errEl.textContent = 'âŒ Name, city, and category are required.'; return; }
    if (!payload.lead_time || payload.lead_time < 1){ errEl.textContent = 'âŒ Enter a valid lead time.'; return; }

    try {
      const res = await API.updateSupplier(s.id, payload);
      Object.assign(s, res.supplier);
      overlay.remove();
      alert('âœ… Supplier info updated');
      renderSupplierOverview();
    } catch (err){
      errEl.textContent = 'âŒ ' + err.message;
    }
  };
}

/* ==================== DISCOUNTS ==================== */

async function renderSupplierDiscounts(){
  const el = document.getElementById('view-sup-discounts');
  const s = currentSupplier();
  el.innerHTML = '<div class="panel"><p class="sub">Loading your discountsâ€¦</p></div>';

  let discounts = [];
  let myProducts = [];
  try {
    discounts = await API.supplierDiscounts(s.id);
  } catch (err){
    el.innerHTML = '<div class="panel"><p class="sub" style="color:var(--danger);">Could not load discounts: ' + err.message + '</p></div>';
    return;
  }
  try { myProducts = await API.mySupplierProducts(); } catch (e){}

  const now = new Date();
  const active = discounts.filter(d => !d.valid_until || new Date(d.valid_until) >= now);
  const expired = discounts.filter(d => d.valid_until && new Date(d.valid_until) < now);

  el.innerHTML =
    '<div class="panel">' +
      '<div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px;">' +
        '<div>' +
          '<h2>Discount offers</h2>' +
          '<p class="sub" style="margin:0;">Promote your products. Vendors see these offers in their "What to stock" view.</p>' +
        '</div>' +
        '<div class="filter-row" style="margin:0;">' +
          '<button id="create-discount-btn" class="filter-btn active" style="background:linear-gradient(135deg,#1E4E8C,#2E6FBF); color:#fff; border:none; font-weight:700; padding:10px 20px;">âž• New discount</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="stat-strip" style="margin-bottom:22px;">' +
      '<div class="cell"><div class="v" style="color:var(--success);">' + active.length + '</div><div class="l">Active offers</div></div>' +
      '<div class="cell"><div class="v">' + expired.length + '</div><div class="l">Expired</div></div>' +
      '<div class="cell"><div class="v">' + myProducts.length + '</div><div class="l">Products you supply</div></div>' +
    '</div>' +

    '<div class="panel">' +
      '<h2>Your offers</h2>' +
      '<p class="sub">' + discounts.length + ' total Â· ' + active.length + ' active</p>' +
      (discounts.length === 0
        ? '<div style="text-align:center; padding:50px 20px;"><div style="font-size:56px;">ðŸŽ</div><div style="font-weight:700; font-size:18px; margin-top:14px;">No discounts yet</div><p style="color:var(--muted); font-size:14px; margin-top:8px;">Create your first offer to attract vendors.</p></div>'
        : '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px; margin-top:20px;">' +
          discounts.map(d => {
            const isExpired = d.valid_until && new Date(d.valid_until) < now;
            const discounted = d.unit_price * (1 - d.discount_percent / 100);
            return '<div style="background:' + (isExpired ? '#F5F5F0' : 'linear-gradient(135deg,#DCE6F2,#FFF)') + '; border:1px solid ' + (isExpired ? 'rgba(0,0,0,0.1)' : 'rgba(30,78,140,0.25)') + '; border-radius:14px; padding:18px;' + (isExpired ? 'opacity:0.55;' : '') + '">' +
              '<div style="display:flex; justify-content:space-between; margin-bottom:10px;">' +
                '<div style="font-weight:700; font-size:16px;">' + d.product_name + '</div>' +
                (isExpired ? '<span class="chip high">Expired</span>' : '<span class="chip low">Active</span>') +
              '</div>' +
              '<div style="display:flex; align-items:baseline; gap:10px; margin-bottom:12px;">' +
                '<div style="font-family:\'Space Grotesk\'; font-weight:700; font-size:24px; color:var(--brand);">' + fmtR(discounted) + '</div>' +
                '<div style="font-size:13px; color:var(--muted); text-decoration:line-through;">' + fmtR(d.unit_price) + '</div>' +
              '</div>' +
              '<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px;">' +
                '<span class="chip low">' + d.discount_percent + '% off</span>' +
                '<span class="chip medium">Min ' + d.min_quantity + ' units</span>' +
              '</div>' +
              '<div style="font-size:11.5px; color:var(--muted); margin-bottom:12px;">' +
                (d.valid_until ? 'Valid until ' + d.valid_until : 'No expiry') +
              '</div>' +
              '<button class="filter-btn delete-disc-btn" data-id="' + d.id + '" style="width:100%; color:var(--danger);">Remove</button>' +
            '</div>';
          }).join('') +
          '</div>'
      ) +
    '</div>';

  document.getElementById('create-discount-btn').onclick = () => openCreateDiscountModal();

  document.querySelectorAll('.delete-disc-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Remove this discount?')) return;
      try {
        await API.deleteDiscount(btn.dataset.id);
        renderSupplierDiscounts();
      } catch (err){ alert('âŒ ' + err.message); }
    };
  });
}

function openCreateDiscountModal(){
  const s = currentSupplier();
  API.mySupplierProducts().then(products => {
    if (!products || products.length === 0){
      alert('âŒ You have no products in your catalog. Add products first via "My products".');
      return;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';

    const productOptions = products.map(p =>
      '<option value="' + p.product_id + '" data-price="' + p.price + '">' + p.name + ' â€” ' + fmtR(p.price) + '</option>'
    ).join('');

    overlay.innerHTML =
      '<div style="background:#FBF8EF; border-radius:20px; max-width:540px; width:100%; padding:32px;">' +
        '<h2 style="font-family:\'Space Grotesk\'; font-size:22px; margin:0 0 6px; color:#000;">Create discount offer</h2>' +
        '<p style="font-size:13px; color:#4A4A4A; margin:0 0 20px;">Offer a promotional price to vendors.</p>' +

        '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Product</label>' +
        '<select id="cd-product" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:16px;">' + productOptions + '</select>' +

        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">' +
          '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Discount %</label><input id="cd-percent" type="number" min="1" max="90" value="10" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px;"></div>' +
          '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Min quantity</label><input id="cd-min" type="number" min="1" value="50" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px;"></div>' +
        '</div>' +

        '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Valid until (optional)</label>' +
        '<input id="cd-until" type="date" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:18px;">' +

        '<div id="cd-error" style="color:#C4432B; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +

        '<div style="display:flex; gap:10px;">' +
          '<button id="cd-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button>' +
          '<button id="cd-save" class="filter-btn active" style="flex:2; padding:12px;">Publish discount</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    overlay.querySelector('#cd-cancel').onclick = () => overlay.remove();

    overlay.querySelector('#cd-save').onclick = async () => {
      const errEl = overlay.querySelector('#cd-error');
      errEl.textContent = '';
      const payload = {
        product_id: overlay.querySelector('#cd-product').value,
        discount_percent: parseFloat(overlay.querySelector('#cd-percent').value),
        min_quantity: parseInt(overlay.querySelector('#cd-min').value),
        valid_until: overlay.querySelector('#cd-until').value || null
      };
      if (!payload.discount_percent || payload.discount_percent <= 0 || payload.discount_percent > 90){
        errEl.textContent = 'âŒ Discount must be 1â€“90%.';
        return;
      }
      if (!payload.min_quantity || payload.min_quantity < 1){
        errEl.textContent = 'âŒ MOQ must be at least 1.';
        return;
      }
      try {
        await API.createDiscount(payload);
        overlay.remove();
        alert('âœ… Discount published');
        renderSupplierDiscounts();
      } catch (err){
        errEl.textContent = 'âŒ ' + err.message;
      }
    };
  }).catch(err => alert('Could not load products: ' + err.message));
}

/* ==================== DEMAND FOR MY STOCK ==================== */

async function renderSupplierDemand(){
  const el = document.getElementById('view-sup-demand');
  const s = currentSupplier();

  let myProducts = [];
  try { myProducts = await API.mySupplierProducts(); }
  catch (err){
    el.innerHTML = '<div class="panel"><p class="sub" style="color:var(--danger);">Could not load products: ' + err.message + '</p></div>';
    return;
  }

  if (myProducts.length === 0){
    el.innerHTML = '<div class="panel"><h2>No products yet</h2><p class="sub">Add products to your catalog to see demand.</p></div>';
    return;
  }

  // Cross-reference with predictions for demand
  // Fetch real predictions from the ML service
  let predictions = {};
  try {
    const allPreds = await API.request('/predictions');
    if (Array.isArray(allPreds)) {
      allPreds.forEach(p => {
        const pid = p.product_id || p.id;
        if (pid) predictions[pid] = p.predicted_daily_demand || 0;
      });
    }
  } catch (e) { console.warn('Could not load predictions:', e.message); }

  const demandData = myProducts.map(p => {
    return {
      name: p.name,
      category: p.category,
      price: p.price,
      moq: p.moq,
      lead_time: p.lead_time,
      predicted_demand: predictions[p.product_id] || 0
    };
  });

  demandData.sort((a, b) => b.predicted_demand - a.predicted_demand);

  const totalDaily = demandData.reduce((sum, d) => sum + (d.predicted_demand || 0), 0);
  const topDemand = demandData.slice(0, 5);

  el.innerHTML =
    '<div class="panel">' +
      '<h2>Demand for your products</h2>' +
      '<p class="sub">Predicted daily demand across the vendor network for products in your catalog.</p>' +
    '</div>' +

    '<div class="stat-strip" style="margin-bottom:22px;">' +
      '<div class="cell"><div class="v">' + myProducts.length + '</div><div class="l">Your products</div></div>' +
      '<div class="cell"><div class="v">' + totalDaily.toFixed(0) + '</div><div class="l">Total predicted demand/day</div></div>' +
      '<div class="cell"><div class="v">' + Math.round(totalDaily / myProducts.length) + '</div><div class="l">Average per product</div></div>' +
    '</div>' +

    '<div class="panel">' +
      '<h2>Top demand products</h2>' +
      '<p class="sub">Your 5 highest-demand products across the network.</p>' +
      '<div class="table-scroll">' +
        '<table>' +
          '<thead><tr><th>Product</th><th>Category</th><th class="num">Your price</th><th class="num">Predicted demand/day</th><th class="num">Lead time</th></tr></thead>' +
          '<tbody>' +
            topDemand.map(d =>
              '<tr>' +
                '<td class="name-cell">' + d.name + '</td>' +
                '<td>' + d.category + '</td>' +
                '<td class="num">' + fmtR(d.price) + '</td>' +
                '<td class="num">' + (d.predicted_demand || 0).toFixed(1) + '</td>' +
                '<td class="num">' + d.lead_time + 'd</td>' +
              '</tr>'
            ).join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +

    '<div class="panel">' +
      '<h2>All your products</h2>' +
      '<p class="sub">Predicted demand across the network.</p>' +
      '<div class="table-scroll" style="max-height:520px;">' +
        '<table>' +
          '<thead><tr><th>Product</th><th>Category</th><th class="num">Your price</th><th class="num">Retail</th><th class="num">Demand/day</th></tr></thead>' +
          '<tbody>' +
            demandData.map((d, i) =>
              '<tr>' +
                '<td class="name-cell">' + d.name + '</td>' +
                '<td>' + d.category + '</td>' +
                '<td class="num">' + fmtR(d.price) + '</td>' +
                '<td class="num" style="color:#6B6B6B;">' + fmtR(myProducts[i].retail_price) + '</td>' +
                '<td class="num">' + (d.predicted_demand || 0).toFixed(1) + '</td>' +
              '</tr>'
            ).join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}
