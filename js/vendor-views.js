// js/vendor-views.js

function marketAvgForCategory(category){
  const items = (DATA.reorder_all || []).filter(p => p.category === category);
  if (items.length === 0) return 0;
  return items.reduce((s, p) => s + (p.unit_price || 0), 0) / items.length;
}
function priceAdvice(price, category){
  const avg = marketAvgForCategory(category);
  if (!avg || !price) return { avg: 0, label: '-', color: '#6B6B6B' };
  const r = price / avg;
  if (r < 0.85) return { avg, label: 'Below market - could raise', color: '#1E4E8C' };
  if (r > 1.15) return { avg, label: Math.round((r-1)*100) + '% above market', color: '#C4432B' };
  return { avg, label: 'Fair', color: '#4C6B3F' };
}
function suggestedPriceFromCost(cost){ return Math.round(cost * 1.4 * 100) / 100; }

/* OVERVIEW */
async function renderOverview(){
  const el = document.getElementById('view-overview');
  el.innerHTML = '<div class="panel"><p class="sub">Loading your store…</p></div>';

  let vendor = null, stats = null;
  try { vendor = await API.request('/vendors/me'); } catch (e){}
  try { stats = await API.request('/vendors/me/stats'); } catch (e){}

  const revenue = (stats && stats.revenue) || 0;
  const profit = (stats && stats.profit) || 0;
  const units = (stats && stats.units) || 0;
  const transactions = (stats && stats.transactions) || 0;
  const skus = (stats && stats.skus_sold) || 0;

  el.innerHTML =
    '<div class="dash-header">' +
      '<div>' +
        (vendor ? '<div class="dh-meta"><span class="dot"></span>' + vendor.id + ' · ' + vendor.city + ' · ' + vendor.type + '</div>' : '') +
        '<div class="display" style="font-size:22px;">Welcome back</div>' +
        '<div class="sub" style="color:var(--muted); font-size:13px; margin-top:4px;">Here is how your store is doing.</div>' +
      '</div>' +
      '<div class="dh-figure">' +
        '<div class="label">Store revenue</div>' +
        '<div class="num">R' + (revenue/1000).toFixed(1) + '<span class="unit">K</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="kpi-row">' +
      '<div class="kpi"><div class="v">' + fmtR(profit) + '</div><div class="l">Your profit</div></div>' +
      '<div class="kpi"><div class="v">' + fmtNum(units) + '</div><div class="l">Units sold</div></div>' +
      '<div class="kpi"><div class="v">' + fmtNum(transactions) + '</div><div class="l">Transactions</div></div>' +
      '<div class="kpi"><div class="v">' + fmtNum(skus) + '</div><div class="l">Products tracked</div></div>' +
    '</div>' +
    '<div class="section-head"><h3>Quick actions</h3></div>' +
    '<div class="action-grid">' +
      '<button class="action-tile" onclick="showTab(\'predictions\')"><div class="at-icon">📦</div><div><div class="at-label">What to stock</div><div class="at-sub">AI reorder guidance</div></div></button>' +
      '<button class="action-tile" onclick="showTab(\'inventory\')"><div class="at-icon">💰</div><div><div class="at-label">Record sales</div><div class="at-sub">Log a transaction</div></div></button>' +
      '<button class="action-tile" onclick="showTab(\'inventory\')"><div class="at-icon">📈</div><div><div class="at-label">Update stock</div><div class="at-sub">Adjust stock levels</div></div></button>' +
      '<button class="action-tile" onclick="showTab(\'suppliers\')"><div class="at-icon">🏪</div><div><div class="at-label">Suppliers</div><div class="at-sub">Browse the directory</div></div></button>' +
    '</div>' +
    '<div class="filter-row" style="margin-top:26px;">' +
      '<button id="export-vendor-pdf" class="filter-btn active" style="font-weight:700;padding:10px 20px;">📄 Download PDF report</button>' +
      '<button id="export-vendor-csv" class="filter-btn" style="padding:10px 20px;">📥 Export CSV</button>' +
    '</div>';

  const pdfBtn = document.getElementById('export-vendor-pdf');
  if (pdfBtn) pdfBtn.onclick = () => {
    const cols = ['Item', 'Value'];
    const rows = [
      ['Store ID', vendor ? vendor.id : '—'],
      ['City', vendor ? vendor.city : '—'],
      ['Type', vendor ? vendor.type : '—'],
      ['Revenue', fmtR(revenue)],
      ['Profit (est.)', fmtR(profit)],
      ['Units sold', fmtNum(units)],
      ['Transactions', fmtNum(transactions)],
      ['Products tracked', fmtNum(skus)],
      ['Generated', new Date().toLocaleString()]
    ];
    exportPDF('Vendor Report — ' + (vendor ? vendor.id : 'Store'), 'Store activity summary', cols, rows, 'vendor-report-' + new Date().toISOString().slice(0,10) + '.pdf');
  };

  const csvBtn = document.getElementById('export-vendor-csv');
  if (csvBtn) csvBtn.onclick = () => {
    const rows = [{
      'Store ID': vendor ? vendor.id : '',
      'City': vendor ? vendor.city : '',
      'Type': vendor ? vendor.type : '',
      'Revenue (R)': revenue,
      'Profit (R)': profit,
      'Units sold': units,
      'Transactions': transactions,
      'Products tracked': skus
    }];
    exportCSV('vendor-report-' + new Date().toISOString().slice(0,10) + '.csv', rows);
  };
}

