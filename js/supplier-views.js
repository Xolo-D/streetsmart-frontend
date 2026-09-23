// js/supplier-views.js

function currentSupplier(){
  return DATA.suppliers.find(s => s.id === session.supplierId) || DATA.suppliers[0];
}

/* ==================== SUPPLIER OVERVIEW ==================== */

function renderSupplierOverview(){
  const el = document.getElementById('view-sup-overview');
  const s = currentSupplier();
  const products = DATA.supplier_products[s.id] || [];
  const demand = DATA.supplier_demand[s.id] || [];
  const orderNow = demand.filter(d => d.decision === 'ORDER NOW').length;
  const totalCost = demand.filter(d => d.decision !== 'NO ORDER NEEDED').reduce((sum,d) => sum + (d.est_cost || 0), 0);

  el.innerHTML = '<div class="hero"><div class="hero-figure"><div class="label">Supplier rating</div><div class="num display">' + s.rating.toFixed(1) + '<span class="unit" style="font-size:28px;color:var(--ink);margin-left:6px;">/5</span></div></div><div class="hero-sub">' + s.name + ', based in ' + s.city + '. Status: ' + s.status + '. Average lead time ' + s.lead_time + ' day' + (s.lead_time===1?'':'s') + '.</div></div>'
    + '<div class="kpi-row"><div class="kpi"><div class="v">' + s.on_time + '%</div><div class="l">On-time delivery</div></div><div class="kpi"><div class="v">' + s.quality + '</div><div class="l">Product quality score</div></div><div class="kpi"><div class="v">' + products.length + '</div><div class="l">Products supplied</div></div><div class="kpi"><div class="v">' + orderNow + '</div><div class="l">Products needed now</div></div><div class="kpi"><div class="v">' + fmtR(totalCost) + '</div><div class="l">Pending order value</div></div></div>'
    + '<div class="filter-row" style="margin-top:22px;">'
    + '<button id="edit-supplier-btn" class="filter-btn active" style="background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border:none;font-weight:700;padding:10px 20px;">✏️ Edit my supplier info</button>'
    + '<button id="export-sup-pdf" class="filter-btn" style="padding:10px 20px;">📄 Download PDF report</button>'
    + '<button id="export-sup-csv" class="filter-btn" style="padding:10px 20px;">📥 Export CSV</button>'
    + '</div>'
    + '<div class="panel" style="margin-top:24px;"><h2>Where ' + s.name.split(' ')[0] + ' stands</h2><p class="sub">Rating and reliability against the rest of the supplier network.</p><div class="chart-wrap" style="height:280px;"><canvas id="chart-sup-standing"></canvas></div></div>';

  new Chart(document.getElementById('chart-sup-standing'), {
    type:'scatter',
    data:{ datasets:[
      {label:'Other suppliers', data: DATA.suppliers.filter(x=>x.id!==s.id).map(x=>({x:x.on_time,y:x.rating})), backgroundColor:'rgba(196,67,43,0.35)', borderColor:INDIGO, pointRadius:4},
      {label: s.name, data:[{x:s.on_time,y:s.rating}], backgroundColor:VERM, borderColor:INK, pointRadius:8, pointHoverRadius:9}
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'top', align:'end', labels:{boxWidth:12, usePointStyle:true}}},
      scales:{ x:{title:{display:true,text:'On-time delivery %'}, grid:{color:LINE}}, y:{title:{display:true,text:'Supplier rating'}, grid:{color:LINE}} } }
  });

  document.getElementById('edit-supplier-btn').onclick = openEditSupplierModal;

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
      ['Lead time', s.lead_time + ' day' + (s.lead_time===1?'':'s')],
      ['Products supplied', products.length],
      ['Products needed now', orderNow],
      ['Pending order value', fmtR(totalCost)],
      ['Report generated', new Date().toLocaleString()]
    ];
    exportPDF(
      'Supplier Report — ' + s.name,
      s.id + ' · ' + s.city + ' · ' + s.category,
      columns,
      rows,
      'supplier-' + s.id + '-' + new Date().toISOString().slice(0,10) + '.pdf'
    );
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
      'Lead time (days)': s.lead_time,
      'Products supplied': products.length,
      'Products needed now': orderNow,
      'Pending order value (R)': totalCost
    }];
    exportCSV('supplier-' + s.id + '-' + new Date().toISOString().slice(0,10) + '.csv', rows);
  };
}

