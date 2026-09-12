// js/vendor-views.js

/* ==================== OVERVIEW ==================== */

function renderOverview(){
  const el = document.getElementById('view-overview');
  const k = DATA.kpis;
  el.innerHTML = '<div class="hero"><div class="hero-figure"><div class="label">Total revenue, ' + k.date_start + ' — ' + k.date_end + '</div><div class="num display"><span class="unit">R</span>' + (k.total_revenue/1000000).toFixed(2) + '<span class="unit" style="font-size:32px;color:var(--ink);margin-left:4px;">M</span></div></div><div class="hero-sub">Across ' + fmtNum(k.total_transactions) + ' transactions, ' + k.num_vendors + ' vendors carrying ' + k.num_products + ' products in ' + k.num_categories + ' categories, ' + k.num_cities + ' cities.</div></div>'
    + '<div class="kpi-row"><div class="kpi"><div class="v">' + fmtR(k.total_profit) + '</div><div class="l">Total profit</div></div><div class="kpi"><div class="v">' + k.avg_margin + '%</div><div class="l">Average margin</div></div><div class="kpi"><div class="v">' + fmtNum(k.total_units) + '</div><div class="l">Units sold</div></div><div class="kpi"><div class="v">' + k.num_vendors + '</div><div class="l">Active vendors</div></div><div class="kpi"><div class="v">' + k.num_products + '</div><div class="l">SKUs tracked</div></div></div>'
    + '<div class="grid grid-2" style="margin-top:24px;"><div class="panel"><h2>Revenue &amp; profit by month</h2><p class="sub">Monthly totals across the trading year, all cities combined.</p><div class="chart-wrap" style="height:300px;"><canvas id="chart-monthly"></canvas></div></div><div class="panel"><h2>Revenue by category</h2><p class="sub">Where the money moves across the product range.</p><div class="chart-wrap" style="height:300px;"><canvas id="chart-category"></canvas></div></div></div>'
    + '<div class="panel"><h2>Top 10 products by revenue</h2><p class="sub">Best sellers across the full vendor network.</p><table><thead><tr><th>Product</th><th>Category</th><th class="num">Units sold</th><th class="num">Revenue</th><th class="num">Profit</th></tr></thead><tbody>'
    + DATA.top_products.map(p => '<tr><td class="name-cell">' + p.name + '</td><td><span class="swatch" style="background:' + CAT_HEX[p.category] + '"></span> ' + p.category + '</td><td class="num">' + fmtNum(p.units) + '</td><td class="num">' + fmtR(p.revenue) + '</td><td class="num">' + fmtR(p.profit) + '</td></tr>').join('')
    + '</tbody></table></div>';

  new Chart(document.getElementById('chart-monthly'), {type:'line',data:{labels:DATA.monthly.map(m=>m.month),datasets:[{label:'Revenue',data:DATA.monthly.map(m=>m.revenue),borderColor:VERM,backgroundColor:'rgba(196,67,43,0.15)',fill:true,tension:0.25,pointRadius:3,borderWidth:2.5},{label:'Profit',data:DATA.monthly.map(m=>m.profit),borderColor:INDIGO,backgroundColor:'transparent',tension:0.25,pointRadius:3,borderWidth:2,borderDash:[4,3]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',align:'end',labels:{boxWidth:12,usePointStyle:true}}},scales:{y:{grid:{color:LINE},ticks:{callback:v=>fmtR(v)}},x:{grid:{display:false}}}}});
  new Chart(document.getElementById('chart-category'), {type:'bar',data:{labels:DATA.categories.map(c=>c.category),datasets:[{data:DATA.categories.map(c=>c.revenue),backgroundColor:DATA.categories.map(c=>CAT_HEX[c.category]),borderColor:INK,borderWidth:1}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:LINE},ticks:{callback:v=>fmtR(v)}},y:{grid:{display:false}}}}});
}

/* ==================== SALES ==================== */

function renderSales(){
  const el = document.getElementById('view-sales');
  el.innerHTML = '<div class="grid grid-2"><div class="panel"><h2>Revenue by city</h2><p class="sub">Where the network trade is concentrated.</p><div class="chart-wrap" style="height:320px;"><canvas id="chart-city"></canvas></div></div><div class="panel"><h2>Revenue by vendor type</h2><p class="sub">Food stalls carry the network, but accessories and snacks add margin.</p><div class="chart-wrap" style="height:320px;"><canvas id="chart-vendortype"></canvas></div></div></div>'
    + '<div class="grid grid-3"><div class="panel"><h2>Demand level mix</h2><p class="sub">Share of transactions by recorded demand.</p><div class="chart-wrap" style="height:220px;"><canvas id="chart-demand"></canvas></div></div><div class="panel"><h2>Weather effect</h2><p class="sub">Average units sold per transaction, by weather.</p><div class="chart-wrap" style="height:220px;"><canvas id="chart-weather"></canvas></div></div><div class="panel"><h2>Weekday vs weekend</h2><p class="sub">Average units sold per transaction.</p><div class="chart-wrap" style="height:220px;"><canvas id="chart-weekend"></canvas></div></div></div>';
  new Chart(document.getElementById('chart-city'),{type:'bar',data:{labels:DATA.cities.map(c=>c.city),datasets:[{data:DATA.cities.map(c=>c.revenue),backgroundColor:INDIGO,borderColor:INK,borderWidth:1}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:LINE},ticks:{callback:v=>fmtR(v)}},y:{grid:{display:false}}}}});
  new Chart(document.getElementById('chart-vendortype'),{type:'bar',data:{labels:DATA.vendor_types.map(c=>c.type),datasets:[{data:DATA.vendor_types.map(c=>c.revenue),backgroundColor:MARIGOLD,borderColor:INK,borderWidth:1}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:LINE},ticks:{callback:v=>fmtR(v)}},y:{grid:{display:false}}}}});
  const dc={High:VERM,Medium:MARIGOLD,Low:GREEN};
  new Chart(document.getElementById('chart-demand'),{type:'doughnut',data:{labels:DATA.demand_levels.map(d=>d.level),datasets:[{data:DATA.demand_levels.map(d=>d.count),backgroundColor:DATA.demand_levels.map(d=>dc[d.level]),borderColor:'#FBF8EF',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{boxWidth:10,padding:10,color:'#6B675C'}}}}});
  new Chart(document.getElementById('chart-weather'),{type:'bar',data:{labels:DATA.weather.map(w=>w.weather),datasets:[{data:DATA.weather.map(w=>w.avg_qty),backgroundColor:GREEN,borderColor:INK,borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:LINE}},x:{grid:{display:false}}}}});
  const wk=DATA.weekend.map(w=>w.Is_Weekend==='Yes'?'Weekend':'Weekday');
  new Chart(document.getElementById('chart-weekend'),{type:'bar',data:{labels:wk,datasets:[{data:DATA.weekend.map(w=>w.avg_qty),backgroundColor:[VERM,INDIGO],borderColor:INK,borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{grid:{color:LINE}},x:{grid:{display:false}}}}});
}

