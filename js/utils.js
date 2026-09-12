// js/utils.js

const CAT_COLORS = {
  'Street Foods':'var(--cat-1)','Snacks':'var(--cat-2)','Fresh Produce':'var(--cat-3)',
  'Beverages':'var(--cat-4)','Fast Food':'var(--cat-5)','Street Sweets':'var(--cat-6)',
  'Street Accessories':'var(--cat-7)','Mobile Accessories':'var(--cat-8)',
  'Street Essentials':'var(--cat-9)','Personal Care':'var(--cat-10)'
};

const CAT_HEX = {
  'Street Foods':'#C4432B','Snacks':'#D89A2E','Fresh Produce':'#4C6B3F',
  'Beverages':'#2B4C6F','Fast Food':'#8C3B2E','Street Sweets':'#B5657D',
  'Street Accessories':'#5B6770','Mobile Accessories':'#3E6E8E',
  'Street Essentials':'#6E7B3F','Personal Care':'#8A7CA8'
};

const INK = '#000000';
const VERM = '#C4432B';
const GREEN = '#4C6B3F';
const MARIGOLD = '#D89A2E';
const INDIGO = '#2B4C6F';
const LINE = 'rgba(0,0,0,0.10)';

function fmtR(n){
  if (n === null || n === undefined || isNaN(n)) return 'R0';
  if (n >= 1000000) return 'R' + (n/1000000).toFixed(2) + 'M';
  if (n >= 1000) return 'R' + (n/1000).toFixed(1) + 'K';
  return 'R' + n.toFixed(0);
}

function fmtNum(n){
  if (n === null || n === undefined || isNaN(n)) return '0';
  return n.toLocaleString('en-ZA');
}

if (typeof Chart !== 'undefined'){
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = '#4A4A4A';
  Chart.defaults.borderColor = 'rgba(0,0,0,0.10)';
}

function statusChip(status){
  const cls = {'Low Stock':'high','Monitor':'medium','In Stock':'low','Overstocked':'low'}[status] || 'medium';
  return '<span class="chip ' + cls + '">' + status + '</span>';
}

function priorityChip(p){
  const cls = {'High':'high','Medium':'medium','Low':'low'}[p] || 'medium';
  return '<span class="chip ' + cls + '">' + p + '</span>';
}

function decisionChip(d){
  const cls = {'ORDER NOW':'order','ORDER SOON':'soon','NO ORDER NEEDED':'none'}[d] || 'soon';
  const label = {'ORDER NOW':'Order now','ORDER SOON':'Order soon','NO ORDER NEEDED':'No order needed'}[d] || d;
  return '<span class="chip ' + cls + '">' + label + '</span>';
}

const ICONS = {
  overview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l4-4 4 4 6-8 4 4"/></svg>',
  sales: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="10" width="4" height="10"/><rect x="10" y="5" width="4" height="15"/><rect x="17" y="13" width="4" height="7"/></svg>',
  forecast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  inventory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>',
  suppliers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 16V6h11v10"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>'
};

const ROLE_ICONS = {
  vendor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/></svg>',
  supplier: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="12" height="10"/><path d="M15 10h4l3 3v4h-7"/><circle cx="7.5" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>',
  admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.2"/><path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6"/></svg>'
};