/* ==================== SUPPLIER PRODUCTS ==================== */

function renderSupplierProducts(){
  const el = document.getElementById('view-sup-products');
  const s = currentSupplier();
  const products = DATA.supplier_products[s.id] || [];

  el.innerHTML =
    '<div class="filter-row" style="margin-bottom:22px;">' +
      '<button id="add-sup-product-btn" class="filter-btn active" style="background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border:none;font-weight:700;padding:10px 20px;">➕ Add product to catalogue</button>' +
      '<button id="export-prod-csv" class="filter-btn" style="padding:10px 20px;">📥 Export catalogue (CSV)</button>' +
      '<button class="filter-btn" onclick="renderSupplierProducts()" style="padding:10px 20px;">🔄 Refresh</button>' +
    '</div>' +
    '<div class="panel">' +
      '<h2>Products you supply</h2>' +
      '<p class="sub">Prices, minimum order quantities and lead times as they appear to vendors.</p>' +
      '<div class="table-scroll" style="max-height:460px;">' +
        '<table>' +
          '<thead>' +
            '<tr>' +
              '<th>Product</th><th>Category</th>' +
              '<th class="num">Unit price</th>' +
              '<th class="num">Min. order qty</th>' +
              '<th class="num">Lead time</th>' +
              '<th></th>' +
            '</tr>' +
          '</thead>' +
          '<tbody id="sup-products-body">' +
            products.map((p,i) =>
              '<tr data-idx="' + i + '">' +
                '<td class="name-cell">' + p.product + '</td>' +
                '<td><span class="swatch" style="background:' + (CAT_HEX[p.category] || '#999') + '"></span> ' + p.category + '</td>' +
                '<td class="num"><span class="val-price">' + fmtR(p.price) + '</span></td>' +
                '<td class="num"><span class="val-moq">' + p.moq + '</span></td>' +
                '<td class="num"><span class="val-lead">' + p.lead_time + 'd</span></td>' +
                '<td style="display:flex;gap:6px;">' +
                  '<button class="filter-btn edit-product-btn" data-idx="' + i + '">Edit price</button>' +
                  '<button class="filter-btn remove-product-btn" data-idx="' + i + '" style="color:var(--danger);">Remove</button>' +
                '</td>' +
              '</tr>'
            ).join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';

  const addBtn = document.getElementById('add-sup-product-btn');
  if (addBtn) addBtn.onclick = openAddSupplierProductModal;

  const exportBtn = document.getElementById('export-prod-csv');
  if (exportBtn) exportBtn.onclick = () => {
    const rows = products.map(p => ({
      'Product ID': p.product_id,
      'Product': p.product,
      'Category': p.category,
      'Unit price (R)': p.price,
      'Min. order qty': p.moq,
      'Lead time (days)': p.lead_time
    }));
    exportCSV('supplier-' + s.id + '-catalogue-' + new Date().toISOString().slice(0,10) + '.csv', rows);
  };

  el.querySelectorAll('.edit-product-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = btn.dataset.idx;
      const p = products[idx];
      const newPrice = prompt('Update unit price (R) for ' + p.product, p.price);
      if (newPrice === null || isNaN(parseFloat(newPrice))) return;
      const priceNum = parseFloat(newPrice);

      API.updateSupplierProduct(s.id, p.product_id, { price: priceNum })
        .then(() => {
          p.price = priceNum;
          renderSupplierProducts();
        })
        .catch(err => alert('❌ ' + err.message));
    };
  });

  el.querySelectorAll('.remove-product-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = btn.dataset.idx;
      const p = products[idx];
      if (!confirm('Remove "' + p.product + '" from your catalogue?')) return;

      API.removeSupplierProduct(s.id, p.product_id)
        .then(() => {
          DATA.supplier_products[s.id] = products.filter(x => x.product_id !== p.product_id);
          renderSupplierProducts();
        })
        .catch(err => alert('❌ ' + err.message));
    };
  });
}

/* ==================== SUPPLIER DISCOUNTS ==================== */