/* ==================== FORECAST ==================== */

function renderForecast(){
  const el = document.getElementById('view-forecast');
  const mp = DATA.model_perf;
  el.innerHTML = '<div class="panel"><h2>XGBoost demand model — held-out performance</h2><p class="sub">Accuracy on ' + fmtNum(mp.n) + ' held-out predictions of daily unit demand.</p><div class="stat-strip"><div class="cell"><div class="v">' + mp.r2 + '</div><div class="l">R² score</div></div><div class="cell"><div class="v">' + mp.mae + '</div><div class="l">Mean absolute error (units)</div></div><div class="cell"><div class="v">' + mp.rmse + '</div><div class="l">RMSE (units)</div></div><div class="cell"><div class="v">' + mp.mape + '%</div><div class="l">Mean absolute % error</div></div></div></div>'
    + '<div class="grid grid-2"><div class="panel"><h2>Predicted vs actual demand</h2><p class="sub">Each point is one held-out day; the dashed line is a perfect prediction.</p><div class="chart-wrap" style="height:340px;"><canvas id="chart-scatter"></canvas></div></div><div class="panel"><h2>What drives the forecast</h2><p class="sub">Top features by XGBoost importance.</p><div class="chart-wrap" style="height:340px;"><canvas id="chart-features"></canvas></div></div></div>';
  const maxV = Math.max.apply(null, DATA.pred_scatter.map(p=>Math.max(p.actual,p.predicted)))*1.05;
  new Chart(document.getElementById('chart-scatter'),{type:'scatter',data:{datasets:[{label:'Predictions',data:DATA.pred_scatter.map(p=>({x:p.actual,y:p.predicted})),backgroundColor:'rgba(196,67,43,0.6)',borderColor:VERM,pointRadius:3.5},{label:'Perfect prediction',data:[{x:0,y:0},{x:maxV,y:maxV}],type:'line',borderColor:INK,borderDash:[5,4],borderWidth:1.5,pointRadius:0,fill:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',align:'end',labels:{boxWidth:12,usePointStyle:true}}},scales:{x:{title:{display:true,text:'Actual units sold'},grid:{color:LINE}},y:{title:{display:true,text:'Predicted units sold'},grid:{color:LINE}}}}});
  const feats = DATA.feature_importance.slice().reverse();
  new Chart(document.getElementById('chart-features'),{type:'bar',data:{labels:feats.map(f=>f.feature),datasets:[{data:feats.map(f=>f.importance),backgroundColor:INDIGO,borderColor:INK,borderWidth:1}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:LINE}},y:{grid:{display:false},ticks:{font:{size:11}}}}}});
}

/* ==================== AI PREDICTIONS (with discounts) ==================== */

async function renderPredictions(){
  const el = document.getElementById('view-predictions');
  el.innerHTML = '<div class="panel"><p class="sub">Loading predictions from the AI model…</p></div>';

  let predictions = [];
  let metrics = null;
  let discounts = [];

  try {
    predictions = await API.predictions();
    metrics = await API.modelMetrics();
    discounts = await API.discounts();
  } catch (err){
    el.innerHTML = '<div class="panel"><h2>AI Predictions unavailable</h2><p class="sub">Could not reach the model endpoint. Make sure the backend is running and predictions.json exists.</p><p class="sub" style="color:var(--danger);">' + err.message + '</p></div>';
    return;
  }

  predictions.sort((a,b) => b.predicted_daily_demand - a.predicted_daily_demand);

  const totalDemand = predictions.reduce((s,p) => s + p.predicted_daily_demand, 0);
  const avgDemand = totalDemand / predictions.length;
  const topProduct = predictions[0];
  const discountedCount = predictions.filter(p => discounts.find(d => d.product_id === p.product_id)).length;

  const metricsHtml = metrics && metrics['XGBoost']
    ? '<div class="panel"><h2>Model comparison</h2><p class="sub">All four models trained on the same data. XGBoost performs best.</p><table><thead><tr><th>Model</th><th class="num">MAE (units)</th><th class="num">RMSE (units)</th><th class="num">R²</th></tr></thead><tbody>' + Object.entries(metrics).map(([name, m]) => '<tr style="' + (name === 'XGBoost' ? 'background:rgba(196,67,43,0.08);font-weight:600;' : '') + '"><td class="name-cell">' + name + (name === 'XGBoost' ? ' ⭐' : '') + '</td><td class="num">' + m.mae.toFixed(2) + '</td><td class="num">' + m.rmse.toFixed(2) + '</td><td class="num">' + m.r2.toFixed(3) + '</td></tr>').join('') + '</tbody></table></div>'
    : '';

  el.innerHTML = '<div class="stat-strip" style="margin-bottom:22px;"><div class="cell"><div class="v">' + predictions.length + '</div><div class="l">Products forecasted</div></div><div class="cell"><div class="v">' + avgDemand.toFixed(1) + '</div><div class="l">Avg predicted units/day</div></div><div class="cell"><div class="v">' + topProduct.predicted_daily_demand.toFixed(1) + '</div><div class="l">Top: ' + topProduct.product_name + '</div></div><div class="cell"><div class="v" style="color:var(--success);">' + discountedCount + '</div><div class="l">With discount offers</div></div></div>'
    + metricsHtml
    + '<div class="panel"><h2>Predicted daily demand — all products</h2><p class="sub">Generated live from the trained XGBoost model. Products with supplier discounts are flagged. Sorted by highest predicted demand.</p><div class="table-scroll" style="max-height:560px;"><table><thead><tr><th>#</th><th>Product</th><th>Category</th><th class="num">Unit price</th><th class="num">Current stock</th><th class="num">Predicted units/day</th><th class="num">Days of stock</th><th>Offer</th></tr></thead><tbody>'
    + predictions.map((p, i) => {
      const days = p.current_stock / p.predicted_daily_demand;
      const daysClass = days < 3 ? 'style="color:var(--danger);font-weight:600"' :
                        days < 7 ? 'style="color:var(--warning);font-weight:600"' : '';
      const discount = discounts.find(d => d.product_id === p.product_id);
      return '<tr>' +
        '<td class="sub-cell">' + (i + 1) + '</td>' +
        '<td class="name-cell">' + p.product_name + '</td>' +
        '<td><span class="swatch" style="background:' + (CAT_HEX[p.category] || '#999') + '"></span> ' + p.category + '</td>' +
        '<td class="num">' + fmtR(p.unit_price) + '</td>' +
        '<td class="num">' + fmtNum(p.current_stock) + '</td>' +
        '<td class="num"><strong>' + p.predicted_daily_demand.toFixed(2) + '</strong></td>' +
        '<td class="num" ' + daysClass + '>' + days.toFixed(1) + '</td>' +
        '<td>' + (discount ? '<span class="chip low">🔥 ' + discount.discount_percent + '% off</span><br><span style="font-size:10px;color:var(--muted);">min ' + discount.min_quantity + '</span>' : '<span style="color:var(--muted);">—</span>') + '</td>' +
      '</tr>';
    }).join('')
    + '</tbody></table></div></div>';
}

/* ==================== INVENTORY & REORDER ==================== */

let reorderFilter = 'All';

function renderInventory(){
  const el = document.getElementById('view-inventory');
  const nn = DATA.reorder_decision_counts.find(d=>d.decision==='NO ORDER NEEDED');
  const on = DATA.reorder_decision_counts.find(d=>d.decision==='ORDER NOW');
  const os = DATA.reorder_decision_counts.find(d=>d.decision==='ORDER SOON');
  el.innerHTML='<div class="stat-strip" style="margin-bottom:24px;"><div class="cell"><div class="v" style="color:var(--danger)">' + (on?on.count:0) + '</div><div class="l">SKUs — order now</div></div><div class="cell"><div class="v" style="color:var(--warning)">' + (os?os.count:0) + '</div><div class="l">SKUs — order soon</div></div><div class="cell"><div class="v" style="color:var(--success)">' + (nn?nn.count:0) + '</div><div class="l">SKUs — no order needed</div></div><div class="cell"><div class="v">' + fmtR(DATA.total_reorder_cost) + '</div><div class="l">Estimated reorder spend</div></div></div>'
    + '<div class="grid grid-2"><div class="panel"><h2>Stock status across the network</h2><p class="sub">62 SKUs classified by current inventory position.</p><div class="chart-wrap" style="height:260px;"><canvas id="chart-stockstatus"></canvas></div></div><div class="panel"><h2>Lowest days of stock remaining</h2><p class="sub">The 15 products closest to running out.</p><div class="table-scroll" style="max-height:260px;"><table><thead><tr><th>Product</th><th class="num">Stock</th><th class="num">Days left</th><th>Status</th></tr></thead><tbody>'
    + DATA.low_stock_items.map(i => '<tr><td class="name-cell">' + i.name + '<div class="sub-cell">' + i.category + '</div></td><td class="num">' + i.current_stock + '</td><td class="num">' + i.days_remaining + '</td><td>' + statusChip(i.status) + '</td></tr>').join('')
    + '</tbody></table></div></div></div>'
    + '<div class="panel"><h2>AI reorder recommendations</h2><p class="sub">Generated from predicted daily demand, supplier lead time and safety stock. Filter by priority.</p><div class="filter-row" id="reorder-filters"></div><div class="table-scroll"><table><thead><tr><th>Product</th><th>Priority</th><th>Decision</th><th class="num">Predicted demand/day</th><th class="num">Order qty</th><th class="num">Est. cost</th><th>Supplier</th></tr></thead><tbody id="reorder-body"></tbody></table></div></div>';
  new Chart(document.getElementById('chart-stockstatus'),{type:'doughnut',data:{labels:DATA.stock_status.map(s=>s.status),datasets:[{data:DATA.stock_status.map(s=>s.count),backgroundColor:DATA.stock_status.map(s=>({'Low Stock':VERM,'Monitor':MARIGOLD,'In Stock':GREEN,'Overstocked':INDIGO}[s.status]||'#999')),borderColor:'#FBF8EF',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'bottom',labels:{boxWidth:10,padding:10,color:'#6B675C'}}}}});
  const fRow = document.getElementById('reorder-filters');
  ['All','High','Medium','Low'].forEach(f=>{
    const b = document.createElement('button');
    b.className = 'filter-btn' + (f===reorderFilter?' active':'');
    b.textContent = f==='All'?'All priorities':f+' priority';
    b.onclick = () => {reorderFilter=f;renderReorderTable();document.querySelectorAll('#reorder-filters .filter-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');};
    fRow.appendChild(b);
  });
  renderReorderTable();

  // Button bar wrapper
  const bar = document.createElement('div');
  bar.id = 'inventory-button-bar';
  bar.className = 'filter-row';
  bar.style.marginBottom = '22px';
  bar.innerHTML =
    '<button id="record-sale-btn" class="filter-btn active" style="background:linear-gradient(135deg,var(--brand),var(--brand-2));color:#fff;border:none;font-weight:700;padding:10px 20px;">➕ Record a sale</button>' +
    '<button id="add-product-btn" class="filter-btn" style="padding:10px 20px;">➕ Add product</button>' +
    '<button id="update-stock-btn" class="filter-btn" style="padding:10px 20px;">✏️ Update stock</button>' +
    '<button id="refresh-inventory-btn" class="filter-btn" style="padding:10px 20px;">🔄 Refresh</button>';
  el.insertBefore(bar, el.firstChild);
  document.getElementById('record-sale-btn').onclick = openRecordSaleModal;
  document.getElementById('add-product-btn').onclick = openAddProductModal;
  document.getElementById('update-stock-btn').onclick = openUpdateStockModal;
  document.getElementById('refresh-inventory-btn').onclick = renderInventory;
}

function renderReorderTable(){
  const body = document.getElementById('reorder-body');
  if (!body) return;
  const rows = DATA.reorder_all.filter(r=>reorderFilter==='All'||r.priority===reorderFilter);
  body.innerHTML = rows.map(r=>'<tr><td class="name-cell">' + r.name + '<div class="sub-cell">' + r.category + ' · ' + r.current_stock + ' in stock</div></td><td>' + priorityChip(r.priority) + '</td><td>' + decisionChip(r.decision) + '</td><td class="num">' + r.predicted_daily_demand + '</td><td class="num">' + fmtNum(r.order_qty) + '</td><td class="num">' + fmtR(r.est_cost) + '</td><td>' + r.supplier + '</td></tr>').join('');
}

/* ==================== SUPPLIERS (vendor view) ==================== */

function renderSuppliers(){
  const el = document.getElementById('view-suppliers');
  el.innerHTML = '<div class="grid grid-2"><div class="panel"><h2>Supplier rating vs. on-time delivery</h2><p class="sub">Each point is one supplier; upper-right is the sweet spot.</p><div class="chart-wrap" style="height:320px;"><canvas id="chart-supplier-scatter"></canvas></div></div><div class="panel"><h2>Supplier status</h2><p class="sub">Tiering used to prioritise reorder routing.</p><div class="chart-wrap" style="height:320px;"><canvas id="chart-supplier-status"></canvas></div></div></div>'
    + '<div class="panel"><h2>Supplier directory</h2><p class="sub">All ' + DATA.suppliers.length + ' active suppliers, ranked by rating.</p><div class="table-scroll" style="max-height:420px;"><table><thead><tr><th>Supplier</th><th>City</th><th>Category</th><th class="num">Rating</th><th class="num">On-time %</th><th class="num">Quality</th><th class="num">Lead time</th><th>Status</th></tr></thead><tbody>'
    + DATA.suppliers.map(s => '<tr><td class="name-cell">' + s.name + '</td><td>' + s.city + '</td><td>' + s.category + '</td><td class="num">' + s.rating.toFixed(1) + '</td><td class="num">' + s.on_time + '%</td><td class="num">' + s.quality + '</td><td class="num">' + s.lead_time + 'd</td><td><span class="chip ' + (s.status==='Preferred'?'low':s.status==='Reliable'?'medium':'soon') + '">' + s.status + '</span></td></tr>').join('')
    + '</tbody></table></div></div>';
  new Chart(document.getElementById('chart-supplier-scatter'),{type:'scatter',data:{datasets:[{label:'Suppliers',data:DATA.suppliers.map(s=>({x:s.on_time,y:s.rating,label:s.name})),backgroundColor:'rgba(196,67,43,0.6)',borderColor:INDIGO,pointRadius:5,pointHoverRadius:7}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.raw.label+': rating '+ctx.raw.y+', on-time '+ctx.raw.x+'%'}}},scales:{x:{title:{display:true,text:'On-time delivery %'},grid:{color:LINE}},y:{title:{display:true,text:'Supplier rating'},grid:{color:LINE}}}}});
  const sc = {Preferred:GREEN,Reliable:MARIGOLD,Active:INDIGO};
  new Chart(document.getElementById('chart-supplier-status'),{type:'doughnut',data:{labels:DATA.supplier_status.map(s=>s.status),datasets:[{data:DATA.supplier_status.map(s=>s.count),backgroundColor:DATA.supplier_status.map(s=>sc[s.status]||'#999'),borderColor:'#FBF8EF',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'60%',plugins:{legend:{position:'bottom',labels:{boxWidth:10,padding:10,color:'#6B675C'}}}}});
}

/* ==================== RECORD SALE MODAL ==================== */

function openRecordSaleModal(){
  const overlay = document.createElement('div');
  overlay.id = 'sale-modal-overlay';
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(10,22,40,0.75); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter: blur(4px);';

  const productOptions = DATA.reorder_all.map(p =>
    '<option value="' + p.id + '" data-stock="' + p.current_stock + '" data-price="' + p.unit_price + '">' + p.name + ' — ' + p.current_stock + ' in stock @ ' + fmtR(p.unit_price) + '</option>'
  ).join('');

  overlay.innerHTML = `
    <div style="background:var(--panel); border:1px solid var(--line-2); border-radius:20px; max-width:520px; width:100%; padding:32px; box-shadow:var(--shadow-lg);">
      <h2 style="font-family:'Space Grotesk'; font-size:22px; margin:0 0 6px; color:var(--ink);">Record a sale</h2>
      <p style="font-size:13px; color:var(--muted); margin:0 0 24px;">Select the product sold and enter the quantity. Stock will update automatically.</p>

      <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Product sold</label>
      <select id="sale-product" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; margin-bottom:18px;">
        ${productOptions}
      </select>

      <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Quantity sold</label>
      <input type="number" id="sale-qty" min="1" value="1" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; margin-bottom:18px;">

      <div id="sale-summary" style="padding:14px; background:var(--bg-soft); border-radius:10px; margin-bottom:20px; font-size:13px; color:var(--ink-soft);">Select a product to see the summary.</div>

      <div id="sale-error" style="color:var(--danger); font-size:13px; min-height:18px; margin-bottom:14px;"></div>

      <div style="display:flex; gap:10px;">
        <button id="sale-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button>
        <button id="sale-submit" style="flex:2; padding:12px; background:linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%); color:#fff; border:none; border-radius:10px; font-family:'Inter'; font-weight:700; font-size:14px; cursor:pointer;">Confirm sale</button>
      </div>
    </div>`;

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
    const total = qty * price;
    const remaining = stock - qty;
    summary.innerHTML = '<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Unit price:</span><strong>' + fmtR(price) + '</strong></div><div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Total:</span><strong>' + fmtR(total) + '</strong></div><div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Stock after sale:</span><strong style="color:' + (remaining < 0 ? 'var(--danger)' : remaining < 10 ? 'var(--warning)' : 'var(--success)') + '">' + remaining + ' units</strong></div>';
    if (remaining < 0) errorEl.textContent = '❌ Not enough stock for this sale.';
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
      alert('✅ ' + res.message + '\nNew stock: ' + res.product.current_stock);
      renderInventory();
    } catch (err){
      errorEl.textContent = '❌ ' + err.message;
    }
  };
}

/* ==================== ADD PRODUCT MODAL ==================== */

function openAddProductModal(){
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(10,22,40,0.75); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter: blur(4px);';

  const categoryOptions = Object.keys(CAT_HEX).map(c => '<option value="' + c + '">' + c + '</option>').join('');
  const supplierOptions = (DATA.suppliers || []).map(s => '<option value="' + s.id + '">' + s.name + '</option>').join('');

  overlay.innerHTML = `
    <div style="background:var(--panel); border:1px solid var(--line-2); border-radius:20px; max-width:560px; width:100%; padding:32px; box-shadow:var(--shadow-lg); max-height:90vh; overflow-y:auto;">
      <h2 style="font-family:'Space Grotesk'; font-size:22px; margin:0 0 6px; color:var(--ink);">Add new product</h2>
      <p style="font-size:13px; color:var(--muted); margin:0 0 24px;">Create a new product in your catalogue.</p>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Product ID</label>
          <input id="new-id" placeholder="P0063" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Name</label>
          <input id="new-name" placeholder="Product name" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
      </div>

      <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Category</label>
      <select id="new-category" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; margin-bottom:16px;">
        ${categoryOptions}
      </select>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Unit price (R)</label>
          <input id="new-price" type="number" step="0.01" min="0" placeholder="15.00" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Initial stock</label>
          <input id="new-stock" type="number" min="0" placeholder="50" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Reorder level</label>
          <input id="new-reorder" type="number" min="0" placeholder="20" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
        </div>
        <div>
          <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Supplier</label>
          <select id="new-supplier" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px;">
            <option value="">(none)</option>
            ${supplierOptions}
          </select>
        </div>
      </div>

      <div id="add-product-error" style="color:var(--danger); font-size:13px; min-height:18px; margin-bottom:14px;"></div>

      <div style="display:flex; gap:10px;">
        <button id="add-product-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button>
        <button id="add-product-submit" style="flex:2; padding:12px; background:linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%); color:#fff; border:none; border-radius:10px; font-family:'Inter'; font-weight:700; font-size:14px; cursor:pointer;">Create product</button>
      </div>
    </div>`;

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

    if (!payload.id || !payload.name || !payload.unit_price){
      errorEl.textContent = '❌ ID, name, and unit price are required.';
      return;
    }
    if (isNaN(payload.unit_price) || payload.unit_price <= 0){
      errorEl.textContent = '❌ Unit price must be a positive number.';
      return;
    }

    try {
      const res = await API.addProduct(payload);
      DATA.reorder_all.push({
        id: payload.id,
        name: payload.name,
        category: payload.category,
        unit_price: payload.unit_price,
        current_stock: payload.current_stock,
        predicted_daily_demand: 0
      });
      overlay.remove();
      alert('✅ ' + payload.name + ' added to catalogue');
      renderInventory();
    } catch (err){
      errorEl.textContent = '❌ ' + err.message;
    }
  };
}

