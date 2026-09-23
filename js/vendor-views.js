// js/vendor-views.js

/* ==================== OVERVIEW ==================== */

function renderOverview(){
  const el = document.getElementById('view-overview');
  const k = DATA.kpis;

  // Find the logged-in vendor's own record
  const myVendor = (typeof session !== 'undefined' && session.vendorId)
    ? (DATA.vendors || []).find(x => x.id === session.vendorId)
    : null;

  // Async alert check
  setTimeout(async () => {
    try {
      const alerts = await API.alerts();
      if (alerts.count > 0){
        const banner = document.getElementById('alert-banner');
        if (banner){
          banner.style.display = 'flex';
          banner.innerHTML =
            '<div class="alert-icon">⚠️</div>' +
            '<div class="alert-body">' +
              '<div class="alert-title">' + alerts.count + ' product' + (alerts.count > 1 ? 's' : '') + ' need attention</div>' +
              '<div class="alert-sub">' + alerts.critical + ' critical · ' + alerts.urgent + ' urgent · ' + alerts.warning + ' warning</div>' +
            '</div>' +
            '<button class="alert-action" onclick="showTab(\'inventory\')">View →</button>';
        }
      }
    } catch (e){}
  }, 100);

  // Vendor banner
  const vendorBannerHtml = myVendor
    ? '<div id="my-vendor-banner" style="background:linear-gradient(135deg,#FFE4DB,#FFF); border:1px solid rgba(196,67,43,0.25); border-radius:14px; padding:16px 20px; margin-bottom:14px;">' +
        '<div style="font-weight:700; color:#000; font-size:15px;">Your store: ' + myVendor.id + ' · ' + myVendor.city + '</div>' +
        '<div style="font-size:12.5px; color:#4A4A4A; margin-top:4px;">' +
          'Revenue: <strong>' + fmtR(myVendor.revenue) + '</strong> · ' +
          'Profit: <strong>' + fmtR(myVendor.profit) + '</strong> · ' +
          'Units sold: <strong>' + fmtNum(myVendor.units) + '</strong> · ' +
          'Transactions: <strong>' + fmtNum(myVendor.transactions) + '</strong> · ' +
          'SKUs sold: <strong>' + fmtNum(myVendor.products) + '</strong>' +
        '</div>' +
      '</div>'
    : '';

  el.innerHTML = vendorBannerHtml
    + '<div id="alert-banner" class="alert-banner" style="display:none;"></div>'
    + '<div class="hero"><div class="hero-figure"><div class="label">Network revenue, ' + k.date_start + ' — ' + k.date_end + '</div><div class="num display"><span class="unit">R</span>' + (k.total_revenue/1000000).toFixed(2) + '<span class="unit" style="font-size:32px;color:var(--ink);margin-left:4px;">M</span></div></div><div class="hero-sub">Across ' + fmtNum(k.total_transactions) + ' transactions, ' + k.num_vendors + ' vendors carrying ' + k.num_products + ' products in ' + k.num_categories + ' categories, ' + k.num_cities + ' cities.</div></div>'
    + '<div class="kpi-row"><div class="kpi"><div class="v">' + fmtR(k.total_profit) + '</div><div class="l">Network profit</div></div><div class="kpi"><div class="v">' + k.avg_margin + '%</div><div class="l">Average margin</div></div><div class="kpi"><div class="v">' + fmtNum(k.total_units) + '</div><div class="l">Units sold</div></div><div class="kpi"><div class="v">' + k.num_vendors + '</div><div class="l">Active vendors</div></div><div class="kpi"><div class="v">' + k.num_products + '</div><div class="l">Products tracked</div></div></div>'
    + '<div class="grid grid-2" style="margin-top:24px;"><div class="panel"><h2>Revenue &amp; profit by month</h2><p class="sub">Monthly totals across the trading year.</p><div class="chart-wrap" style="height:300px;"><canvas id="chart-monthly"></canvas></div></div><div class="panel"><h2>Revenue by category</h2><p class="sub">Where the money moves across the product range.</p><div class="chart-wrap" style="height:300px;"><canvas id="chart-category"></canvas></div></div></div>'
    + '<div class="panel"><h2>Top 10 products by revenue</h2><p class="sub">Best sellers across the full vendor network.</p><table><thead><tr><th>Product</th><th>Category</th><th class="num">Units sold</th><th class="num">Revenue</th><th class="num">Profit</th></tr></thead><tbody>'
    + DATA.top_products.map(p => '<tr><td class="name-cell">' + p.name + '</td><td><span class="swatch" style="background:' + CAT_HEX[p.category] + '"></span> ' + p.category + '</td><td class="num">' + fmtNum(p.units) + '</td><td class="num">' + fmtR(p.revenue) + '</td><td class="num">' + fmtR(p.profit) + '</td></tr>').join('')
    + '</tbody></table></div>'
    + '<div class="filter-row" style="margin-top:22px;">'
    +   '<button id="export-overview-pdf" class="filter-btn active" style="background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border:none;font-weight:700;padding:10px 20px;">📄 Download my PDF report</button>'
    +   '<button id="export-overview-csv" class="filter-btn" style="padding:10px 20px;">📥 Export my CSV</button>'
    + '</div>';

  new Chart(document.getElementById('chart-monthly'), {type:'line',data:{labels:DATA.monthly.map(m=>m.month),datasets:[{label:'Revenue',data:DATA.monthly.map(m=>m.revenue),borderColor:VERM,backgroundColor:'rgba(196,67,43,0.15)',fill:true,tension:0.25,pointRadius:3,borderWidth:2.5},{label:'Profit',data:DATA.monthly.map(m=>m.profit),borderColor:INDIGO,backgroundColor:'transparent',tension:0.25,pointRadius:3,borderWidth:2,borderDash:[4,3]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',align:'end',labels:{boxWidth:12,usePointStyle:true}}},scales:{y:{grid:{color:LINE},ticks:{callback:v=>fmtR(v)}},x:{grid:{display:false}}}}});
  new Chart(document.getElementById('chart-category'), {type:'bar',data:{labels:DATA.categories.map(c=>c.category),datasets:[{data:DATA.categories.map(c=>c.revenue),backgroundColor:DATA.categories.map(c=>CAT_HEX[c.category]),borderColor:INK,borderWidth:1}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:LINE},ticks:{callback:v=>fmtR(v)}},y:{grid:{display:false}}}}});

  // Vendor-scoped exports
  setTimeout(() => {
    const pdfBtn = document.getElementById('export-overview-pdf');
    if (pdfBtn) pdfBtn.onclick = () => {
      const v = myVendor || {};
      const vName = v.id ? (v.id + ' · ' + v.city) : 'Vendor';
      const columns = ['Item', 'Value'];
      const rows = [
        ['Vendor ID', v.id || session.vendorId || '—'],
        ['City', v.city || '—'],
        ['Type', v.type || '—'],
        ['Total revenue', fmtR(v.revenue || 0)],
        ['Total profit', fmtR(v.profit || 0)],
        ['Units sold', fmtNum(v.units || 0)],
        ['Transactions', fmtNum(v.transactions || 0)],
        ['SKUs sold', fmtNum(v.products || 0)],
        ['Report generated', new Date().toLocaleString()]
      ];
      exportPDF(
        'Sales Report — ' + vName,
        'Vendor-specific report · ' + (v.city || ''),
        columns,
        rows,
        'vendor-' + (v.id || session.vendorId || 'report') + '-' + new Date().toISOString().slice(0,10) + '.pdf'
      );
    };
    const csvBtn = document.getElementById('export-overview-csv');
    if (csvBtn) csvBtn.onclick = () => {
      const v = myVendor || {};
      const rows = [{
        'Vendor ID': v.id || session.vendorId || '—',
        'City': v.city || '—',
        'Type': v.type || '—',
        'Revenue (R)': v.revenue || 0,
        'Profit (R)': v.profit || 0,
        'Units sold': v.units || 0,
        'Transactions': v.transactions || 0,
        'SKUs sold': v.products || 0
      }];
      exportCSV('vendor-' + (v.id || session.vendorId || 'report') + '-' + new Date().toISOString().slice(0,10) + '.csv', rows);
    };
  }, 100);
}

/* ==================== SALES ==================== */

function renderSales(){
  const el = document.getElementById('view-sales');
  el.innerHTML = '<div class="grid grid-2"><div class="panel"><h2>Revenue by city</h2><p class="sub">Where the network trade is concentrated.</p><div class="chart-wrap" style="height:320px;"><canvas id="chart-city"></canvas></div></div><div class="panel"><h2>Revenue by vendor type</h2><p class="sub">Food stalls carry the network, but accessories and snacks add margin.</p><div class="chart-wrap" style="height:320px;"><canvas id="chart-vendortype"></canvas></div></div></div>'
    + '<div class="grid grid-3"><div class="panel"><h2>Demand level mix</h2><p class="sub">Share of transactions by recorded demand.</p><div class="chart-wrap" style="height:220px;"><canvas id="chart-demand"></canvas></div></div><div class="panel"><h2>Weather effect</h2><p class="sub">Average units sold per transaction, by weather.</p><div class="chart-wrap" style="height:220px;"><canvas id="chart-weather"></canvas></div></div><div class="panel"><h2>Weekday vs weekend</h2><p class="sub">Average units sold per transaction.</p><div class="chart-wrap" style="height:220px;"><canvas id="chart-weekend"></canvas></div></div></div>';
  new Chart(document.getElementById('chart-city'),{type:'bar',data:{labels:DATA.cities.map(c=>c.city),datasets:[{data:DATA.cities.map(c=>c.revenue),backgroundColor:INDIGO,borderColor:INK,borderWidth:1}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:LINE},ticks:{callback:v=>fmtR(v)}},y:{grid:{display:false}}}}});
  new Chart(document.getElementById('chart-vendortype'),{type:'bar',data:{labels:DATA.vendor_types.map(c=>c.type),datasets:[{data:DATA.vendor_types.map(c=>c.revenue),backgroundColor:MARIGOLD,borderColor:INK,borderWidth:1}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:LINE},ticks:{callback:v=>fmtR(v)}},y:{grid:{display:false}}}}});
  const dc={High:VERM,Medium:MARIGOLD,Low:GREEN};
  new Chart(document.getElementById('chart-demand'),{type:'doughnut',data:{labels:DATA.demand_levels.map(d=>d.level),datasets:[{data:DATA.demand_levels.map(d=>d.count),backgroundColor:DATA.demand_levels.map(d=>dc[d.level]),borderColor:'#FBF8EF',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{boxWidth:10,padding:10,color:'#4A4A4A'}}}}});
  new Chart(document.getElementById('chart-weather'),{type:'bar',data:{labels:DATA.weather.map(w=>w.weather),datasets:[{data:DATA.weather.map(w=>w.avg_qty),backgroundColor:GREEN,borderColor:INK,borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:LINE}},x:{grid:{display:false}}}}});
  const wk=DATA.weekend.map(w=>w.Is_Weekend==='Yes'?'Weekend':'Weekday');
  new Chart(document.getElementById('chart-weekend'),{type:'bar',data:{labels:wk,datasets:[{data:DATA.weekend.map(w=>w.avg_qty),backgroundColor:[VERM,INDIGO],borderColor:INK,borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:LINE}},x:{grid:{display:false}}}}});
}