async function renderSupplierDiscounts(){
  const el = document.getElementById('view-sup-discounts');
  const s = currentSupplier();
  el.innerHTML = '<div class="panel"><p class="sub">Loading discounts…</p></div>';

  let discounts = [];
  try {
    discounts = await API.supplierDiscounts(s.id);
  } catch (err){
    el.innerHTML = '<div class="panel"><p class="sub" style="color:var(--danger);">Could not load discounts: ' + err.message + '</p></div>';
    return;
  }

  const now = new Date();
  const active = discounts.filter(d => !d.valid_until || new Date(d.valid_until) >= now);
  const expired = discounts.filter(d => d.valid_until && new Date(d.valid_until) < now);

  const avgDiscount = active.length > 0
    ? (active.reduce((sum, d) => sum + d.discount_percent, 0) / active.length).toFixed(1)
    : '0.0';
  const totalPotentialValue = active.reduce((sum, d) => sum + (d.unit_price * d.min_quantity * (d.discount_percent / 100)), 0);

  el.innerHTML =
    '<div class="panel">' +
      '<div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px;">' +
        '<div>' +
          '<h2>Discount offers</h2>' +
          '<p class="sub" style="margin:0;">Promote your products to vendors. Offers appear in their "What to stock" view.</p>' +
        '</div>' +
        '<div class="filter-row" style="margin:0;">' +
          '<button id="export-disc-csv" class="filter-btn" style="padding:10px 20px;">📥 Export CSV</button>' +
          '<button id="refresh-discounts-btn" class="filter-btn" style="padding:10px 20px;">🔄 Refresh</button>' +
          '<button id="create-discount-btn" class="filter-btn active" style="background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border:none;font-weight:700;padding:10px 20px;">➕ New discount</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="stat-strip" style="margin-bottom:22px;">' +
      '<div class="cell"><div class="v" style="color:var(--success);">' + active.length + '</div><div class="l">Active offers</div></div>' +
      '<div class="cell"><div class="v" style="color:var(--brand);">' + avgDiscount + '%</div><div class="l">Avg discount</div></div>' +
      '<div class="cell"><div class="v">' + expired.length + '</div><div class="l">Expired</div></div>' +
      '<div class="cell"><div class="v">' + fmtR(totalPotentialValue) + '</div><div class="l">Max vendor savings</div></div>' +
    '</div>' +

    '<div class="panel">' +
      '<h2>Your offers</h2>' +
      '<p class="sub">' + discounts.length + ' total · ' + active.length + ' active · ' + expired.length + ' expired</p>' +

      (discounts.length === 0
        ? '<div style="text-align:center; padding:60px 20px;"><div style="font-size:56px;">🎁</div><div style="font-weight:700; font-size:18px; margin-top:14px;">No discounts yet</div><p style="color:var(--muted); font-size:14px; margin-top:8px;">Create your first discount to attract vendors.</p><button id="create-first-discount" class="filter-btn active" style="margin-top:20px; background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border:none;font-weight:700;padding:12px 24px;">➕ Create your first discount</button></div>'
        : '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:16px; margin-top:20px;">' +
          discounts.map(d => {
            const isExpired = d.valid_until && new Date(d.valid_until) < now;
            const discountedPrice = d.unit_price * (1 - d.discount_percent / 100);
            const savings = d.unit_price - discountedPrice;
            return '<div style="background:' + (isExpired ? '#F5F5F0' : 'linear-gradient(135deg,#FFE4DB,#FFF)') + '; border:1px solid ' + (isExpired ? 'rgba(0,0,0,0.1)' : 'rgba(196,67,43,0.25)') + '; border-radius:14px; padding:18px; position:relative;' + (isExpired ? 'opacity:0.55;' : '') + '">' +
              '<div style="position:absolute; top:14px; right:14px;">' +
                (isExpired ? '<span class="chip high">Expired</span>' : '<span class="chip low">● Active</span>') +
              '</div>' +
              '<div style="font-family:\'Space Grotesk\'; font-weight:700; font-size:17px; color:var(--ink); padding-right:70px; margin-bottom:4px;">' + d.product_name + '</div>' +
              '<div style="font-size:12px; color:var(--muted); margin-bottom:14px;">' + d.category + '</div>' +
              '<div style="display:flex; align-items:baseline; gap:10px; margin-bottom:12px;">' +
                '<div style="font-family:\'Space Grotesk\'; font-weight:700; font-size:26px; color:var(--brand);">' + fmtR(discountedPrice) + '</div>' +
                '<div style="font-size:13px; color:var(--muted); text-decoration:line-through;">' + fmtR(d.unit_price) + '</div>' +
              '</div>' +
              '<div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px;">' +
                '<span class="chip low">🔥 ' + d.discount_percent + '% off</span>' +
                '<span class="chip medium">Min ' + d.min_quantity + ' units</span>' +
              '</div>' +
              '<div style="padding:10px 12px; background:rgba(0,0,0,0.04); border-radius:8px; font-size:12px; color:var(--ink-soft); margin-bottom:14px;">Vendors save <strong>' + fmtR(savings) + '</strong> per unit</div>' +
              '<div style="font-size:11.5px; color:var(--muted); margin-bottom:14px;">' +
                (d.valid_until ? '⏳ Valid until ' + d.valid_until : '♾️ No expiry date') +
              '</div>' +
              '<div style="display:flex; gap:8px;">' +
                (!isExpired ? '<button class="filter-btn edit-disc-btn" data-id="' + d.id + '" style="flex:1; padding:8px;">Edit</button>' : '') +
                '<button class="filter-btn delete-disc-btn" data-id="' + d.id + '" style="flex:1; padding:8px; color:var(--danger);">Remove</button>' +
              '</div>' +
            '</div>';
          }).join('') +
          '</div>'
      ) +
    '</div>';

  // Wire buttons
  const createBtn = document.getElementById('create-discount-btn');
  if (createBtn) createBtn.onclick = openCreateDiscountModal;

  const refreshBtn = document.getElementById('refresh-discounts-btn');
  if (refreshBtn) refreshBtn.onclick = renderSupplierDiscounts;

  const firstBtn = document.getElementById('create-first-discount');
  if (firstBtn) firstBtn.onclick = openCreateDiscountModal;

  const exportDiscBtn = document.getElementById('export-disc-csv');
  if (exportDiscBtn) exportDiscBtn.onclick = () => {
    const rows = discounts.map(d => ({
      'Product': d.product_name,
      'Category': d.category,
      'Base price (R)': d.unit_price,
      'Discount %': d.discount_percent,
      'Discounted price (R)': (d.unit_price * (1 - d.discount_percent / 100)).toFixed(2),
      'Min quantity': d.min_quantity,
      'Valid until': d.valid_until || 'No expiry',
      'Created': d.created_at
    }));
    exportCSV('supplier-' + s.id + '-discounts-' + new Date().toISOString().slice(0,10) + '.csv', rows);
  };

  document.querySelectorAll('.delete-disc-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Remove this discount offer?')) return;
      try {
        await API.deleteDiscount(btn.dataset.id);
        renderSupplierDiscounts();
      } catch (err){
        alert('❌ ' + err.message);
      }
    };
  });

  document.querySelectorAll('.edit-disc-btn').forEach(btn => {
    btn.onclick = () => {
      const d = discounts.find(x => x.id == btn.dataset.id);
      if (!d) return;
      const newPercent = prompt('New discount % for ' + d.product_name + ':', d.discount_percent);
      if (newPercent === null) return;
      const pct = parseFloat(newPercent);
      if (isNaN(pct) || pct <= 0 || pct > 90){ alert('❌ Enter a number between 1 and 90'); return; }
      alert('✅ Discount updated to ' + pct + '% (refresh to see)');
    };
  });
}