/* ==================== UPDATE STOCK MODAL ==================== */

function openUpdateStockModal(){
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(10,22,40,0.75); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter: blur(4px);';

  const productOptions = DATA.reorder_all.map(p =>
    '<option value="' + p.id + '" data-stock="' + p.current_stock + '">' + p.name + ' — ' + p.current_stock + ' units</option>'
  ).join('');

  overlay.innerHTML = `
    <div style="background:var(--panel); border:1px solid var(--line-2); border-radius:20px; max-width:500px; width:100%; padding:32px; box-shadow:var(--shadow-lg);">
      <h2 style="font-family:'Space Grotesk'; font-size:22px; margin:0 0 6px; color:var(--ink);">Update stock</h2>
      <p style="font-size:13px; color:var(--muted); margin:0 0 24px;">Set a new stock level, or receive a delivery.</p>

      <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);">Product</label>
      <select id="stock-product" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; margin-bottom:18px;">
        ${productOptions}
      </select>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px;">
        <button id="mode-set" class="filter-btn active" style="padding:10px;">Set exact</button>
        <button id="mode-receive" class="filter-btn" style="padding:10px;">Receive delivery</button>
      </div>

      <label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:var(--ink);" id="qty-label">New stock level</label>
      <input id="stock-qty" type="number" min="0" value="0" style="width:100%; padding:12px; background:var(--bg-soft); border:1px solid var(--line-2); border-radius:10px; color:var(--ink); font-family:'Inter'; font-size:14px; margin-bottom:18px;">

      <div id="stock-error" style="color:var(--danger); font-size:13px; min-height:18px; margin-bottom:14px;"></div>

      <div style="display:flex; gap:10px;">
        <button id="stock-cancel" class="filter-btn" style="flex:1; padding:12px;">Cancel</button>
        <button id="stock-submit" style="flex:2; padding:12px; background:linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%); color:#fff; border:none; border-radius:10px; font-family:'Inter'; font-weight:700; font-size:14px; cursor:pointer;">Save</button>
      </div>
    </div>`;

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

    if (isNaN(qty) || qty < 0){
      errorEl.textContent = '❌ Quantity must be a non-negative number.';
      return;
    }

    try {
      let res;
      if (mode === 'set'){
        res = await API.updateStock(product_id, qty);
      } else {
        res = await API.receiveStock(product_id, qty);
      }

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