/* SALES */
async function renderSales(){
  const el = document.getElementById('view-sales');
  el.innerHTML = '<div class="panel"><p class="sub">Loading your sales…</p></div>';

  let sales = [];
  let trend = null;
  try {
    sales = await API.salesLog();
    trend = await API.request('/vendors/me/sales-trend?days=30');
  } catch (err){
    el.innerHTML = '<div class="panel"><h2>Could not load sales</h2><p class="sub" style="color:var(--danger);">' + err.message + '</p></div>';
    return;
  }

  const hasSales = sales && sales.length > 0;

  // KPI block
  const totalRevenue = hasSales ? sales.reduce((s, r) => s + (r.total_amount || 0), 0) : 0;
  const totalUnits = hasSales ? sales.reduce((s, r) => s + (r.quantity || 0), 0) : 0;

  el.innerHTML =
    '<div class="filter-row" style="margin-bottom:22px;">' +
      '<button class="filter-btn active trend-btn" data-days="7">Last 7 days</button>' +
      '<button class="filter-btn trend-btn" data-days="30">Last 30 days</button>' +
      '<button class="filter-btn trend-btn" data-days="365">Last 365 days</button>' +
    '</div>' +

    '<div class="stat-strip" style="margin-bottom:24px;">' +
      '<div class="cell"><div class="v">' + fmtNum(sales.length) + '</div><div class="l">sales recorded</div></div>' +
      '<div class="cell"><div class="v">' + fmtNum(totalUnits) + '</div><div class="l">units sold</div></div>' +
      '<div class="cell"><div class="v">' + fmtR(totalRevenue) + '</div><div class="l">total revenue</div></div>' +
      '<div class="cell"><div class="v" id="trend-total">' + fmtR(trend ? trend.total_revenue : 0) + '</div><div class="l" id="trend-label">last 30 days</div></div>' +
    '</div>' +

    '<div class="panel">' +
      '<h2>Sales trend</h2>' +
      '<p class="sub">Revenue and units sold over time.</p>' +
      '<div class="chart-wrap" style="height:320px;"><canvas id="vendor-sales-trend"></canvas></div>' +
    '</div>' +

    '<div class="panel" style="margin-top:24px;">' +
      '<h2>Product trends</h2>' +
      '<p class="sub">Your sales per product (solid) vs regional average (dashed) — last 90 days.</p>' +
      '<div class="filter-row" style="margin-bottom:16px;">' +
        '<button class="filter-btn active pt-trend-btn" data-days="30">Last 30 days</button>' +
        '<button class="filter-btn pt-trend-btn" data-days="90">Last 90 days</button>' +
        '<button class="filter-btn pt-trend-btn" data-days="180">Last 180 days</button>' +
      '</div>' +
      '<div id="pt-status" class="sub" style="margin-bottom:8px;"></div>' +
      '<div class="chart-wrap" style="height:360px;"><canvas id="vendor-product-trend"></canvas></div>' +
    '</div>' +

    (hasSales
      ? '<div class="panel"><h2>Sales history</h2><p class="sub">Your recent sales, newest first.</p><div class="table-scroll" style="max-height:400px;"><table><thead><tr><th>When</th><th>Product</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Total</th></tr></thead><tbody>' +
        sales.map(s => '<tr><td>' + new Date(s.sold_at).toLocaleString('en-ZA') + '</td><td class="name-cell">' + (s.product_name || s.product_id) + '</td><td class="num">' + s.quantity + '</td><td class="num">' + fmtR(s.unit_price) + '</td><td class="num">' + fmtR(s.total_amount) + '</td></tr>').join('') +
        '</tbody></table></div></div>'
      : '<div class="panel"><h2>Sales history</h2><p class="sub">Sales you have recorded appear here.</p><div class="empty-state"><div class="es-icon">📊</div><div class="es-title">No sales recorded yet</div><div class="es-sub">Go to <strong>Inventory &amp; reorder</strong> and click "Record a sale" to get started.</div></div></div>'
    );

  // Chart renderer
  function renderTrendChart(trendData, label){
    const canvas = document.getElementById('vendor-sales-trend');
    if (!canvas) return;

    // Destroy previous chart if exists
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    const data = trendData.data || [];
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [
          {
            label: 'Revenue',
            data: data.map(d => d.revenue),
            borderColor: '#1E4E8C',
            backgroundColor: 'rgba(30,78,140,0.15)',
            fill: true,
            tension: 0.3,
            pointRadius: data.length > 60 ? 0 : 3,
            borderWidth: 2.5,
            yAxisID: 'y'
          },
          {
            label: 'Units sold',
            data: data.map(d => d.units),
            borderColor: '#4C6B3F',
            backgroundColor: 'transparent',
            tension: 0.3,
            pointRadius: data.length > 60 ? 0 : 3,
            borderWidth: 2,
            borderDash: [4, 3],
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end', labels: { boxWidth: 12, usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: function(ctx){
                if (ctx.dataset.label === 'Revenue') return 'Revenue: ' + fmtR(ctx.parsed.y);
                return 'Units: ' + fmtNum(ctx.parsed.y);
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
          y: {
            position: 'left',
            grid: { color: 'rgba(0,0,0,0.08)' },
            ticks: { callback: v => fmtR(v) }
          },
          y1: {
            position: 'right',
            grid: { display: false },
            ticks: { callback: v => fmtNum(v) }
          }
        }
      }
    });
  }

  // Initial render
  if (trend) renderTrendChart(trend, 'last 30 days');

  // Wire trend buttons
  el.querySelectorAll('.trend-btn').forEach(btn => {
    btn.onclick = async () => {
      el.querySelectorAll('.trend-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const days = btn.dataset.days;
      const labelEl = document.getElementById('trend-label');
      const totalEl = document.getElementById('trend-total');
      if (labelEl) labelEl.textContent = 'last ' + days + ' days';
      try {
        const t = await API.request('/vendors/me/sales-trend?days=' + days);
        if (totalEl) totalEl.textContent = fmtR(t.total_revenue);
        renderTrendChart(t, 'last ' + days + ' days');
      } catch (e){
        alert('Could not load trend: ' + e.message);
      }
    };
  });

  // ══════════════════════════════════════════════════════════════
  // Product Trends Chart (mine vs regional)
  // ══════════════════════════════════════════════════════════════
  const PALETTE = ['#1E4E8C', '#C4432B', '#4C6B3F', '#D89A2E', '#7B1FA2', '#00838F', '#5D4037', '#455A64'];

  function renderProductTrendChart(trendData) {
    const canvas = document.getElementById('vendor-product-trend');
    const statusEl = document.getElementById('pt-status');
    if (!canvas) return;

    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    const series = trendData.series || [];
    if (series.length === 0) {
      if (statusEl) statusEl.textContent = 'No products in your catalog yet.';
      return;
    }

    const datasets = [];
    series.forEach((s, i) => {
      const color = PALETTE[i % PALETTE.length];
      datasets.push({
        label: s.name + ' (you)',
        data: s.mine || [],
        borderColor: color,
        backgroundColor: 'transparent',
        tension: 0.35,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 5
      });
      datasets.push({
        label: s.name + ' (region)',
        data: s.regional || [],
        borderColor: color,
        backgroundColor: 'transparent',
        tension: 0.35,
        borderWidth: 1.5,
        borderDash: [4, 3],
        pointRadius: 0,
        pointHoverRadius: 4,
        hidden: series.length > 3    // hide regional lines by default if many products
      });
    });

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: trendData.dates.map(d => d.slice(5)),   // MM-DD
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true, padding: 10, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: function(ctx){
                return ctx.dataset.label + ': ' + ctx.parsed.y + ' units';
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 14 } },
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.08)' }, ticks: { callback: v => v + 'u' } }
        }
      }
    });

    const city = trendData.vendorCity || '';
    const nearby = (trendData.nearbyCities || []).join(', ');
    if (statusEl) {
      statusEl.innerHTML = '<strong>' + city + '</strong>' +
        (nearby ? ' · nearby: ' + nearby : '');
    }
  }

  async function loadProductTrend(days) {
    const statusEl = document.getElementById('pt-status');
    if (statusEl) statusEl.textContent = 'Loading…';
    try {
      const data = await API.request('/vendors/me/sales-trend-by-product?days=' + days);
      renderProductTrendChart(data);
    } catch (e) {
      if (statusEl) statusEl.textContent = 'Could not load product trends: ' + e.message;
    }
  }

  el.querySelectorAll('.pt-trend-btn').forEach(btn => {
    btn.onclick = () => {
      el.querySelectorAll('.pt-trend-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadProductTrend(parseInt(btn.dataset.days, 10));
    };
  });

  loadProductTrend(30);
}