/* ==================== WHAT TO STOCK ==================== */

async function renderPredictions(){
  const el = document.getElementById('view-predictions');
  el.innerHTML = '<div class="panel"><p class="sub">Checking what you need…</p></div>';

  let predictions = [];
  let discounts = [];

  try {
    predictions = await API.predictions();
    discounts = await API.discounts();
  } catch (err){
    el.innerHTML = '<div class="panel"><h2>Unable to load suggestions</h2><p class="sub">Please try again later.</p></div>';
    return;
  }

  predictions.sort((a,b) => b.predicted_daily_demand - a.predicted_daily_demand);

  const urgent = [];
  predictions.forEach(p => {
    const days = p.current_stock / p.predicted_daily_demand;
    if (days < 3) urgent.push(p);
  });

  const discountMap = {};
  discounts.forEach(d => { discountMap[d.product_id] = d; });

  const discountedProducts = predictions.filter(p => discountMap[p.product_id]);
  const discountSectionHtml = discountedProducts.length > 0
    ? '<div class="panel" style="background:linear-gradient(135deg,#FEF3C7,#FFFBEB); border:1.5px solid #D89A2E;">' +
        '<div style="display:flex; align-items:center; gap:12px; margin-bottom:18px;">' +
          '<div style="font-size:32px;">🔥</div>' +
          '<div><h2 style="margin:0; color:#7A5610;">Special offers for you</h2>' +
          '<p class="sub" style="margin:4px 0 0;">' + discountedProducts.length + ' supplier discount' + (discountedProducts.length > 1 ? 's' : '') + ' available now</p></div>' +
        '</div>' +
        '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:14px;">' +
          discountedProducts.map(p => {
            const d = discountMap[p.product_id];
            const discountedPrice = p.unit_price * (1 - d.discount_percent / 100);
            const suggestedQty = Math.max(d.min_quantity, Math.ceil(p.predicted_daily_demand * 5));
            const savingsPerUnit = p.unit_price - discountedPrice;
            const totalSavings = savingsPerUnit * suggestedQty;
            return '<div style="background:white; border:1px solid rgba(216,154,46,0.35); border-radius:14px; padding:18px;">' +
              '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">' +
                '<div><div style="font-family:\'Space Grotesk\'; font-weight:700; font-size:16px; color:var(--ink);">' + p.product_name + '</div>' +
                '<div style="font-size:11.5px; color:var(--muted); margin-top:2px;">' + p.category + '</div></div>' +
                '<div style="text-align:right;"><div style="font-family:\'Space Grotesk\'; font-weight:700; font-size:22px; color:#C4432B; line-height:1;">' + d.discount_percent + '%</div><div style="font-size:10px; color:#7A5610; text-transform:uppercase;">off</div></div>' +
              '</div>' +
              '<div style="display:flex; align-items:baseline; gap:10px; padding:10px 12px; background:rgba(216,154,46,0.08); border-radius:8px; margin-bottom:12px;">' +
                '<div style="font-family:\'Space Grotesk\'; font-weight:700; font-size:20px; color:var(--success);">' + fmtR(discountedPrice) + '</div>' +
                '<div style="font-size:12px; color:var(--muted); text-decoration:line-through;">' + fmtR(p.unit_price) + '</div>' +
              '</div>' +
              '<div style="font-size:12px; color:var(--ink-soft); margin-bottom:10px;">📦 Order <strong>' + d.min_quantity + '+ units</strong> to qualify</div>' +
              '<div style="padding:10px 12px; background:rgba(76,107,63,0.10); border-radius:8px; font-size:12.5px; color:#2F4A26;">💰 Estimated savings: <strong>' + fmtR(totalSavings) + '</strong></div>' +
              (d.valid_until ? '<div style="font-size:11px; color:var(--muted); margin-top:10px;">⏳ Valid until ' + d.valid_until + '</div>' : '') +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>'
    : '';

  const urgentHtml = urgent.slice(0, 10).map(p => {
    const days = (p.current_stock / p.predicted_daily_demand).toFixed(1);
    const d = discountMap[p.product_id];
    return '<div style="display:flex; align-items:center; gap:16px; padding:18px 20px; background:linear-gradient(135deg,#FEE2E2,#FECACA); border:1px solid rgba(196,67,43,0.30); border-radius:14px; margin-bottom:12px;">' +
      '<div style="font-size:32px; flex-shrink:0;">🚨</div>' +
      '<div style="flex:1;">' +
        '<div style="font-weight:700; color:#8B2E1E; font-size:16px; margin-bottom:4px;">' + p.product_name + '</div>' +
        '<div style="font-size:13.5px; color:#7A5610; line-height:1.5;">You\'ll probably sell about <strong style="color:#8B2E1E;">' + Math.round(p.predicted_daily_demand) + '</strong> tomorrow.<br>You currently have <strong style="color:#8B2E1E;">' + p.current_stock + '</strong> in stock.</div>' +
        (d ? '<div style="font-size:12.5px; color:#8B2E1E; margin-top:6px; font-weight:600;">🔥 ' + d.discount_percent + '% off if you order ' + d.min_quantity + '+</div>' : '') +
      '</div>' +
      '<div style="text-align:right; flex-shrink:0;">' +
        '<div style="font-family:\'Space Grotesk\'; font-weight:700; color:#8B2E1E; font-size:24px; line-height:1;">' + days + '</div>' +
        '<div style="font-size:11px; color:#7A5610; text-transform:uppercase; letter-spacing:0.05em; margin-top:2px;">days left</div>' +
      '</div>' +
    '</div>';
  }).join('');

  el.innerHTML = discountSectionHtml +
    '<div class="panel">' +
      '<h2>What to stock tomorrow</h2>' +
      '<p class="sub">Based on your recent sales and seasonal patterns. Suggestions only — you decide.</p>' +
      (urgent.length > 0
        ? '<div style="margin-top:22px;"><div style="font-size:13px; font-weight:700; color:var(--danger); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:14px;">⚠️ Needs attention (' + urgent.length + ')</div>' + urgentHtml + '</div>'
        : '<div style="text-align:center; padding:60px 20px;"><div style="font-size:56px;">✅</div><div style="font-weight:700; font-size:20px; margin-top:14px; color:var(--success);">You\'re all set!</div><div style="color:var(--muted); font-size:14px; margin-top:8px;">Every product has enough stock.</div></div>') +
      '<details style="margin-top:28px;"><summary style="cursor:pointer; font-weight:600; padding:14px 18px; background:var(--bg-soft); border-radius:12px; display:flex; justify-content:space-between; align-items:center;"><span>See all products (' + predictions.length + ')</span><span style="font-size:11px; color:var(--muted);">Click to expand</span></summary>' +
        '<div class="table-scroll" style="margin-top:16px; max-height:500px;"><table><thead><tr><th>Product</th><th>Category</th><th class="num">Expected tomorrow</th><th class="num">You have</th><th>Offer</th></tr></thead><tbody>' +
        predictions.map(p => {
          const d = discountMap[p.product_id];
          return '<tr><td class="name-cell">' + p.product_name + '</td><td>' + p.category + '</td><td class="num">' + Math.round(p.predicted_daily_demand) + '</td><td class="num">' + p.current_stock + '</td><td>' + (d ? '<span class="chip low">🔥 ' + d.discount_percent + '% off (min ' + d.min_quantity + ')</span>' : '<span style="color:var(--muted);">—</span>') + '</td></tr>';
        }).join('') +
        '</tbody></table></div></details></div>';
}

/* ==================== INVENTORY & REORDER ==================== */

let reorderFilter = 'All';

function renderInventory(){
  const el = document.getElementById('view-inventory');
  const nn = DATA.reorder_decision_counts.find(d=>d.decision==='NO ORDER NEEDED');
  const on = DATA.reorder_decision_counts.find(d=>d.decision==='ORDER NOW');
  const os = DATA.reorder_decision_counts.find(d=>d.decision==='ORDER SOON');
  el.innerHTML = '<div class="stat-strip" style="margin-bottom:24px;">' +
    '<div class="cell"><div class="v" style="color:var(--danger)">' + (on?on.count:0) + '</div><div class="l">products — order now</div></div>' +
    '<div class="cell"><div class="v" style="color:var(--warning)">' + (os?os.count:0) + '</div><div class="l">products — order soon</div></div>' +
    '<div class="cell"><div class="v" style="color:var(--success)">' + (nn?nn.count:0) + '</div><div class="l">products — no order needed</div></div>' +
    '<div class="cell"><div class="v">' + fmtR(DATA.total_reorder_cost) + '</div><div class="l">Estimated reorder spend</div></div></div>'
    + '<div class="grid grid-2"><div class="panel"><h2>Stock status across the network</h2><p class="sub">62 products classified by current inventory position.</p><div class="chart-wrap" style="height:260px;"><canvas id="chart-stockstatus"></canvas></div></div><div class="panel"><h2>Lowest days of stock remaining</h2><p class="sub">The 15 products closest to running out.</p><div class="table-scroll" style="max-height:260px;"><table><thead><tr><th>Product</th><th class="num">Stock</th><th class="num">Days left</th><th>Status</th></tr></thead><tbody>'
    + DATA.low_stock_items.map(i => '<tr><td class="name-cell">' + i.name + '<div class="sub-cell">' + i.category + '</div></td><td class="num">' + i.current_stock + '</td><td class="num">' + i.days_remaining + '</td><td>' + statusChip(i.status) + '</td></tr>').join('')
    + '</tbody></table></div></div></div>'
    + '<div class="panel"><h2>AI reorder recommendations</h2><p class="sub">Generated from predicted daily demand, supplier lead time and safety stock. Filter by priority.</p><div class="filter-row" id="reorder-filters"></div><div class="table-scroll"><table><thead><tr><th>Product</th><th>Priority</th><th>Decision</th><th class="num">Predicted demand/day</th><th class="num">Order qty</th><th class="num">Est. cost</th><th>Supplier</th></tr></thead><tbody id="reorder-body"></tbody></table></div></div>';

  new Chart(document.getElementById('chart-stockstatus'),{type:'doughnut',data:{labels:DATA.stock_status.map(s=>s.status),datasets:[{data:DATA.stock_status.map(s=>s.count),backgroundColor:DATA.stock_status.map(s=>({'Low Stock':VERM,'Monitor':MARIGOLD,'In Stock':GREEN,'Overstocked':INDIGO}[s.status]||'#999')),borderColor:'#FBF8EF',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'bottom',labels:{boxWidth:10,padding:10,color:'#4A4A4A'}}}}});

  const fRow = document.getElementById('reorder-filters');
  ['All','High','Medium','Low'].forEach(f=>{
    const b = document.createElement('button');
    b.className = 'filter-btn' + (f===reorderFilter?' active':'');
    b.textContent = f==='All'?'All priorities':f+' priority';
    b.onclick = () => {reorderFilter=f;renderReorderTable();document.querySelectorAll('#reorder-filters .filter-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');};
    fRow.appendChild(b);
  });
  renderReorderTable();

  const bar = document.createElement('div');
  bar.id = 'inventory-button-bar';
  bar.className = 'filter-row';
  bar.style.marginBottom = '22px';
  bar.innerHTML =
    '<button id="record-sale-btn" class="filter-btn active" style="background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border:none;font-weight:700;padding:10px 20px;">➕ Record a sale</button>' +
    '<button id="add-product-btn" class="filter-btn" style="padding:10px 20px;">➕ Add product</button>' +
    '<button id="update-stock-btn" class="filter-btn" style="padding:10px 20px;">✏️ Update stock</button>' +
    '<button id="export-reorder-btn" class="filter-btn" style="padding:10px 20px;">📥 Export CSV</button>' +
    '<button id="refresh-inventory-btn" class="filter-btn" style="padding:10px 20px;">🔄 Refresh</button>';
  el.insertBefore(bar, el.firstChild);
  document.getElementById('record-sale-btn').onclick = openRecordSaleModal;
  document.getElementById('add-product-btn').onclick = openAddProductModal;
  document.getElementById('update-stock-btn').onclick = openUpdateStockModal;
  document.getElementById('refresh-inventory-btn').onclick = renderInventory;
  document.getElementById('export-reorder-btn').onclick = () => {
    const rows = DATA.reorder_all.map(r => ({
      Product: r.name,
      Category: r.category,
      Priority: r.priority,
      Decision: r.decision,
      'Current stock': r.current_stock,
      'Predicted demand/day': r.predicted_daily_demand,
      'Order qty': r.order_qty,
      'Est. cost (R)': r.est_cost,
      Supplier: r.supplier
    }));
    exportCSV('streetsmart-reorder-' + new Date().toISOString().slice(0,10) + '.csv', rows);
  };
}

function renderReorderTable(){
  const body = document.getElementById('reorder-body');
  if (!body) return;
  const rows = DATA.reorder_all.filter(r=>reorderFilter==='All'||r.priority===reorderFilter);
  body.innerHTML = rows.map(r=>'<tr><td class="name-cell">' + r.name + '<div class="sub-cell">' + r.category + ' · ' + r.current_stock + ' in stock</div></td><td>' + priorityChip(r.priority) + '</td><td>' + decisionChip(r.decision) + '</td><td class="num">' + r.predicted_daily_demand + '</td><td class="num">' + fmtNum(r.order_qty) + '</td><td class="num">' + fmtR(r.est_cost) + '</td><td>' + r.supplier + '</td></tr>').join('');
}

/* ==================== SUPPLIERS ==================== */

function renderSuppliers(){
  const el = document.getElementById('view-suppliers');
  el.innerHTML = '<div class="grid grid-2"><div class="panel"><h2>Supplier rating vs. on-time delivery</h2><p class="sub">Each point is one supplier; upper-right is the sweet spot.</p><div class="chart-wrap" style="height:320px;"><canvas id="chart-supplier-scatter"></canvas></div></div><div class="panel"><h2>Supplier status</h2><p class="sub">Tiering used to prioritise reorder routing.</p><div class="chart-wrap" style="height:320px;"><canvas id="chart-supplier-status"></canvas></div></div></div>'
    + '<div class="panel"><h2>Supplier directory</h2><p class="sub">All ' + DATA.suppliers.length + ' active suppliers, ranked by rating.</p><div class="table-scroll" style="max-height:420px;"><table><thead><tr><th>Supplier</th><th>City</th><th>Category</th><th class="num">Rating</th><th class="num">On-time %</th><th class="num">Quality</th><th class="num">Lead time</th><th>Status</th></tr></thead><tbody>'
    + DATA.suppliers.map(s => '<tr><td class="name-cell">' + s.name + '</td><td>' + s.city + '</td><td>' + s.category + '</td><td class="num">' + s.rating.toFixed(1) + '</td><td class="num">' + s.on_time + '%</td><td class="num">' + s.quality + '</td><td class="num">' + s.lead_time + 'd</td><td><span class="chip ' + (s.status==='Preferred'?'low':s.status==='Reliable'?'medium':'soon') + '">' + s.status + '</span></td></tr>').join('')
    + '</tbody></table></div></div>';
  new Chart(document.getElementById('chart-supplier-scatter'),{type:'scatter',data:{datasets:[{label:'Suppliers',data:DATA.suppliers.map(s=>({x:s.on_time,y:s.rating,label:s.name})),backgroundColor:'rgba(196,67,43,0.6)',borderColor:INDIGO,pointRadius:5,pointHoverRadius:7}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.raw.label+': rating '+ctx.raw.y+', on-time '+ctx.raw.x+'%'}}},scales:{x:{title:{display:true,text:'On-time delivery %'},grid:{color:LINE}},y:{title:{display:true,text:'Supplier rating'},grid:{color:LINE}}}}});
  const sc = {Preferred:GREEN,Reliable:MARIGOLD,Active:INDIGO};
  new Chart(document.getElementById('chart-supplier-status'),{type:'doughnut',data:{labels:DATA.supplier_status.map(s=>s.status),datasets:[{data:DATA.supplier_status.map(s=>s.count),backgroundColor:DATA.supplier_status.map(s=>sc[s.status]||'#999'),borderColor:'#FBF8EF',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'bottom',labels:{boxWidth:10,padding:10,color:'#4A4A4A'}}}}});
}

