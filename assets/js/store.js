/* ========== 基础工具 ========== */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const pad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const dstr = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dstr(d); };

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), 1900);
}

function copyText(txt) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(txt).then(() => toast('已复制 ✅')).catch(() => fallback());
  } else fallback();
  function fallback() {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('已复制 ✅'); } catch (e) { toast('复制失败，请手动选中'); }
    document.body.removeChild(ta);
  }
}

/* ========== 本地数据（浏览器里存，不联网） ========== */
const KEY = 'zmt-workbench-v1';
const DEFAULTS = {
  prefs: { platforms: ['抖音', '小红书', '视频号', '微博', '公众号', '知乎'], nick: '橙子' },
  checkins: {},          // { '2026-08-04': ['写作','学习'] }
  posts: [],             // 发布记录
  books: [],             // 读书
  skills: [],            // 技能
  goals: [],             // 成长计划
  shots: {},             // 拍摄清单 { id: {title, items:[{t,done}]} }
  drafts: [],            // 保存的文案
  lastSeen: ''
};

let DB = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULTS));
    const d = JSON.parse(raw);
    return Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), d);
  } catch (e) { return JSON.parse(JSON.stringify(DEFAULTS)); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(DB)); }
  catch (e) { toast('本地存储写入失败'); }
}

/* ========== 每日数据：先网络后缓存，永不空白 ========== */
const DKEY = 'zmt-daily-cache-v1';
const DATA = { date: '', updatedAt: '', topics: [], money: [], from: '' };

function applyDaily(d, from) {
  DATA.date = d.date || '';
  DATA.updatedAt = d.updatedAt || '';
  DATA.topics = Array.isArray(d.topics) ? d.topics : [];
  DATA.money = Array.isArray(d.money) ? d.money : [];
  DATA.note = d.note || '';
  DATA.from = from;
}

function loadDaily() {
  return new Promise(resolve => {
    const done = (from) => {
      const w = window.__DAILY__;
      if (w && w.topics && w.topics.length) {
        applyDaily(w, from);
        try { localStorage.setItem(DKEY, JSON.stringify(w)); } catch (e) { }
        return resolve(true);
      }
      // 网络文件没拿到，用上一次缓存
      try {
        const c = JSON.parse(localStorage.getItem(DKEY) || 'null');
        if (c && c.topics && c.topics.length) { applyDaily(c, '离线缓存'); return resolve(true); }
      } catch (e) { }
      applyDaily({ date: today(), topics: [], money: [] }, '暂无数据');
      resolve(false);
    };

    const s = document.createElement('script');
    s.src = 'data/daily.js' + (location.protocol === 'file:' ? '' : ('?t=' + Date.now()));
    s.onload = () => done('今日抓取');
    s.onerror = () => done('离线缓存');
    document.head.appendChild(s);
    setTimeout(() => { if (!DATA.from) done('离线缓存'); }, 4000);
  });
}

/* ========== 打卡 ========== */
const CHECK_TYPES = [
  { k: '写作', e: '✍️' }, { k: '学习', e: '🎓' }, { k: '阅读', e: '📚' }, { k: '运动', e: '🏃' }
];
function toggleCheck(type, day) {
  day = day || today();
  const arr = DB.checkins[day] || [];
  const i = arr.indexOf(type);
  if (i >= 0) arr.splice(i, 1); else arr.push(type);
  if (arr.length) DB.checkins[day] = arr; else delete DB.checkins[day];
  save();
}
function streak() {
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const d = daysAgo(i);
    if (DB.checkins[d] && DB.checkins[d].length) n++;
    else if (i > 0) break;
  }
  return n;
}
function weekCount(type) {
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const a = DB.checkins[daysAgo(i)] || [];
    if (!type) n += a.length; else if (a.includes(type)) n++;
  }
  return n;
}