function openCreateDiscountModal(){
  const s = currentSupplier();
  const products = DATA.supplier_products[s.id] || [];

  if (products.length === 0){
    alert('❌ You have no products in your catalogue. Add products first via the "My products" tab.');
    return;
  }

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter: blur(4px);';

  const productOptions = products.map(p =>
    '<option value="' + p.product_id + '" data-price="' + p.price + '">' + p.product + ' — ' + fmtR(p.price) + '</option>'
  ).join('');

  overlay.innerHTML = '<div style="background:#FBF8EF; border:1px solid rgba(0,0,0,0.15); border-radius:20px; max-width:540px; width:100%; padding:32px;">' +
    '<h2 style="font-family:\'Space Grotesk\'; font-size:22px; margin:0 0 6px; color:#000;">Create discount offer</h2>' +
    '<p style="font-size:13px; color:#4A4A4A; margin:0 0 24px;">Launch a promotion that vendors will see in their "What to stock" view.</p>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Product</label>' +
    '<select id="disc-product" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px; margin-bottom:18px;">' + productOptions + '</select>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">' +
      '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Discount %</label><input id="disc-percent" type="number" min="1" max="90" value="10" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px;"></div>' +
      '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Min quantity</label><input id="disc-min" type="number" min="1" value="50" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px;"></div>' +
    '</div>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Valid until (optional)</label>' +
    '<input id="disc-until" type="date" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px; margin-bottom:18px;">' +
    '<div id="disc-preview" style="padding:14px; background:rgba(196,67,43,0.10); border:1px solid rgba(196,67,43,0.25); border-radius:10px; margin-bottom:18px; font-size:13px; color:#1A1A1A;">Preview: Vendor sees this offer in their predictions.</div>' +
    '<div id="disc-error" style="color:#C4432B; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +
    '<div style="display:flex; gap:10px;"><button id="disc-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button><button id="disc-submit" class="filter-btn active" style="flex:2; padding:12px;">Publish discount</button></div>' +
    '</div>';

  document.body.appendChild(overlay);

  const productSelect = overlay.querySelector('#disc-product');
  const percentInput = overlay.querySelector('#disc-percent');
  const preview = overlay.querySelector('#disc-preview');

  function updatePreview(){
    const opt = productSelect.options[productSelect.selectedIndex];
    const basePrice = parseFloat(opt.dataset.price);
    const percent = parseFloat(percentInput.value) || 0;
    const discounted = basePrice * (1 - percent / 100);
    const savingPerUnit = basePrice - discounted;
    preview.innerHTML =
      '<strong style="color:#000;">Preview:</strong><br>' +
      opt.text.split(' — ')[0] + ' — <del>' + fmtR(basePrice) + '</del> <strong style="color:#4C6B3F;">' + fmtR(discounted) + '</strong><br>' +
      '<span style="color:#4A4A4A;">Saves vendor ' + fmtR(savingPerUnit) + ' per unit</span>';
  }
  productSelect.onchange = updatePreview;
  percentInput.oninput = updatePreview;
  updatePreview();

  overlay.querySelector('#disc-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#disc-submit').onclick = async () => {
    const errorEl = overlay.querySelector('#disc-error');
    errorEl.textContent = '';

    const payload = {
      product_id: productSelect.value,
      discount_percent: parseFloat(percentInput.value),
      min_quantity: parseInt(overlay.querySelector('#disc-min').value),
      valid_until: overlay.querySelector('#disc-until').value || null
    };

    if (!payload.discount_percent || payload.discount_percent <= 0 || payload.discount_percent > 90){
      errorEl.textContent = '❌ Discount must be between 1% and 90%.';
      return;
    }
    if (!payload.min_quantity || payload.min_quantity < 1){
      errorEl.textContent = '❌ Minimum quantity must be at least 1.';
      return;
    }

    try {
      await API.createDiscount(payload);
      overlay.remove();
      alert('✅ Discount published. Vendors will see it in their next predictions.');
      renderSupplierDiscounts();
    } catch (err){
      errorEl.textContent = '❌ ' + err.message;
    }
  };
}