/* ==================== RECORD SALE MODAL ==================== */

function openRecordSaleModal(){
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter: blur(4px);';

  const productOptions = DATA.reorder_all.map(p =>
    '<option value="' + p.id + '" data-stock="' + p.current_stock + '" data-price="' + p.unit_price + '">' + p.name + ' — ' + p.current_stock + ' in stock @ ' + fmtR(p.unit_price) + '</option>'
  ).join('');

  overlay.innerHTML = '<div style="background:#FBF8EF; border:1px solid rgba(0,0,0,0.15); border-radius:20px; max-width:520px; width:100%; padding:32px;">' +
    '<h2 style="font-family:\'Space Grotesk\'; font-size:22px; margin:0 0 6px; color:#000;">Record a sale</h2>' +
    '<p style="font-size:13px; color:#4A4A4A; margin:0 0 24px;">Select the product sold and enter the quantity.</p>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Product sold</label>' +
    '<select id="sale-product" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px; margin-bottom:18px;">' + productOptions + '</select>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Quantity sold</label>' +
    '<input type="number" id="sale-qty" min="1" value="1" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-family:\'Inter\'; font-size:14px; margin-bottom:18px;">' +
    '<div id="sale-summary" style="padding:14px; background:#F5F0E1; border-radius:10px; margin-bottom:20px; font-size:13px; color:#4A4A4A;">Select a product to see the summary.</div>' +
    '<div id="sale-error" style="color:#C4432B; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +
    '<div style="display:flex; gap:10px;">' +
      '<button id="sale-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button>' +
      '<button id="sale-submit" class="filter-btn active" style="flex:2; padding:12px;">Confirm sale</button>' +
    '</div></div>';

  document.body.appendChild(overlay);

  const select = overlay.querySelector('#sale-product');
  const qtyInput = overlay.querySelector('#sale-qty');
  const summary = overlay.querySelector('#sale-summary');
  const errorEl = overlay.querySelector('#sale-error');

  function updateSummary(){
    const opt = select.options[select.selectedIndex];
    const stock = parseInt(opt.dataset.stock);
    const price = parseFloat(opt.dataset.price);
    const qty = parseInt(qtyInput.value) || 0;
    const remaining = stock - qty;
    summary.innerHTML = '<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Unit price:</span><strong>' + fmtR(price) + '</strong></div><div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Total:</span><strong>' + fmtR(qty * price) + '</strong></div><div style="display:flex; justify-content:space-between;"><span>Stock after sale:</span><strong style="color:' + (remaining < 0 ? '#C4432B' : remaining < 10 ? '#D89A2E' : '#4C6B3F') + '">' + remaining + ' units</strong></div>';
    if (remaining < 0) errorEl.textContent = '❌ Not enough stock.';
    else errorEl.textContent = '';
  }
  select.onchange = updateSummary;
  qtyInput.oninput = updateSummary;
  updateSummary();

  overlay.querySelector('#sale-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#sale-submit').onclick = async () => {
    errorEl.textContent = '';
    const product_id = select.value;
    const quantity = parseInt(qtyInput.value);
    if (!quantity || quantity < 1){ errorEl.textContent = '❌ Quantity must be at least 1.'; return; }
    try {
      const res = await API.recordSale(product_id, quantity);
      const product = DATA.reorder_all.find(p => p.id === product_id);
      if (product) product.current_stock = res.product.current_stock;
      overlay.remove();
      alert('✅ ' + res.message);
      renderInventory();
    } catch (err){
      errorEl.textContent = '❌ ' + err.message;
    }
  };
}