/* WHAT TO STOCK */
async function renderPredictions(){
  const el = document.getElementById('view-predictions');
  el.innerHTML = '<div class="panel"><p class="sub">Loading…</p></div>';

  let products = [];
  let discounts = [];
  try { products = await API.myProducts(); }
  catch (e) { el.innerHTML = '<div class="panel"><h2>Could not load products</h2></div>'; return; }
  try { discounts = await API.discounts(); } catch (e) { discounts = []; }

  if (!products || products.length === 0) {
    el.innerHTML = '<div class="panel"><h2>No products yet</h2></div>';
    return;
  }

  const discountMap = {};
  discounts.forEach(d => { discountMap[d.product_id] = d; });
  const discountedProducts = products.filter(p => discountMap[p.id]);

  let myVendor = (session && session.vendorId)
    ? (DATA.vendors || []).find(x => x.id === session.vendorId)
    : null;
  if (!myVendor) { try { myVendor = await API.request('/vendors/me'); } catch (e) {} }
  const myCity = myVendor ? myVendor.city : 'Durban';

  el.innerHTML =
    '<div class="weather-hero" id="wx-hero" data-condition="Sunny">' +
      '<div style="display:flex; align-items:center; justify-content:space-between; gap:20px;">' +
        '<div>' +
          '<div class="wh-city">📍 ' + myCity + '</div>' +
          '<div class="wh-cond" id="wx-cond">Loading weather…</div>' +
          '<div class="wh-desc" id="wx-desc"></div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div class="wh-icon" id="wx-icon">☀️</div>' +
          '<div class="wh-temp" id="wx-temp">—</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    (discountedProducts.length > 0 ? renderDiscountsPanel(discountedProducts, discountMap) : '') +
    '<div class="panel">' +
      '<h2>What to stock</h2>' +
      '<p class="sub">Based on your own sales, live weather, and SA calendar. Recommendations only — you decide.</p>' +
      '<div class="horizon-tabs" id="hz-tabs">' +
        '<div class="indicator" id="hz-ind"></div>' +
        '<button data-days="1" class="active">Tomorrow</button>' +
        '<button data-days="3">3 days</button>' +
        '<button data-days="5">5 days</button>' +
      '</div>' +
      '<div id="hz-results"><p class="sub">Loading predictions…</p></div>' +
    '</div>';

  try {
    const wx = await API.request('/weather/' + encodeURIComponent(myCity));
    // Backend returns { city, weather, temperature, description }
    const cond = wx.weather || wx.condition || 'Sunny';
    const temp = (wx.temperature != null) ? wx.temperature : wx.temp;
    document.getElementById('wx-cond').textContent = cond;
    document.getElementById('wx-temp').textContent = (temp != null ? temp : '—') + '°C';
    document.getElementById('wx-desc').textContent = wx.description || '';
    document.getElementById('wx-hero').dataset.condition = cond;
    document.getElementById('wx-icon').textContent =
      cond === 'Rainy' ? '🌧️' :
      cond === 'Cloudy' ? '⛅' : '☀️';
  } catch (e) {
    document.getElementById('wx-cond').textContent = 'Weather unavailable';
  }

  const tabs = document.querySelectorAll('#hz-tabs button');
  const indicator = document.getElementById('hz-ind');
  function moveIndicator() {
    const active = document.querySelector('#hz-tabs button.active');
    if (!active || !indicator) return;
    const parentRect = active.parentElement.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    indicator.style.left  = (activeRect.left - parentRect.left) + 'px';
    indicator.style.width = activeRect.width + 'px';
  }
  setTimeout(moveIndicator, 30);
  window.addEventListener('resize', moveIndicator);

  async function loadHorizon(days) {
    const resultsEl = document.getElementById('hz-results');

    // Skeleton placeholders while loading
    resultsEl.innerHTML = '<div class="prediction-day">' +
      '<div class="skeleton-day-head"></div>' +
      '<div class="skeleton-card"><div style="flex:1"><div class="skeleton-line" style="width:40%"></div><div class="skeleton-line sm" style="width:25%"></div></div><div class="skeleton-block"></div></div>' +
      '<div class="skeleton-card"><div style="flex:1"><div class="skeleton-line" style="width:50%"></div><div class="skeleton-line sm" style="width:30%"></div></div><div class="skeleton-block"></div></div>' +
      '<div class="skeleton-card"><div style="flex:1"><div class="skeleton-line" style="width:35%"></div><div class="skeleton-line sm" style="width:20%"></div></div><div class="skeleton-block"></div></div>' +
    '</div>';

    const ids = products.map(p => p.id);
    const startedAt = Date.now();

    try {
      const data = await API.request('/predict/horizon', {
        method: 'POST',
        body: JSON.stringify({ product_ids: ids, days })
      });

      renderHorizonResults(resultsEl, data, discountMap);

      // Fade-in animation
      resultsEl.classList.add('fade-in');

      // Updated badge near the heading
      const heading = document.querySelector('#view-predictions h2');
      if (heading) {
        const old = document.querySelector('.updated-badge');
        if (old) old.remove();
        const badge = document.createElement('span');
        badge.className = 'updated-badge';
        const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
        badge.innerHTML = '<span class="dot"></span>Updated ' + seconds + 's ago';
        heading.parentNode.insertBefore(badge, heading.nextSibling);
      }
    } catch (e) {
      resultsEl.innerHTML = '<div class="prediction-empty">Could not load predictions: ' + e.message + '</div>';
    }
  }

  tabs.forEach(btn => {
    btn.onclick = () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      moveIndicator();
      loadHorizon(parseInt(btn.dataset.days, 10));
    };
  });

  loadHorizon(1);
}

