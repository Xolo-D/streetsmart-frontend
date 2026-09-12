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
}

/* ==================== SUPPLIER PRODUCTS ==================== */

function renderSupplierProducts(){
  const el = document.getElementById('view-sup-products');
  const s = currentSupplier();
  const products = DATA.supplier_products[s.id] || [];
  el.innerHTML =
    '<div class="filter-row" style="margin-bottom:22px;">'
    + '<button id="add-sup-product-btn" class="filter-btn active" style="background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border:none;font-weight:700;padding:10px 20px;">➕ Add product to catalogue</button>'
    + '<button class="filter-btn" onclick="renderSupplierProducts()" style="padding:10px 20px;">🔄 Refresh</button>'
    + '</div>'
    + '<div class="panel"><h2>Products you supply</h2><p class="sub">Prices, minimum order quantities and lead times as they appear to vendors. Changes save to the database.</p><div class="table-scroll" style="max-height:460px;"><table><thead><tr><th>Product</th><th>Category</th><th class="num">Unit price</th><th class="num">Min. order qty</th><th class="num">Lead time</th><th></th></tr></thead><tbody id="sup-products-body">'
    + products.map((p,i) => '<tr data-idx="' + i + '"><td class="name-cell">' + p.product + '</td><td><span class="swatch" style="background:' + CAT_HEX[p.category] + '"></span> ' + p.category + '</td><td class="num"><span class="val-price">' + fmtR(p.price) + '</span></td><td class="num"><span class="val-moq">' + p.moq + '</span></td><td class="num"><span class="val-lead">' + p.lead_time + 'd</span></td><td style="display:flex;gap:6px;"><button class="filter-btn edit-product-btn" data-idx="' + i + '">Edit price</button><button class="filter-btn remove-product-btn" data-idx="' + i + '" style="color:var(--danger);">Remove</button></td></tr>').join('')
    + '</tbody></table></div></div>';

  document.getElementById('add-sup-product-btn').onclick = openAddSupplierProductModal;

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
      if (!confirm(`Remove "${p.product}" from your catalogue? This will unassign it from your supplier profile.`)) return;

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

  el.innerHTML =
    '<div class="filter-row" style="margin-bottom:22px;">' +
      '<button id="create-discount-btn" class="filter-btn active" style="background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border:none;font-weight:700;padding:10px 20px;">➕ Create discount offer</button>' +
      '<button class="filter-btn" onclick="renderSupplierDiscounts()" style="padding:10px 20px;">🔄 Refresh</button>' +
    '</div>' +
    '<div class="stat-strip" style="margin-bottom:22px;">' +
      '<div class="cell"><div class="v" style="color:var(--success);">' + active.length + '</div><div class="l">Active discounts</div></div>' +
      '<div class="cell"><div class="v">' + expired.length + '</div><div class="l">Expired</div></div>' +
      '<div class="cell"><div class="v">' + (DATA.supplier_products[s.id] || []).length + '</div><div class="l">Products in catalogue</div></div>' +
    '</div>' +
    '<div class="panel">' +
      '<h2>Your discount offers</h2>' +
      '<p class="sub">Discounts appear to vendors in their AI Predictions tab. Vendors see your offer and can place a discounted order.</p>' +
      (discounts.length === 0
        ? '<p class="sub" style="text-align:center;padding:40px 0;">No discounts yet. Click <strong>"➕ Create discount offer"</strong> to launch your first promotion.</p>'
        : '<table><thead><tr><th>Product</th><th>Category</th><th class="num">Base price</th><th class="num">Discount</th><th class="num">Min qty</th><th>Valid until</th><th></th></tr></thead><tbody>' +
          discounts.map(d => {
            const isExpired = d.valid_until && new Date(d.valid_until) < now;
            const discountedPrice = d.unit_price * (1 - d.discount_percent / 100);
            return '<tr style="' + (isExpired ? 'opacity:0.5;' : '') + '">' +
              '<td class="name-cell">' + d.product_name + (isExpired ? ' <span class="chip high" style="font-size:10px;">expired</span>' : '') + '</td>' +
              '<td>' + d.category + '</td>' +
              '<td class="num">' + fmtR(d.unit_price) + '</td>' +
              '<td class="num"><span class="chip low">' + d.discount_percent + '% off</span><br><span style="font-size:11px;color:var(--muted);">Now ' + fmtR(discountedPrice) + '</span></td>' +
              '<td class="num">' + d.min_quantity + '</td>' +
              '<td>' + (d.valid_until || 'No expiry') + '</td>' +
              '<td><button class="filter-btn delete-discount-btn" data-id="' + d.id + '" style="color:var(--danger);">Remove</button></td>' +
            '</tr>';
          }).join('') +
        '</tbody></table>'
      ) +
    '</div>';

  document.getElementById('create-discount-btn').onclick = openCreateDiscountModal;

  document.querySelectorAll('.delete-discount-btn').forEach(btn => {
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
}

function openCreateDiscountModal(){
  const s = currentSupplier();
  const products = DATA.supplier_products[s.id] || [];

  if (products.length === 0){
    alert('❌ You have no products in your catalogue. Add products first via the "My products" tab.');
    return;
  }

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(10,22,40,0.75); z-index:9999;
    display:flex; align-items:center; justify-content:center; padding:20px;
    backdrop-filter: blur(4px);
  `;

  const productOptions = products.map(p =>
    '<option value="' + p.product_id + '" data-price="' + p.price + '">' + p.product + ' — ' + fmtR(p.price) + '</option>'
  ).join('');

  overlay.innerHTML = `
    <div style="background:var(--panel); border:1px solid var(--line-2); border-radius:20px;
                max-width:540px; width:100%; padding:32px; box-shadow:var(--shadow-lg);">
      <h2 style="font-family:'Space Grotesk'; font-size:22px; margin:0 0 6px; color:var(--ink);">Create discount offer</h2>
      <p style="font-size:13px; color:var(--muted); margin:0 0 24px;">Launch a promotion that vendors will see in their AI Predictions tab.</p>

      <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Product</label>
      <select id="disc-product" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; margin-bottom:18px;">
        ${productOptions}
      </select>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Discount %</label>
          <input id="disc-percent" type="number" min="1" max="90" value="10" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Min quantity</label>
          <input id="disc-min" type="number" min="1" value="50" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
      </div>

      <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Valid until (optional)</label>
      <input id="disc-until" type="date" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; margin-bottom:18px;">

      <div id="disc-preview" style="padding:14px; background:rgba(196,67,43,0.10); border:1px solid rgba(196,67,43,0.25); border-radius:10px; margin-bottom:18px; font-size:13px; color:var(--ink-soft);">
        <strong style="color:var(--ink);">Preview:</strong> Vendor sees this offer in their predictions.
      </div>

      <div id="disc-error" style="color:var(--danger); font-size:13px; min-height:18px; margin-bottom:14px;"></div>

      <div style="display:flex; gap:10px;">
        <button id="disc-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button>
        <button id="disc-submit" style="flex:2; padding:12px; background:linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%); color:#fff; border:none; border-radius:10px; font-family:'Inter'; font-weight:700; font-size:14px; cursor:pointer;">
          Publish discount
        </button>
      </div>
    </div>
  `;

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
      '<strong style="color:var(--ink);">Preview:</strong><br>' +
      opt.text.split(' — ')[0] + ' — <del>' + fmtR(basePrice) + '</del> <strong style="color:var(--success);">' + fmtR(discounted) + '</strong><br>' +
      '<span style="color:var(--muted);">Saves vendor ' + fmtR(savingPerUnit) + ' per unit</span>';
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
  const demand = (DATA.supplier_demand[s.id] || [])
    .filter(d => d.decision !== 'NO ORDER NEEDED')
    .sort((a,b) => (a.priority==='High'?0:a.priority==='Medium'?1:2) - (b.priority==='High'?0:b.priority==='Medium'?1:2));
  const totalCost = demand.reduce((sum,d) => sum + (d.est_cost || 0), 0);
  el.innerHTML = '<div class="panel"><h2>Vendor demand for your products</h2><p class="sub">Generated from the AI reorder engine predicted demand and current vendor stock. This is visibility only — StreetSmart does not place or manage delivery of orders on your behalf.</p>'
    + '<div class="kpi-row" style="margin-bottom:22px;"><div class="kpi"><div class="v">' + demand.length + '</div><div class="l">Products with open demand</div></div><div class="kpi"><div class="v">' + demand.filter(d=>d.priority==='High').length + '</div><div class="l">High priority</div></div><div class="kpi"><div class="v">' + fmtR(totalCost) + '</div><div class="l">Estimated total value</div></div></div>'
    + '<table><thead><tr><th>Product</th><th>Category</th><th>Priority</th><th class="num">Predicted demand/day</th><th class="num">Order qty</th><th class="num">Est. value</th></tr></thead><tbody>'
    + (demand.length ? demand.map(d => '<tr><td class="name-cell">' + d.product + '</td><td>' + d.category + '</td><td>' + priorityChip(d.priority) + '</td><td class="num">' + d.predicted_demand + '</td><td class="num">' + fmtNum(d.order_qty) + '</td><td class="num">' + fmtR(d.est_cost) + '</td></tr>').join('')
       : '<tr><td colspan="6" class="sub-cell" style="padding:20px 10px;">No open demand for ' + s.name + ' products right now.</td></tr>')
    + '</tbody></table></div>';
}

/* ==================== EDIT SUPPLIER MODAL ==================== */

function openEditSupplierModal(){
  const s = currentSupplier();
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(10,22,40,0.75); z-index:9999;
    display:flex; align-items:center; justify-content:center; padding:20px;
    backdrop-filter: blur(4px);
  `;

  const categoryOptions = Object.keys(CAT_HEX).map(c =>
    '<option value="' + c + '"' + (c === s.category ? ' selected' : '') + '>' + c + '</option>'
  ).join('');

  overlay.innerHTML = `
    <div style="background:var(--panel); border:1px solid var(--line-2); border-radius:20px;
                max-width:560px; width:100%; padding:32px; box-shadow:var(--shadow-lg);">
      <h2 style="font-family:'Space Grotesk'; font-size:22px; margin:0 0 6px; color:var(--ink);">Edit supplier information</h2>
      <p style="font-size:13px; color:var(--muted); margin:0 0 24px;">Update your supplier details. Changes save immediately to the system.</p>

      <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Supplier name</label>
      <input id="edit-sup-name" value="${s.name}" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; margin-bottom:18px;">

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">City</label>
          <input id="edit-sup-city" value="${s.city}" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Lead time (days)</label>
          <input id="edit-sup-lead" type="number" min="1" value="${s.lead_time}" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
      </div>

      <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Primary category</label>
      <select id="edit-sup-cat" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; margin-bottom:18px;">
        ${categoryOptions}
      </select>

      <div style="padding:14px; background:var(--bg-soft); border-radius:10px; margin-bottom:20px; font-size:12.5px; color:var(--muted); line-height:1.6;">
        <strong style="color:var(--ink);">Read-only:</strong> rating (${s.rating}), on-time (${s.on_time}%), quality (${s.quality}). These are calculated by the system and cannot be edited manually.
      </div>

      <div id="edit-sup-error" style="color:var(--danger); font-size:13px; min-height:18px; margin-bottom:14px;"></div>

      <div style="display:flex; gap:10px;">
        <button id="edit-sup-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button>
        <button id="edit-sup-submit" style="flex:2; padding:12px; background:linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%); color:#fff; border:none; border-radius:10px; font-family:'Inter'; font-weight:700; font-size:14px; cursor:pointer;">
          Save changes
        </button>
      </div>
    </div>
  `;

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
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(10,22,40,0.75); z-index:9999;
    display:flex; align-items:center; justify-content:center; padding:20px;
    backdrop-filter: blur(4px);
  `;

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

  overlay.innerHTML = `
    <div style="background:var(--panel); border:1px solid var(--line-2); border-radius:20px;
                max-width:540px; width:100%; padding:32px; box-shadow:var(--shadow-lg);">
      <h2 style="font-family:'Space Grotesk'; font-size:22px; margin:0 0 6px; color:var(--ink);">Add product to catalogue</h2>
      <p style="font-size:13px; color:var(--muted); margin:0 0 24px;">Pick a product from the catalogue to supply. You can set your own price and MOQ.</p>

      <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Product</label>
      <select id="add-sup-prod-id" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; margin-bottom:18px;">
        ${productOptions}
      </select>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px;">
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Your price (R)</label>
          <input id="add-sup-prod-price" type="number" step="0.01" min="0" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Min. order qty</label>
          <input id="add-sup-prod-moq" type="number" min="1" value="10" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
      </div>

      <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Your lead time (days)</label>
      <input id="add-sup-prod-lead" type="number" min="1" value="${s.lead_time || 3}" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; margin-bottom:18px;">

      <div id="add-sup-prod-error" style="color:var(--danger); font-size:13px; min-height:18px; margin-bottom:14px;"></div>

      <div style="display:flex; gap:10px;">
        <button id="add-sup-prod-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button>
        <button id="add-sup-prod-submit" style="flex:2; padding:12px; background:linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%); color:#fff; border:none; border-radius:10px; font-family:'Inter'; font-weight:700; font-size:14px; cursor:pointer;">
          Add to catalogue
        </button>
      </div>
    </div>
  `;

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