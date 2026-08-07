/* ========== 路由与交互 ========== */
let CUR = 'home';

function renderNav() {
  $('#nav').innerHTML = MODULES.map(m => `
    <div class="nav-item ${CUR === m.k ? 'active' : ''}" data-nav="${m.k}">
      <span class="ico">${m.e}</span><span>${m.n}</span>
      ${m.k === 'topics' && DATA.topics.length ? `<span class="badge">${DATA.topics.length}</span>` : ''}
      ${m.k === 'money' && DATA.money.length ? `<span class="badge">${DATA.money.length}</span>` : ''}
    </div>`).join('');
}

function go(k, noScroll) {
  if (!VIEWS[k]) k = 'home';
  CUR = k;
  location.hash = '#/' + k;
  const m = MODULES.find(x => x.k === k);
  $('#topTitle').textContent = (m ? m.e + ' ' + m.n : '首页');
  $('#view').innerHTML = VIEWS[k]();
  renderNav();
  bindLocal();
  if (!noScroll) window.scrollTo(0, 0);
  closeSide();
}

function refreshView() { $('#view').innerHTML = VIEWS[CUR](); renderNav(); bindLocal(); }

function openSide() { $('#sidebar').classList.add('open'); $('#overlay').classList.add('show'); }
function closeSide() { $('#sidebar').classList.remove('open'); $('#overlay').classList.remove('show'); }

/* 局部绑定（select 之类） */
function bindLocal() {
  const wt = $('#wTopic');
  if (wt) wt.onchange = () => {
    WSTATE.topicId = wt.value;
    $('#customBox').style.display = wt.value ? 'none' : 'block';
  };
}

/* ========== 生成文章 ========== */
function doGen(force) {
  let topic = getTopic(WSTATE.topicId);
  if (!topic) {
    const t = ($('#cTitle') && $('#cTitle').value || '').trim();
    const s = ($('#cSum') && $('#cSum').value || '').trim();
    if (!t) { toast('先填一个话题标题'); return; }
    WSTATE.custom = { title: t, summary: s };
    topic = { id: 'custom', title: t, summary: s || t, platform: '自定义', tags: [], source: null, article: null };
  }
  WSTATE.result = buildArticle(topic, { angle: WSTATE.angle, seed: WSTATE.seed, usePre: !force });
  refreshView();
  toast('生成好了 ✨');
}