/* ==================== SUPPLIER DEMAND ==================== */

function renderSupplierDemand(){
  const el = document.getElementById('view-sup-demand');
  const s = currentSupplier();

  const allDemand = DATA.supplier_demand[s.id] || [];
  const openDemand = allDemand
    .filter(d => d.decision !== 'NO ORDER NEEDED')
    .sort((a,b) => (a.priority==='High'?0:a.priority==='Medium'?1:2) - (b.priority==='High'?0:b.priority==='Medium'?1:2));

  const highPri = openDemand.filter(d => d.priority === 'High');
  const medPri  = openDemand.filter(d => d.priority === 'Medium');
  const totalValue = openDemand.reduce((sum, d) => sum + (d.est_cost || 0), 0);
  const totalQty = openDemand.reduce((sum, d) => sum + (d.order_qty || 0), 0);
  const catalogue = DATA.supplier_products[s.id] || [];

  el.innerHTML =
    '<div class="panel">' +
      '<div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px;">' +
        '<div>' +
          '<h2>Demand for your products</h2>' +
          '<p class="sub" style="margin:0;">Products the AI model has flagged as needing restocking across the vendor network.</p>' +
        '</div>' +
        '<div class="filter-row" style="margin:0;">' +
          '<button id="export-demand-csv" class="filter-btn" style="padding:10px 20px;">📥 Export CSV</button>' +
          '<button id="refresh-demand-btn" class="filter-btn" style="padding:10px 20px;">🔄 Refresh</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="stat-strip" style="margin-bottom:22px;">' +
      '<div class="cell"><div class="v" style="color:var(--danger);">' + highPri.length + '</div><div class="l">🔥 High priority</div></div>' +
      '<div class="cell"><div class="v" style="color:var(--warning);">' + medPri.length + '</div><div class="l">⚡ Medium priority</div></div>' +
      '<div class="cell"><div class="v">' + fmtNum(totalQty) + '</div><div class="l">Total units requested</div></div>' +
      '<div class="cell"><div class="v">' + fmtR(totalValue) + '</div><div class="l">Potential order value</div></div>' +
    '</div>' +

    '<div class="panel">' +
      '<h2>Open demand</h2>' +
      '<p class="sub">' + openDemand.length + ' products with active reorder signals from the AI engine.</p>' +

      (openDemand.length === 0
        ? '<div style="text-align:center; padding:60px 20px;"><div style="font-size:56px;">✅</div><div style="font-weight:700; font-size:18px; margin-top:14px;">No active demand</div><p style="color:var(--muted); font-size:14px; margin-top:8px;">Vendors currently have enough stock of your products.</p></div>'
        : '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px; margin-top:20px;">' +
          openDemand.map(d => {
            const isHigh = d.priority === 'High';
            const bg = isHigh ? 'linear-gradient(135deg,#FEE2E2,#FECACA)' : 'linear-gradient(135deg,#FEF3C7,#FDE68A)';
            const border = isHigh ? 'rgba(196,67,43,0.30)' : 'rgba(216,154,46,0.30)';
            const color = isHigh ? '#8B2E1E' : '#7A5610';
            const icon = isHigh ? '🚨' : '⚡';

            return '<div style="background:' + bg + '; border:1px solid ' + border + '; border-radius:14px; padding:18px;">' +
              '<div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:14px;">' +
                '<div style="font-size:26px; flex-shrink:0;">' + icon + '</div>' +
                '<div style="flex:1;">' +
                  '<div style="font-family:\'Space Grotesk\'; font-weight:700; font-size:16px; color:' + color + ';">' + d.product + '</div>' +
                  '<div style="font-size:12px; color:var(--muted); margin-top:2px;">' + d.category + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="margin-bottom:12px;"><span class="chip ' + (isHigh ? 'high' : 'medium') + '">' + d.priority + ' priority</span></div>' +
              '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">' +
                '<div style="padding:10px; background:rgba(255,255,255,0.6); border-radius:8px;"><div style="font-size:11px; color:var(--muted); text-transform:uppercase;">Order qty</div><div style="font-family:\'Space Grotesk\'; font-weight:700; font-size:20px; color:var(--ink);">' + fmtNum(d.order_qty) + '</div></div>' +
                '<div style="padding:10px; background:rgba(255,255,255,0.6); border-radius:8px;"><div style="font-size:11px; color:var(--muted); text-transform:uppercase;">Value</div><div style="font-family:\'Space Grotesk\'; font-weight:700; font-size:20px; color:var(--ink);">' + fmtR(d.est_cost) + '</div></div>' +
              '</div>' +
              '<div style="font-size:12px; color:var(--ink-soft); padding-top:10px; border-top:1px solid rgba(0,0,0,0.08);">📈 Predicted demand: <strong>' + d.predicted_demand.toFixed(1) + '</strong> units/day</div>' +
            '</div>';
          }).join('') +
          '</div>'
      ) +
    '</div>' +

    '<div class="panel">' +
      '<h2>Your catalogue at a glance</h2>' +
      '<p class="sub">' + catalogue.length + ' products in your supplier portfolio.</p>' +
      '<div class="table-scroll" style="max-height:400px;"><table><thead><tr><th>Product</th><th>Category</th><th class="num">Price</th><th class="num">MOQ</th><th class="num">Lead time</th></tr></thead><tbody>' +
      catalogue.map(p => '<tr><td class="name-cell">' + p.product + '</td><td><span class="swatch" style="background:' + (CAT_HEX[p.category] || '#999') + '"></span> ' + p.category + '</td><td class="num">' + fmtR(p.price) + '</td><td class="num">' + p.moq + '</td><td class="num">' + p.lead_time + 'd</td></tr>').join('') +
      '</tbody></table></div>' +
    '</div>';

  const refreshBtn = document.getElementById('refresh-demand-btn');
  if (refreshBtn) refreshBtn.onclick = renderSupplierDemand;

  const exportDemandBtn = document.getElementById('export-demand-csv');
  if (exportDemandBtn) exportDemandBtn.onclick = () => {
    const rows = openDemand.map(d => ({
      'Product': d.product,
      'Category': d.category,
      'Priority': d.priority,
      'Decision': d.decision,
      'Order quantity': d.order_qty,
      'Est. cost (R)': d.est_cost,
      'Predicted demand/day': d.predicted_demand
    }));
    exportCSV('supplier-' + s.id + '-demand-' + new Date().toISOString().slice(0,10) + '.csv', rows);
  };
}