/* ==================== ADD PRODUCT MODAL ==================== */

function openAddProductModal(){
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';

  const categoryOptions = Object.keys(CAT_HEX).map(c => '<option value="' + c + '">' + c + '</option>').join('');
  const supplierOptions = (DATA.suppliers || []).map(s => '<option value="' + s.id + '">' + s.name + '</option>').join('');

  overlay.innerHTML = '<div style="background:#FBF8EF; border:1px solid rgba(0,0,0,0.15); border-radius:20px; max-width:560px; width:100%; padding:32px;">' +
    '<h2 style="font-family:\'Space Grotesk\'; font-size:22px; margin:0 0 6px; color:#000;">Add new product</h2>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:16px 0;">' +
      '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Product ID</label><input id="new-id" placeholder="P0063" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px;"></div>' +
      '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Name</label><input id="new-name" placeholder="Product name" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px;"></div>' +
    '</div>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Category</label>' +
    '<select id="new-category" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:16px;">' + categoryOptions + '</select>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">' +
      '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Unit price (R)</label><input id="new-price" type="number" step="0.01" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px;"></div>' +
      '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Initial stock</label><input id="new-stock" type="number" value="0" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px;"></div>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">' +
      '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Reorder level</label><input id="new-reorder" type="number" value="20" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px;"></div>' +
      '<div><label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;">Supplier</label><select id="new-supplier" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px;"><option value="">(none)</option>' + supplierOptions + '</select></div>' +
    '</div>' +
    '<div id="add-product-error" style="color:#C4432B; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +
    '<div style="display:flex; gap:10px;"><button id="add-product-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button><button id="add-product-submit" class="filter-btn active" style="flex:2; padding:12px;">Create product</button></div>' +
    '</div>';

  document.body.appendChild(overlay);

  overlay.querySelector('#add-product-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#add-product-submit').onclick = async () => {
    const errorEl = overlay.querySelector('#add-product-error');
    errorEl.textContent = '';

    const payload = {
      id: overlay.querySelector('#new-id').value.trim(),
      name: overlay.querySelector('#new-name').value.trim(),
      category: overlay.querySelector('#new-category').value,
      unit_price: parseFloat(overlay.querySelector('#new-price').value),
      current_stock: parseInt(overlay.querySelector('#new-stock').value) || 0,
      reorder_level: parseInt(overlay.querySelector('#new-reorder').value) || 20,
      supplier_id: overlay.querySelector('#new-supplier').value || null
    };

    if (!payload.id || !payload.name || !payload.unit_price){ errorEl.textContent = '❌ ID, name, and price required.'; return; }
    if (isNaN(payload.unit_price) || payload.unit_price <= 0){ errorEl.textContent = '❌ Price must be positive.'; return; }

    try {
      await API.addProduct(payload);
      DATA.reorder_all.push({ id: payload.id, name: payload.name, category: payload.category, unit_price: payload.unit_price, current_stock: payload.current_stock, predicted_daily_demand: 0 });
      overlay.remove();
      alert('✅ ' + payload.name + ' added');
      renderInventory();
    } catch (err){
      errorEl.textContent = '❌ ' + err.message;
    }
  };
}