/* ========== 事件总线 ========== */
document.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) return go(nav.dataset.nav);

  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act, id = el.dataset.id, v = el.dataset.v;

  switch (a) {
    case 'go': go(el.dataset.p); break;

    case 'check': toggleCheck(el.dataset.k); refreshView(); toast('打卡记上了 ✅'); break;

    case 'plat': TSTATE.plat = el.dataset.p; refreshView(); break;
    case 'bar': MSTATE.bar = el.dataset.b; refreshView(); break;

    case 'write':
      WSTATE.topicId = id; WSTATE.seed = String(Math.random());
      go('writer'); doGen(false); break;

    case 'shot': {
      const t = getTopic(id); if (!t) return;
      makeShot(t); go('shots'); break;
    }
    case 'mkshot': {
      const sel = $('#sTopic'); const t = getTopic(sel && sel.value);
      if (!t) { toast('今天还没有话题'); return; }
      makeShot(t); refreshView(); break;
    }
    case 'tickshot': {
      const s = DB.shots[id]; if (!s) return;
      const i = +el.dataset.i; s.items[i].done = !s.items[i].done; save(); refreshView(); break;
    }
    case 'delshot': delete DB.shots[id]; save(); refreshView(); break;

    case 'angle': WSTATE.angle = el.dataset.k; refreshView(); break;
    case 'gen': WSTATE.seed = String(Math.random()); doGen(false); break;
    case 'regen': WSTATE.seed = String(Math.random()); doGen(!!(WSTATE.result && WSTATE.result.mode !== '当日精写稿')); break;
    case 'genfree': WSTATE.seed = String(Math.random()); doGen(true); break;

    case 'cp': copyText(v || el.dataset.v); break;
    case 'cpbody': copyText(WSTATE.result ? WSTATE.result.body : ''); break;

    case 'edit': {
      const box = $('#artBox'); if (!box || !WSTATE.result) return;
      const ta = document.createElement('textarea');
      ta.rows = 22; ta.value = WSTATE.result.body; ta.id = 'artEdit';
      box.replaceWith(ta);
      ta.oninput = () => { WSTATE.result.body = ta.value; };
      toast('可以直接改了，改完记得复制或存草稿');
      break;
    }
    case 'draft': {
      if (!WSTATE.result) return;
      DB.drafts.push({ id: uid(), title: WSTATE.result.titles[0] || '未命名', body: WSTATE.result.body, titles: WSTATE.result.titles, golden: WSTATE.result.golden, mode: WSTATE.result.mode, date: today(), words: wordCount(WSTATE.result.body) });
      save(); refreshView(); toast('存好了 💾'); break;
    }
    case 'loaddraft': {
      const d = DB.drafts.find(x => x.id === id); if (!d) return;
      WSTATE.result = { titles: d.titles || [d.title], body: d.body, golden: d.golden || '', mode: d.mode || '草稿' };
      refreshView(); window.scrollTo(0, 0); break;
    }
    case 'deldraft': DB.drafts = DB.drafts.filter(x => x.id !== id); save(); refreshView(); break;

    case 'topost': {
      if (!WSTATE.result) return;
      DB.posts.push({ id: uid(), date: today(), plat: '公众号', title: WSTATE.result.titles[0] || '未命名', read: 0, fans: 0, note: '从写文案模块保存' });
      save(); toast('已记入发布记录 📮'); break;
    }

    case 'addpost': {
      const t = $('#pTitle').value.trim();
      if (!t) { toast('填个标题'); return; }
      DB.posts.push({ id: uid(), date: $('#pDate').value || today(), plat: $('#pPlat').value, title: t, read: +$('#pRead').value || 0, fans: +$('#pFans').value || 0, note: $('#pNote').value.trim() });
      save(); refreshView(); toast('记好了 📮'); break;
    }
    case 'delpost': DB.posts = DB.posts.filter(x => x.id !== id); save(); refreshView(); break;

    case 'addgoal': {
      const n = $('#gName').value.trim(); if (!n) { toast('写个目标名'); return; }
      DB.goals.push({ id: uid(), name: n, date: $('#gDate').value, pct: Math.min(100, +$('#gPct').value || 0) });
      save(); refreshView(); toast('目标加上了 🎯'); break;
    }
    case 'goalup': { const g = DB.goals.find(x => x.id === id); if (g) { g.pct = Math.min(100, g.pct + 10); save(); refreshView(); } break; }
    case 'delgoal': DB.goals = DB.goals.filter(x => x.id !== id); save(); refreshView(); break;

    case 'addskill': {
      const n = $('#kName').value.trim(); if (!n) { toast('写个技能名'); return; }
      DB.skills.push({ id: uid(), name: n, target: +$('#kTarget').value || 20, done: 0, note: $('#kNote').value.trim() });
      save(); refreshView(); toast('加上了 🎓'); break;
    }
    case 'skilladd': {
      const s = DB.skills.find(x => x.id === id);
      if (s) { s.done = Math.round(((s.done || 0) + parseFloat(v)) * 10) / 10; save(); toggleCheck2('学习'); refreshView(); toast('记上了，顺手打了学习卡'); }
      break;
    }
    case 'delskill': DB.skills = DB.skills.filter(x => x.id !== id); save(); refreshView(); break;

    case 'addbook': {
      const n = $('#bName').value.trim(); if (!n) { toast('写个书名'); return; }
      DB.books.push({ id: uid(), name: n, author: $('#bAuthor').value.trim(), total: +$('#bTotal').value || 300, page: 0, status: $('#bStatus').value, note: '' });
      save(); refreshView(); toast('上架了 📚'); break;
    }
    case 'bookadd': {
      const b = DB.books.find(x => x.id === id);
      if (b) {
        b.page = Math.min(b.total, (b.page || 0) + parseInt(v, 10));
        if (b.page >= b.total) b.status = '已读完';
        else if (b.status === '想读') b.status = '在读';
        save(); toggleCheck2('阅读'); refreshView(); toast('进度更新，顺手打了阅读卡');
      }
      break;
    }
    case 'booknote': {
      const b = DB.books.find(x => x.id === id); if (!b) return;
      const t = prompt('这本书的笔记', b.note || '');
      if (t !== null) { b.note = t; save(); refreshView(); }
      break;
    }
    case 'delbook': DB.books = DB.books.filter(x => x.id !== id); save(); refreshView(); break;

    case 'savenick': DB.prefs.nick = $('#sNick').value.trim() || '创作者'; save(); toast('保存了'); break;
    case 'togplat': {
      const p = el.dataset.p, i = DB.prefs.platforms.indexOf(p);
      if (i >= 0) { if (DB.prefs.platforms.length <= 1) { toast('至少留一个'); return; } DB.prefs.platforms.splice(i, 1); }
      else DB.prefs.platforms.push(p);
      save(); refreshView(); break;
    }
    case 'export': {
      const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
      const a2 = document.createElement('a');
      a2.href = URL.createObjectURL(blob);
      a2.download = '自媒体工作台备份-' + today() + '.json';
      a2.click(); toast('已导出 ⬇️'); break;
    }
    case 'import': $('#impFile').click(); break;
    case 'clear': {
      if (confirm('会清空全部打卡、发布、读书、技能记录，确定吗')) {
        DB = JSON.parse(JSON.stringify(DEFAULTS)); save(); refreshView(); toast('清空了');
      }
      break;
    }
  }
});

function toggleCheck2(type) {
  const arr = DB.checkins[today()] || [];
  if (!arr.includes(type)) { arr.push(type); DB.checkins[today()] = arr; save(); }
}