function renderDiscountsPanel(discountedProducts, discountMap) {
  return '<div class="panel" style="background:linear-gradient(135deg,#FFF6DE,#FFFDF7); border:1px solid rgba(180,117,14,0.30);">' +
    '<div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">' +
      '<div style="font-size:28px;">🔥</div>' +
      '<div><h2 style="margin:0; color:#7A5610;">Special offers for you</h2>' +
      '<p class="sub" style="margin:4px 0 0;">' + discountedProducts.length + ' supplier discount' + (discountedProducts.length > 1 ? 's' : '') + ' available now</p></div>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:14px;">' +
      discountedProducts.map(p => {
        const d = discountMap[p.id];
        const discounted = p.unit_price * (1 - d.discount_percent / 100);
        const savingsPerUnit = p.unit_price - discounted;
        const suggestedQty = Math.max(d.min_quantity, Math.ceil((p.predicted_daily_demand || 5) * 5));
        const totalSavings = savingsPerUnit * suggestedQty;
        return '<div class="offer-card">' +
          '<div style="display:flex; justify-content:space-between; margin-bottom:10px;">' +
            '<div><div style="font-weight:700; font-size:15px;">' + p.name + '</div>' +
            '<div class="sub-cell">' + p.category + '</div></div>' +
            '<div style="text-align:right;"><div style="font-weight:700; font-size:22px; color:var(--danger); line-height:1;">' + d.discount_percent + '%</div>' +
            '<div style="font-size:10px; color:#7A5610;">off</div></div>' +
          '</div>' +
          '<div style="display:flex; align-items:baseline; gap:10px; padding:10px; background:var(--warning-soft); border-radius:8px; margin-bottom:10px;">' +
            '<div class="oc-price">' + fmtR(discounted) + '</div>' +
            '<div class="oc-was">' + fmtR(p.unit_price) + '</div>' +
          '</div>' +
          '<div class="oc-min">📦 Order <strong>' + d.min_quantity + '+ units</strong> to qualify</div>' +
          '<div class="oc-save">💰 Estimated savings: <strong>' + fmtR(totalSavings) + '</strong></div>' +
        '</div>';
      }).join('') +
    '</div>' +
  '</div>';
}

function getCategoryIcon(category) {
  const map = {
    'Beverages': '🥤',
    'Snacks': '🍿',
    'Street Foods': '🍞',
    'Fast Food': '🍔',
    'Fresh Produce': '🍎',
    'Personal Care': '🧴',
    'Mobile Accessories': '📱',
    'Street Accessories': '🕶️',
    'Street Essentials': '🧴',
    'Street Sweets': '🍬'
  };
  return map[category] || '📦';
}

function openPredictModal(row, discount) {
  const icon = getCategoryIcon(row.category);
  const units = Math.round(row.predicted_demand || 0);
  const stock = row.current_stock || 0;

  const demand = row.predicted_demand || 0;
  const daysCovered = demand > 0 ? (stock / demand) : 999;
  let advice;
  if (daysCovered < 1) {
    advice = 'Stock is running low — only ' + stock + ' left. Order at least ' + Math.ceil(demand * 3) + ' units urgently.';
  } else if (daysCovered < 3) {
    advice = 'You have ' + stock + ' in stock — about ' + daysCovered.toFixed(1) + ' days of cover. Recommended order: ~' + Math.ceil(demand * 2) + ' units.';
  } else if (daysCovered < 7) {
    advice = 'You have ' + stock + ' in stock — enough for ~' + daysCovered.toFixed(0) + ' days. Consider topping up soon.';
  } else {
    advice = 'You have ' + stock + ' in stock — plenty for current demand.';
  }

  const wxClass = row.weather === 'Rainy' ? 'wx-rainy' : row.weather === 'Cloudy' ? 'wx-cloudy' : 'wx-sunny';
  const wxIcon = row.weather === 'Rainy' ? '🌧️' : row.weather === 'Cloudy' ? '⛅' : '☀️';

  const trendChip = row.trend_pct === null
    ? '<span class="factor-chip steady">📊 new activity</span>'
    : row.trend_pct === 0
      ? '<span class="factor-chip steady">📊 steady sales</span>'
      : row.trend_pct > 0
        ? '<span class="factor-chip trend-up">📈 +' + row.trend_pct + '% trend</span>'
        : '<span class="factor-chip trend-down">📉 ' + row.trend_pct + '% trend</span>';

  const weekendChip = row.is_weekend ? '<span class="factor-chip weekend">📅 weekend</span>' : '';
  const holidayChip = row.is_holiday ? '<span class="factor-chip holiday">🎉 ' + row.is_holiday + '</span>' : '';
  const discChip = discount ? '<span class="factor-chip" style="background:#FFE0B2;color:#BF360C;">🔥 ' + discount.discount_percent + '% off</span>' : '';

  const modal = document.createElement('div');
  modal.className = 'pm-overlay';
  modal.innerHTML =
    '<div class="pm-modal">' +
      '<div class="pm-head">' +
        '<div class="pm-icon">' + icon + '</div>' +
        '<div class="pm-title">' +
          '<div class="pm-name">' + row.product_name + '</div>' +
          '<div class="pm-cat">' + row.category + '</div>' +
        '</div>' +
        '<button class="pm-close" type="button">✕</button>' +
      '</div>' +
      '<div class="pm-units">' +
        '<div class="pm-units-num">' + units + '</div>' +
        '<div class="pm-units-label">units expected ' + (row.day_label === 'Tomorrow' ? 'tomorrow' : 'on ' + row.day_label) + '</div>' +
      '</div>' +
      '<div class="pm-sentence">' + row.sentence + '</div>' +
      '<div class="pm-sentence" style="color:#1E4E8C;">' + advice + '</div>' +
      '<div class="pm-chips">' +
        '<span class="factor-chip ' + wxClass + '">' + wxIcon + ' ' + row.weather + '</span>' +
        trendChip + weekendChip + holidayChip +
        '<span class="factor-chip season">🍃 ' + row.season + '</span>' +
        discChip +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('.pm-close').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });
}