/* ==================== UPDATE STOCK MODAL ==================== */

function openUpdateStockModal(){
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';

  const productOptions = DATA.reorder_all.map(p =>
    '<option value="' + p.id + '" data-stock="' + p.current_stock + '">' + p.name + ' — ' + p.current_stock + ' units</option>'
  ).join('');

  overlay.innerHTML = '<div style="background:#FBF8EF; border:1px solid rgba(0,0,0,0.15); border-radius:20px; max-width:500px; width:100%; padding:32px;">' +
    '<h2 style="font-family:\'Space Grotesk\'; font-size:22px; margin:0 0 6px; color:#000;">Update stock</h2>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin:16px 0 8px; color:#000;">Product</label>' +
    '<select id="stock-product" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:18px;">' + productOptions + '</select>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px;">' +
      '<button id="mode-set" class="filter-btn active" style="padding:10px;">Set exact</button>' +
      '<button id="mode-receive" class="filter-btn" style="padding:10px;">Receive delivery</button>' +
    '</div>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#000;" id="qty-label">New stock level</label>' +
    '<input id="stock-qty" type="number" min="0" value="0" style="width:100%; padding:12px; background:#F5F0E1; border:1px solid rgba(0,0,0,0.15); border-radius:10px; color:#000; font-size:14px; margin-bottom:18px;">' +
    '<div id="stock-error" style="color:#C4432B; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +
    '<div style="display:flex; gap:10px;"><button id="stock-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button><button id="stock-submit" class="filter-btn active" style="flex:2; padding:12px;">Save</button></div>' +
    '</div>';

  document.body.appendChild(overlay);

  let mode = 'set';
  const setBtn = overlay.querySelector('#mode-set');
  const receiveBtn = overlay.querySelector('#mode-receive');
  const qtyLabel = overlay.querySelector('#qty-label');

  setBtn.onclick = () => { mode = 'set'; setBtn.classList.add('active'); receiveBtn.classList.remove('active'); qtyLabel.textContent = 'New stock level'; };
  receiveBtn.onclick = () => { mode = 'receive'; receiveBtn.classList.add('active'); setBtn.classList.remove('active'); qtyLabel.textContent = 'Quantity received'; };

  overlay.querySelector('#stock-cancel').onclick = () => overlay.remove();

  overlay.querySelector('#stock-submit').onclick = async () => {
    const errorEl = overlay.querySelector('#stock-error');
    errorEl.textContent = '';
    const product_id = overlay.querySelector('#stock-product').value;
    const qty = parseInt(overlay.querySelector('#stock-qty').value);

    if (isNaN(qty) || qty < 0){ errorEl.textContent = '❌ Enter a valid number.'; return; }

    try {
      const res = mode === 'set' ? await API.updateStock(product_id, qty) : await API.receiveStock(product_id, qty);
      const product = DATA.reorder_all.find(p => p.id === product_id);
      if (product) product.current_stock = res.product.current_stock;
      overlay.remove();
      alert('✅ ' + res.message);
      renderInventory();
    } catch (err){
      errorEl.textContent = '❌ ' + err.message;
    }
  };
}