function makeShot(t) {
  const s = buildShotlist(t);
  const items = []
    .concat(s.shots.map(x => ({ t: x.t + ' · ' + x.s, d: x.d, done: false })))
    .concat([{ t: '📦 道具准备', d: s.props.join('、'), done: false }])
    .concat(s.talk.map(x => ({ t: '🎤 口播要点', d: x, done: false })))
    .concat(s.cover.map(x => ({ t: '🖼️ 封面', d: x, done: false })))
    .concat(s.tips.map(x => ({ t: '💡 发布提醒', d: x, done: false })));
  DB.shots[uid()] = { title: s.title, items: items, date: today() };
  save();
  toast('清单生成好了 🎬');
}

document.addEventListener('change', e => {
  if (e.target.id === 'impFile' && e.target.files[0]) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const d = JSON.parse(fr.result);
        DB = Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), d);
        save(); refreshView(); toast('导入成功 ✅');
      } catch (err) { toast('文件读不出来，确认是备份文件'); }
    };
    fr.readAsText(e.target.files[0]);
  }
});

/* ========== 启动 ========== */
$('#menuBtn').onclick = () => $('#sidebar').classList.contains('open') ? closeSide() : openSide();
$('#overlay').onclick = closeSide;
$('#refreshBtn').onclick = () => {
  const btn = $('#refreshBtn');
  btn.textContent = '⏳'; btn.disabled = true;
  delete window.__DAILY__;
  DATA.from = '';
  loadDaily().then(() => {
    updateStatus(); refreshView();
    btn.textContent = '🔄'; btn.disabled = false;
    const t = today();
    if (DATA.from === '今日抓取' && DATA.date === t) toast('已是最新 · 数据 ' + DATA.date + ' ✨');
    else if (DATA.from === '今日抓取') toast('已读取 · 数据 ' + DATA.date);
    else if (DATA.from === '离线缓存') toast('连不上服务器，显示离线缓存（' + DATA.date + '）');
    else toast('暂无数据，请开启动.bat 或部署版');
  });
};
window.addEventListener('hashchange', () => {
  const k = (location.hash || '').replace('#/', '');
  if (k && k !== CUR && VIEWS[k]) go(k);
});

function updateStatus() {
  const d = new Date();
  $('#brandDate').textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日 · 连续 ' + streak() + ' 天';
  const isToday = DATA.date === today();
  const ok = DATA.from === '今日抓取' && isToday;
  $('#sideStatus').innerHTML = (ok ? '🟢' : '🟡') + ' ' + esc(DATA.from) +
    (DATA.date ? '<br>数据日期 ' + esc(DATA.date) + (isToday ? '（已最新）' : '（点🔄或开启动.bat拉新）') : '') +
    '<br>' + DATA.topics.length + ' 条选题 · ' + DATA.money.length + ' 个项目';
  const swState = ('serviceWorker' in navigator)
    ? (navigator.serviceWorker.controller ? '离线缓存已启用' : '缓存待激活')
    : '未启用缓存（请用 http 打开）';
  $('#footInfo').textContent = '数据每天早晨自动更新 ｜ 当前 ' + DATA.from + (DATA.updatedAt ? ' ｜ ' + DATA.updatedAt : '') + ' ｜ ' + swState + ' ｜ 记录只存本机';
}

function showFatal(err) {
  const v = document.getElementById('view');
  const msg = (err && err.message) ? err.message : ('' + err);
  if (v) v.innerHTML = '<div class="card"><div class="empty"><span class="big">⚠️</span>启动出错：' + esc(msg) + '<br>点右上角 🔄 重试，或截图发我定位</div></div>';
}

loadDaily().then(() => {
  try {
    updateStatus();
    if (location.protocol === 'file:') {
      toast('当前用文件直接打开，自动更新和离线用不了，建议改用 http://localhost:8765/');
    }
    if (DATA.from === '离线缓存' && DATA.date && DATA.date < today()) {
      toast('现在是离线缓存数据（' + DATA.date + '），开启动.bat 联网后可见最新');
    }
    const k = (location.hash || '').replace('#/', '');
    go(VIEWS[k] ? k : 'home');
  } catch (err) { showFatal(err); }
}).catch(err => showFatal(err));

/* 每天自动刷新：页面加载、切回标签页、或每 5 分钟，自动重拉当日数据。
   前提：本地服务（启动.bat）在运行；若离线则保留上次缓存并提示，不会空白。 */
function autoRefreshDaily() {
  if (location.protocol.indexOf('http') !== 0) return;   // file:// 直接读本地文件，无需轮询
  if (DATA.date && DATA.date >= today()) return;          // 已是今日数据就不打扰
  loadDaily().then(() => {
    updateStatus();
    if (DATA.from === '离线缓存' && DATA.date && DATA.date < today()) {
      toast('当前是离线缓存（' + DATA.date + '），开启动.bat 刷新可见最新');
    } else if (DATA.date && DATA.date >= today()) {
      toast('已更新到今日数据 ✨');
    }
    if (CUR && VIEWS[CUR]) { $('#view').innerHTML = VIEWS[CUR](); renderNav(); bindLocal(); }
  });
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(autoRefreshDaily, 600); });
setInterval(autoRefreshDaily, 5 * 60 * 1000);

if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}