function renderHorizonResults(el, data, discountMap) {
  discountMap = discountMap || {};
  const { results } = data;
  if (!results || results.length === 0) {
    el.innerHTML = '<div class="prediction-empty"><div class="icon">📦</div>No predictions available.</div>';
    return;
  }

  const byDate = {};
  for (const r of results) {
    if (!byDate[r.date]) byDate[r.date] = [];
    byDate[r.date].push(r);
  }

  const days = Object.keys(byDate).sort();
  el.innerHTML = days.map(date => {
    const rows = byDate[date];
    const first = rows[0];
    const wxIcon = first.weather === 'Rainy' ? '🌧️' : first.weather === 'Cloudy' ? '⛅' : '☀️';
    const holidayChip = first.is_holiday ? '<span class="factor-chip holiday">🎉 ' + first.is_holiday + '</span>' : '';

    const cards = rows.map(r => {
      const wxClass = r.weather === 'Rainy' ? 'wx-rainy' : r.weather === 'Cloudy' ? 'wx-cloudy' : 'wx-sunny';
      const trendChip = r.trend_pct === 0
        ? '<span class="factor-chip steady">📊 steady</span>'
        : r.trend_pct > 0
          ? '<span class="factor-chip trend-up">📈 +' + r.trend_pct + '%</span>'
          : '<span class="factor-chip trend-down">📉 ' + r.trend_pct + '%</span>';
      const weekendChip = r.is_weekend ? '<span class="factor-chip weekend">📅 weekend</span>' : '';
      const icon = getCategoryIcon(r.category);

      return '<div class="wts-card">' +
        '<div class="wts-card-head">' +
          '<div class="wts-icon">' + icon + '</div>' +
          '<div class="wts-title"><div class="wts-name">' + r.product_name + '</div>' +
          '<div class="wts-cat">' + r.category + '</div></div>' +
        '</div>' +
        '<div class="wts-chips">' +
          '<span class="factor-chip ' + wxClass + '">' + wxIcon + ' ' + r.weather + '</span>' +
          trendChip + weekendChip +
        '</div>' +
        '<button class="wts-btn" data-pid="' + r.product_id + '" type="button">🔮 Predict</button>' +
      '</div>';
    }).join('');

    return '<div class="prediction-day">' +
      '<div class="day-head">📅 ' + first.day_label +
      '<span class="day-wx">' + wxIcon + ' ' + first.weather + ' · ' + first.temp + '°C</span>' +
      holidayChip +
      '</div>' +
      '<div class="wts-grid">' + cards + '</div>' +
    '</div>';
  }).join('');

  // Wire up Predict buttons → open modal
  el.querySelectorAll('.wts-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const pid = btn.dataset.pid;
      const row = results.find(x => x.product_id === pid);
      if (row) openPredictModal(row, discountMap[pid]);
    };
  });
}
async function openLegacyPredictModal(productId, products){
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';
  let myVendor = (session && session.vendorId) ? (DATA.vendors || []).find(x => x.id === session.vendorId) : null;
  if (!myVendor) { try { myVendor = await API.request('/vendors/me'); } catch(e){} }
  const myCity = myVendor ? myVendor.city : 'Durban';

  overlay.innerHTML = '<div style="background:linear-gradient(135deg,#1E4E8C,#2E6FBF); color:#fff; border-radius:20px; max-width:600px; width:100%; padding:32px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
    '<h2 style="font-family:Space Grotesk,sans-serif; font-size:22px; margin:0 0 12px; color:#ffffff;">Predict demand</h2>' +
    '<p style="font-size:13px; color:#DCE6F2; margin:0 0 12px;">' + product.name + ' · ' + product.category + '</p>' +
    '<p id="pred-weather-note" style="font-size:12px; color:#ffffff; margin:0 0 20px; padding:8px 12px; background:rgba(255,255,255,0.15); border-radius:8px;">Fetching live weather for ' + myCity + '...</p>' +
    '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">' +
      '<div><label style="display:block; font-size:12px; font-weight:600; margin-bottom:6px; color:#DCE6F2;">Weather</label><select id="pred-weather" style="width:100%; padding:10px; background:#ffffff; color:#1E4E8C; border-radius:8px; border:1px solid rgba(255,255,255,0.5); font-weight:600;"><option>Sunny</option><option>Cloudy</option><option>Rainy</option></select></div>' +
      '<div><label style="display:block; font-size:12px; font-weight:600; margin-bottom:6px; color:#DCE6F2;">Holiday</label><select id="pred-holiday" style="width:100%; padding:10px; background:#ffffff; color:#1E4E8C; border-radius:8px; border:1px solid rgba(255,255,255,0.5); font-weight:600;"><option>No</option><option>Yes</option></select></div>' +
    '</div>' +
    '<button id="pred-run" style="width:100%; padding:12px; background:#ffffff; color:#1E4E8C; font-weight:700; border:none; border-radius:10px; margin-bottom:18px; cursor:pointer; font-size:14px;">Run prediction</button>' +
    '<div id="pred-result" style="display:none;"></div>' +
    '<div id="pred-history-section" style="display:none; margin-top:22px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.2);">' +
      '<h3 style="font-size:14px; font-weight:700; margin:0 0 12px; color:#ffffff;">Recent predictions for this product</h3>' +
      '<div id="pred-history-list"></div>' +
    '</div>' +
    '<div id="pred-error" style="color:#FFD5C0; font-size:13px; min-height:18px; margin-top:14px;"></div>' +
    '<div style="display:flex; gap:10px; margin-top:14px;"><button id="pred-close" style="flex:1; padding:12px; background:rgba(255,255,255,0.15); color:#ffffff; border:1px solid rgba(255,255,255,0.4); border-radius:10px; font-weight:700; cursor:pointer;">Close</button></div>' +
  '</div>';
  document.body.appendChild(overlay);
  overlay.querySelector('#pred-close').onclick = () => overlay.remove();

  API.weather(myCity).then(w => {
    const noteEl = overlay.querySelector('#pred-weather-note');
    if (!noteEl) return;
    noteEl.innerHTML = 'Live weather in ' + myCity + ': ' + w.temperature + '°C, ' + (w.description || w.weather);
    const sel = overlay.querySelector('#pred-weather');
    if (sel && w.weather){
      const target = ['Sunny','Cloudy','Rainy'].includes(w.weather) ? w.weather : 'Sunny';
      sel.value = target;
    }
  }).catch(() => {});

  function renderHistory(rows){
    const section = overlay.querySelector('#pred-history-section');
    const list = overlay.querySelector('#pred-history-list');
    if (!rows || rows.length === 0){ section.style.display = 'none'; return; }
    section.style.display = 'block';
    list.innerHTML = '<table style="width:100%; font-size:12.5px; border-collapse:collapse; color:#fff;"><thead><tr style="text-align:left; border-bottom:1px solid rgba(255,255,255,0.2);"><th style="padding:6px 8px; color:#DCE6F2; font-weight:600;">When</th><th style="padding:6px 8px; color:#DCE6F2; font-weight:600; text-align:right;">Demand</th><th style="padding:6px 8px; color:#DCE6F2; font-weight:600;">Conditions</th></tr></thead><tbody>' +
      rows.map(r => '<tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><td style="padding:8px; color:#DCE6F2;">' + new Date(r.predicted_at).toLocaleString('en-ZA') + '</td><td style="padding:8px; text-align:right; font-weight:700; color:#fff;">' + r.predicted_demand + '</td><td style="padding:8px; color:#DCE6F2;">' + (r.day_of_week || '') + ', ' + (r.season || '') + ', ' + (r.weather || '') + ', Holiday=' + (r.holiday || '') + '</td></tr>').join('') +
      '</tbody></table>';
  }

  API.predictionHistory(product.id).then(renderHistory).catch(() => {});

  overlay.querySelector('#pred-run').onclick = async () => {
    const errEl = overlay.querySelector('#pred-error');
    const resultEl = overlay.querySelector('#pred-result');
    errEl.textContent = '';
    resultEl.style.display = 'none';
    const btn = overlay.querySelector('#pred-run');
    btn.disabled = true; btn.textContent = 'Running...';
    const today = new Date();
    const dow = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][today.getDay()];
    const month = today.getMonth() + 1;
    const season = (month === 12 || month <= 2) ? 'Summer' : (month <= 5) ? 'Autumn' : (month <= 8) ? 'Winter' : 'Spring';
    const isWeekend = (today.getDay() === 0 || today.getDay() === 6) ? 'Yes' : 'No';
    const weather = overlay.querySelector('#pred-weather').value;
    const holiday = overlay.querySelector('#pred-holiday').value;
    const payload = { Category: product.category, Vendor_Type: myVendor ? myVendor.type : 'General Vendor', City: myCity, Day_of_Week: dow, Season: season, Weather: weather, Holiday: holiday, Is_Weekend: isWeekend, Month: month, Discount: 0, Cost_Price: Math.round((product.unit_price * 0.7) * 100) / 100, Selling_Price: product.unit_price };
    try {
      const res = await API.savePrediction({ product_id: product.id, weather, holiday, payload });
      const pred = res.predicted_daily_demand;
      const days = pred > 0 ? (product.current_stock / pred).toFixed(1) : '-';
      const lt = product.supplier_lead_time || 3;
      const orderQty = Math.max(0, Math.ceil(pred * (lt + 3) - product.current_stock));
      resultEl.style.display = 'block';
      resultEl.innerHTML = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;"><div style="padding:16px; background:rgba(255,255,255,0.15); border-radius:12px;"><div style="font-size:11px; color:#DCE6F2;">Predicted / day</div><div style="font-size:32px; font-weight:700; color:#ffffff;">' + pred + '</div></div><div style="padding:16px; background:rgba(255,255,255,0.15); border-radius:12px;"><div style="font-size:11px; color:#DCE6F2;">Days of stock</div><div style="font-size:32px; font-weight:700; color:#ffffff;">' + days + '</div></div></div><div style="padding:14px; background:rgba(255,255,255,0.15); border-radius:12px; font-size:13px; color:#ffffff;"><strong>Suggested order:</strong> <span style="color:#ffffff; font-weight:700;">' + orderQty + ' units</span></div>';
      API.predictionHistory(product.id).then(renderHistory).catch(() => {});
    } catch (err){ errEl.textContent = 'Error: ' + err.message; }
    finally { btn.disabled = false; btn.textContent = 'Run prediction'; }
  };
}