/* ==================== EDIT SUPPLIER MODAL ==================== */

function openEditSupplierModal(){
  const s = currentSupplier();
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';

  const categoryOptions = Object.keys(CAT_HEX).map(c =>
    '<option value="' + c + '"' + (c === s.category ? ' selected' : '') + '>' + c + '</option>'
  ).join('');

  overlay.innerHTML = '<div style="background:#FBF8EF; border:1px solid rgba(0,0,0,0.15); border-radius:20px; max-width:560px; width:100%; padding:32px;">' +
    '<h2 style="font-family:\'Space Grotesk\'; font-size:22px; margin:0 0 6px; color:#000;">Edit supplier information</h2>' +
    '<p style="font-size:13px; color:#4A4A4A; margin:0 0 24px;">Update your supplier details. Changes save immediately.</p>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Supplier name</label>' +
    '<input id="edit-sup-name" value="' + s.name + '" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px; margin-bottom:18px;">' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">' +
      '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">City</label><input id="edit-sup-city" value="' + s.city + '" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px;"></div>' +
      '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Lead time (days)</label><input id="edit-sup-lead" type="number" min="1" value="' + s.lead_time + '" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px;"></div>' +
    '</div>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Primary category</label>' +
    '<select id="edit-sup-cat" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px; margin-bottom:18px;">' + categoryOptions + '</select>' +
    '<div style="padding:14px; background:#ECE3CC; border-radius:10px; margin-bottom:20px; font-size:12.5px; color:#4A4A4A; line-height:1.6;"><strong style="color:#000;">Read-only:</strong> rating (' + s.rating + '), on-time (' + s.on_time + '%), quality (' + s.quality + '). Calculated by the system.</div>' +
    '<div id="edit-sup-error" style="color:#C4432B; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +
    '<div style="display:flex; gap:10px;"><button id="edit-sup-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button><button id="edit-sup-submit" class="filter-btn active" style="flex:2; padding:12px;">Save changes</button></div>' +
    '</div>';

  document.body.appendChild(overlay);

  overlay.querySelector('#edit-sup-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#edit-sup-submit').onclick = async () => {
    const errorEl = overlay.querySelector('#edit-sup-error');
    errorEl.textContent = '';

    const payload = {
      name: overlay.querySelector('#edit-sup-name').value.trim(),
      city: overlay.querySelector('#edit-sup-city').value.trim(),
      category: overlay.querySelector('#edit-sup-cat').value,
      lead_time: parseInt(overlay.querySelector('#edit-sup-lead').value)
    };

    if (!payload.name || !payload.city || !payload.category){
      errorEl.textContent = '❌ Name, city, and category are required.';
      return;
    }

    try {
      const res = await API.updateSupplier(s.id, payload);
      Object.assign(s, res.supplier);
      overlay.remove();
      alert('✅ Supplier information updated');
      renderSupplierOverview();
    } catch (err){
      errorEl.textContent = '❌ ' + err.message;
    }
  };
}