/* INVENTORY */
async function renderInventory(){
  const el = document.getElementById('view-inventory');
  el.innerHTML = '<div class="panel"><p class="sub">Loading…</p></div>';
  let products = [];
  try { products = await API.myProducts(); } catch (e){ el.innerHTML = '<div class="panel"><h2>Could not load</h2></div>'; return; }
  if (!products || products.length === 0){ el.innerHTML = '<div class="panel"><h2>No products yet</h2></div>'; return; }
  const low = products.filter(p => (p.current_stock || 0) <= (p.reorder_level || 0));
  const inS = products.filter(p => (p.current_stock || 0) > (p.reorder_level || 0));
  const val = products.reduce((s, p) => s + ((p.current_stock || 0) * (p.unit_price || 0)), 0);
  el.innerHTML = '<div class="filter-row" style="margin-bottom:22px;">' +
      '<button id="record-sale-btn" class="filter-btn active" style="font-weight:700; padding:10px 20px;">➕ Record a sale</button>' +
      '<button id="add-product-btn" class="filter-btn" style="padding:10px 20px;">➕ Add product</button>' +
      '<button id="update-stock-btn" class="filter-btn" style="padding:10px 20px;">✏️ Update stock</button>' +
      '<button id="refresh-inventory-btn" class="filter-btn" style="padding:10px 20px;">🔄 Refresh</button>' +
    '</div>' +
    '<div class="stat-strip" style="margin-bottom:24px;">' +
      '<div class="cell"><div class="v" style="color:var(--danger)">' + low.length + '</div><div class="l">need reorder</div></div>' +
      '<div class="cell"><div class="v" style="color:var(--success)">' + inS.length + '</div><div class="l">in stock</div></div>' +
      '<div class="cell"><div class="v">' + fmtNum(products.length) + '</div><div class="l">total products</div></div>' +
      '<div class="cell"><div class="v">' + fmtR(val) + '</div><div class="l">stock value</div></div>' +
    '</div>' +
    '<div class="panel"><h2>Your inventory</h2><div class="table-scroll"><table><thead><tr><th>Product</th><th>Category</th><th class="num">Stock</th><th class="num">Reorder</th><th class="num">Price</th><th class="num">Market avg</th><th>Suggestion</th><th>Supplier</th></tr></thead><tbody>' +
    products.map(p => {
      const a = priceAdvice(p.unit_price, p.category);
      return '<tr><td class="name-cell">' + p.name + '</td><td>' + p.category + '</td><td class="num">' + (p.current_stock || 0) + '</td><td class="num">' + (p.reorder_level || 0) + '</td><td class="num">' + fmtR(p.unit_price) + '</td><td class="num" style="color:#6B6B6B;">' + (a.avg ? fmtR(a.avg) : '—') + '</td><td><span style="color:' + a.color + '; font-weight:600; font-size:12.5px;">' + a.label + '</span></td><td>' + (p.supplier_name || '—') + '</td></tr>';
    }).join('') +
    '</tbody></table></div></div>';
  document.getElementById('refresh-inventory-btn').onclick = renderInventory;
  document.getElementById('record-sale-btn').onclick = () => openRecordSaleModal(products);
  document.getElementById('add-product-btn').onclick = () => openAddProductModal();
  document.getElementById('update-stock-btn').onclick = () => openUpdateStockModal(products);
}

function openRecordSaleModal(products){
  const sellable = products.filter(p => (p.current_stock || 0) > 0);
  if (sellable.length === 0){
    alert('You have no stock to sell. Update stock first.');
    return;
  }
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';
  const opts = sellable.map(p => '<option value="' + p.id + '" style="color:#000;">' + p.name + ' - ' + (p.current_stock || 0) + ' in stock</option>').join('');
  overlay.innerHTML = '<div style="background:linear-gradient(135deg,#1E4E8C,#2E6FBF); color:#fff; border-radius:20px; max-width:520px; width:100%; padding:32px; box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
    '<h2 style="font-family:Space Grotesk,sans-serif; font-size:22px; margin:0 0 20px; color:#ffffff;">Record a sale</h2>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#DCE6F2;">Product</label>' +
    '<select id="sale-product" style="width:100%; padding:12px; background:#ffffff; color:#1E4E8C; border:1px solid rgba(255,255,255,0.5); border-radius:10px; margin-bottom:18px; font-weight:600;">' + opts + '</select>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#DCE6F2;">Quantity</label>' +
    '<input type="number" id="sale-qty" min="1" value="1" style="width:100%; padding:12px; background:#ffffff; color:#1E4E8C; border:1px solid rgba(255,255,255,0.5); border-radius:10px; margin-bottom:18px; font-weight:600; font-size:14px;">' +
    '<div id="sale-error" style="color:#FFD5C0; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +
    '<div style="display:flex; gap:10px;">' +
      '<button id="sale-cancel" style="flex:1; padding:12px; background:rgba(255,255,255,0.15); color:#ffffff; border:1px solid rgba(255,255,255,0.4); border-radius:10px; font-weight:700; cursor:pointer;">Cancel</button>' +
      '<button id="sale-submit" style="flex:2; padding:12px; background:#ffffff; color:#1E4E8C; border:none; border-radius:10px; font-weight:700; cursor:pointer;">Confirm sale</button>' +
    '</div>' +
  '</div>';
  document.body.appendChild(overlay);
  overlay.querySelector('#sale-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#sale-submit').onclick = async () => {
    const errEl = overlay.querySelector('#sale-error');
    errEl.textContent = '';
    const pid = overlay.querySelector('#sale-product').value;
    const qty = parseInt(overlay.querySelector('#sale-qty').value);
    if (!qty || qty < 1){ errEl.textContent = 'Quantity must be at least 1.'; return; }
    try {
      const res = await API.recordSale(pid, qty);
      overlay.remove();
      alert(res.message);
      renderedTabs.delete('overview');
      renderedTabs.delete('sales');
      renderInventory();
    } catch (err){ errEl.textContent = 'Error: ' + err.message; }
  };
}

function openAddProductModal(){
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';
  const cats = Object.keys(CAT_HEX || {}).map(c => '<option value="' + c + '" style="color:#000;">' + c + '</option>').join('');
  const inp = 'width:100%; padding:12px; background:#ffffff; color:#1E4E8C; border:1px solid rgba(255,255,255,0.5); border-radius:10px; margin-bottom:16px; font-weight:600; font-size:14px;';
  const lbl = 'display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#DCE6F2;';
  overlay.innerHTML = '<div style="background:linear-gradient(135deg,#1E4E8C,#2E6FBF); color:#fff; border-radius:20px; max-width:560px; width:100%; padding:32px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
    '<h2 style="font-family:Space Grotesk,sans-serif; font-size:22px; margin:0 0 20px; color:#ffffff;">Add product</h2>' +
    '<label style="' + lbl + '">Product ID</label><input id="np-id" placeholder="P0063" style="' + inp + '">' +
    '<label style="' + lbl + '">Name</label><input id="np-name" style="' + inp + '">' +
    '<label style="' + lbl + '">Category</label><select id="np-category" style="' + inp + '">' + cats + '</select>' +
    '<label style="' + lbl + '">Cost price (R)</label><input id="np-cost" type="number" step="0.01" style="' + inp + '">' +
    '<button id="np-suggest" style="padding:10px 16px; margin-bottom:16px; background:rgba(255,255,255,0.15); color:#ffffff; border:1px solid rgba(255,255,255,0.4); border-radius:10px; font-weight:700; cursor:pointer;">Suggest price (40% markup)</button>' +
    '<label style="' + lbl + '">Selling price (R)</label><input id="np-price" type="number" step="0.01" style="' + inp + '">' +
    '<div id="np-advice" style="font-size:12.5px; min-height:18px; margin-bottom:16px; color:#DCE6F2;"></div>' +
    '<div id="np-error" style="color:#FFD5C0; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +
    '<div style="display:flex; gap:10px;"><button id="np-cancel" style="flex:1; padding:12px; background:rgba(255,255,255,0.15); color:#ffffff; border:1px solid rgba(255,255,255,0.4); border-radius:10px; font-weight:700; cursor:pointer;">Cancel</button><button id="np-submit" style="flex:2; padding:12px; background:#ffffff; color:#1E4E8C; border:none; border-radius:10px; font-weight:700; cursor:pointer;">Create</button></div>' +
  '</div>';
  document.body.appendChild(overlay);
  const costEl = overlay.querySelector('#np-cost');
  const priceEl = overlay.querySelector('#np-price');
  const catEl = overlay.querySelector('#np-category');
  const adviceEl = overlay.querySelector('#np-advice');
  function upd(){
    const price = parseFloat(priceEl.value);
    if (!price) { adviceEl.textContent = ''; return; }
    const a = priceAdvice(price, catEl.value);
    adviceEl.innerHTML = '<span style="color:#fff; font-weight:600;">' + a.label + '</span> · Market avg: ' + fmtR(a.avg);
  }
  priceEl.oninput = upd; catEl.onchange = upd;
  overlay.querySelector('#np-suggest').onclick = () => {
    const cst = parseFloat(costEl.value);
    if (!cst || cst <= 0){ adviceEl.textContent = 'Enter a cost price.'; return; }
    priceEl.value = suggestedPriceFromCost(cst);
    upd();
  };
  overlay.querySelector('#np-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#np-submit').onclick = async () => {
    const errEl = overlay.querySelector('#np-error');
    errEl.textContent = '';
    const payload = { id: overlay.querySelector('#np-id').value.trim(), name: overlay.querySelector('#np-name').value.trim(), category: catEl.value, unit_price: parseFloat(priceEl.value), current_stock: 0, reorder_level: 20 };
    if (!payload.id || !payload.name || !payload.unit_price){ errEl.textContent = 'ID, name, price required.'; return; }
    try { await API.addProduct(payload); overlay.remove(); alert(payload.name + ' added'); renderInventory(); }
    catch (err){ errEl.textContent = 'Error: ' + err.message; }
  };
}