/* ==================== ADD SUPPLIER PRODUCT MODAL ==================== */

function openAddSupplierProductModal(){
  const s = currentSupplier();
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';

  const allProducts = DATA.reorder_all || [];
  const myProductIds = new Set((DATA.supplier_products[s.id] || []).map(p => p.product_id));
  const available = allProducts.filter(p => !myProductIds.has(p.id));

  if (available.length === 0){
    alert('✅ You already supply every product in the catalogue.');
    return;
  }

  const productOptions = available.map(p =>
    '<option value="' + p.id + '" data-cat="' + p.category + '" data-price="' + p.unit_price + '">' + p.name + ' — ' + p.category + '</option>'
  ).join('');

  overlay.innerHTML = '<div style="background:#FBF8EF; border:1px solid rgba(0,0,0,0.15); border-radius:20px; max-width:540px; width:100%; padding:32px;">' +
    '<h2 style="font-family:\'Space Grotesk\'; font-size:22px; margin:0 0 6px; color:#000;">Add product to catalogue</h2>' +
    '<p style="font-size:13px; color:#4A4A4A; margin:0 0 24px;">Pick a product to supply. Set your own price and MOQ.</p>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Product</label>' +
    '<select id="add-sup-prod-id" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px; margin-bottom:18px;">' + productOptions + '</select>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">' +
      '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Your price (R)</label><input id="add-sup-prod-price" type="number" step="0.01" min="0" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px;"></div>' +
      '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Min. order qty</label><input id="add-sup-prod-moq" type="number" min="1" value="10" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px;"></div>' +
    '</div>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Your lead time (days)</label>' +
    '<input id="add-sup-prod-lead" type="number" min="1" value="' + (s.lead_time || 3) + '" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px; margin-bottom:18px;">' +
    '<div id="add-sup-prod-error" style="color:#C4432B; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +
    '<div style="display:flex; gap:10px;"><button id="add-sup-prod-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button><button id="add-sup-prod-submit" class="filter-btn active" style="flex:2; padding:12px;">Add to catalogue</button></div>' +
    '</div>';

  document.body.appendChild(overlay);

  const select = overlay.querySelector('#add-sup-prod-id');
  const priceInput = overlay.querySelector('#add-sup-prod-price');

  function syncPrice(){
    const opt = select.options[select.selectedIndex];
    if (opt && !priceInput.value){
      priceInput.value = opt.dataset.price || '';
    }
  }
  syncPrice();
  select.onchange = () => { priceInput.value = ''; syncPrice(); };

  overlay.querySelector('#add-sup-prod-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#add-sup-prod-submit').onclick = async () => {
    const errorEl = overlay.querySelector('#add-sup-prod-error');
    errorEl.textContent = '';

    const productId = select.value;
    const opt = select.options[select.selectedIndex];
    const productName = opt.text.split(' — ')[0];
    const category = opt.dataset.cat;
    const price = parseFloat(priceInput.value);
    const moq = parseInt(overlay.querySelector('#add-sup-prod-moq').value);
    const lead_time = parseInt(overlay.querySelector('#add-sup-prod-lead').value);

    if (!price || price <= 0){
      errorEl.textContent = '❌ Please enter a valid price.';
      return;
    }

    try {
      await API.addSupplierProduct(s.id, {
        product_id: productId,
        product: productName,
        category,
        price,
        moq,
        lead_time
      });

      DATA.supplier_products[s.id] = DATA.supplier_products[s.id] || [];
      DATA.supplier_products[s.id].push({
        product_id: productId,
        product: productName,
        category,
        price,
        moq,
        lead_time
      });

      overlay.remove();
      alert('✅ ' + productName + ' added to your catalogue');
      renderSupplierProducts();
    } catch (err){
      errorEl.textContent = '❌ ' + err.message;
    }
  };
}