function openUpdateStockModal(products){
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';
  const opts = products.map(p => '<option value="' + p.id + '" style="color:#000;">' + p.name + ' - ' + (p.current_stock || 0) + ' units</option>').join('');
  overlay.innerHTML = '<div style="background:linear-gradient(135deg,#1E4E8C,#2E6FBF); color:#fff; border-radius:20px; max-width:500px; width:100%; padding:32px; box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
    '<h2 style="font-family:Space Grotesk,sans-serif; font-size:22px; margin:0 0 20px; color:#ffffff;">Update stock</h2>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#DCE6F2;">Product</label>' +
    '<select id="stock-product" style="width:100%; padding:12px; background:#ffffff; color:#1E4E8C; border:1px solid rgba(255,255,255,0.5); border-radius:10px; margin-bottom:18px; font-weight:600;">' + opts + '</select>' +
    '<label style="display:block; font-size:12.5px; font-weight:600; margin-bottom:8px; color:#DCE6F2;">New stock level</label>' +
    '<input id="stock-qty" type="number" min="0" value="0" style="width:100%; padding:12px; background:#ffffff; color:#1E4E8C; border:1px solid rgba(255,255,255,0.5); border-radius:10px; margin-bottom:18px; font-weight:600; font-size:14px;">' +
    '<div id="stock-error" style="color:#FFD5C0; font-size:13px; min-height:18px; margin-bottom:14px;"></div>' +
    '<div style="display:flex; gap:10px;">' +
      '<button id="stock-cancel" style="flex:1; padding:12px; background:rgba(255,255,255,0.15); color:#ffffff; border:1px solid rgba(255,255,255,0.4); border-radius:10px; font-weight:700; cursor:pointer;">Cancel</button>' +
      '<button id="stock-submit" style="flex:2; padding:12px; background:#ffffff; color:#1E4E8C; border:none; border-radius:10px; font-weight:700; cursor:pointer;">Save</button>' +
    '</div>' +
  '</div>';
  document.body.appendChild(overlay);
  overlay.querySelector('#stock-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#stock-submit').onclick = async () => {
    const errEl = overlay.querySelector('#stock-error');
    errEl.textContent = '';
    const pid = overlay.querySelector('#stock-product').value;
    const qty = parseInt(overlay.querySelector('#stock-qty').value);
    if (isNaN(qty) || qty < 0){ errEl.textContent = 'Enter a valid number.'; return; }
    try {
      const res = await API.updateStock(pid, qty);
      overlay.remove();
      alert(res.message);
      renderedTabs.delete('overview');
      renderInventory();
    } catch (err){ errEl.textContent = 'Error: ' + err.message; }
  };
}

/* SUPPLIERS */
async function renderSuppliers(){
  const el = document.getElementById('view-suppliers');
  el.innerHTML = '<div class="panel"><p class="sub">Loading suppliers…</p></div>';

  let suppliers = [];
  try {
    suppliers = await API.request('/vendors/me/suppliers');
  } catch (e) {
    el.innerHTML = '<div class="panel"><h2>Could not load suppliers</h2><p class="sub" style="color:var(--danger);">' + e.message + '</p></div>';
    return;
  }

  if (!suppliers || suppliers.length === 0) {
    el.innerHTML = '<div class="panel"><h2>Supplier directory</h2><p class="sub">No suppliers currently match your product categories.</p></div>';
    return;
  }

  suppliers.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  el.innerHTML =
    '<div class="panel">' +
      '<h2>Supplier directory</h2>' +
      '<p class="sub">' + suppliers.length + ' suppliers matching your product categories.</p>' +
      '<div class="table-scroll" style="max-height:600px;">' +
        '<table>' +
          '<thead><tr><th>Supplier</th><th>City</th><th>Category</th><th class="num">Rating</th><th class="num">Lead</th><th>Status</th></tr></thead>' +
          '<tbody>' +
            suppliers.map(s =>
              '<tr>' +
                '<td class="name-cell">' + s.name + '</td>' +
                '<td>' + (s.city || '—') + '</td>' +
                '<td>' + (s.category || '—') + '</td>' +
                '<td class="num">' + ((s.rating || 0)).toFixed(1) + '</td>' +
                '<td class="num">' + (s.lead_time || 3) + 'd</td>' +
                '<td><span class="chip low">Active</span></td>' +
              '</tr>'
            ).join('') +
          '</tbody>' +
        '</table>' +
      '</div>' +
    '</div>';
}