/* ========== 各模块视图 ========== */
const MODULES = [
  { k: 'home', n: '首页', e: '🏠' },
  { k: 'topics', n: '选题', e: '🔥' },
  { k: 'writer', n: '写文案', e: '✍️' },
  { k: 'shots', n: '拍摄清单', e: '🎬' },
  { k: 'posts', n: '发布记录', e: '📮' },
  { k: 'money', n: '搞钱灵感', e: '💰' },
  { k: 'growth', n: '成长计划', e: '🌱' },
  { k: 'skills', n: '技能学习', e: '🎓' },
  { k: 'books', n: '读书', e: '📚' },
  { k: 'settings', n: '设置', e: '⚙️' }
];

const WSTATE = { topicId: '', angle: '行业趋势', seed: '1', result: null, custom: null };
const TSTATE = { plat: '全部' };
const MSTATE = { bar: '全部' };

const VIEWS = {};

/* ---------------- 首页 ---------------- */
VIEWS.home = () => {
  const h = new Date().getHours();
  const hi = h < 6 ? '还没睡吗' : h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : h < 23 ? '晚上好' : '夜深了';
  const d = new Date();
  const wk = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  const cks = DB.checkins[today()] || [];
  const t3 = DATA.topics.slice(0, 3);
  const m2 = DATA.money.slice(0, 2);
  const reading = DB.books.filter(b => b.status === '在读').length;
  const hours = DB.skills.reduce((s, x) => s + (x.done || 0), 0);

  return `
  <div class="card hero">
    <h2>${hi}，${esc(DB.prefs.nick || '创作者')} 👋</h2>
    <p>${DATA.date || today()} ${wk} ｜ 数据状态 ${esc(DATA.from)}${DATA.updatedAt ? ' ｜ 更新于 ' + esc(DATA.updatedAt) : ''}</p>
    <div class="hero-row">
      <div class="stat"><b>${streak()}</b><span>🔥 连续打卡天</span></div>
      <div class="stat"><b>${weekCount()}</b><span>📅 本周打卡次</span></div>
      <div class="stat"><b>${DB.posts.length}</b><span>📮 累计发布</span></div>
      <div class="stat"><b>${hours}</b><span>🎓 学习小时</span></div>
      <div class="stat"><b>${reading}</b><span>📚 在读书</span></div>
    </div>
  </div>

  <div class="card">
    <h3>✅ 今日打卡</h3>
    <div class="btn-row">
      ${CHECK_TYPES.map(c => `<button class="chip ${cks.includes(c.k) ? 'on' : ''}" data-act="check" data-k="${c.k}">${c.e} ${c.k}${cks.includes(c.k) ? ' ✓' : ''}</button>`).join('')}
    </div>
    <div class="mini" style="margin-top:8px">点一下就记上了，数据只存在这台设备的浏览器里。</div>
  </div>

  <div class="grid g2">
    <div class="card">
      <h3>🔥 今日最火选题 <span class="more" data-act="go" data-p="topics">全部 ${DATA.topics.length} 条 ›</span></h3>
      ${t3.length ? t3.map(t => `
        <div class="list-row">
          <div class="body">
            <div class="t">${esc(t.title)}</div>
            <div class="d"><span class="pill p">${esc(t.platform)}</span> ${esc(t.heat || '')} ｜ ${esc((t.tags || []).join(' · '))}</div>
          </div>
          <button class="btn sm" data-act="write" data-id="${t.id}">写这篇</button>
        </div>`).join('') : `<div class="empty"><span class="big">🫧</span>还没有数据，点右上角刷新试试</div>`}
    </div>

    <div class="card">
      <h3>💰 今日搞钱灵感 <span class="more" data-act="go" data-p="money">全部 ${DATA.money.length} 条 ›</span></h3>
      ${m2.length ? m2.map(m => `
        <div class="list-row">
          <div class="body">
            <div class="t">${m.emoji} ${esc(m.name)}</div>
            <div class="d"><span class="pill g">门槛${esc(m.barrier)}</span> 启动 ${esc(m.cost)} ｜ ${esc(m.income)}</div>
          </div>
        </div>`).join('') : `<div class="empty"><span class="big">🪙</span>暂无数据</div>`}
    </div>
  </div>

  <div class="card">
    <h3>⚡ 快捷入口</h3>
    <div class="btn-row">
      <button class="btn ghost" data-act="go" data-p="topics">🔥 看今天的热点</button>
      <button class="btn ghost" data-act="go" data-p="writer">✍️ 直接写一篇</button>
      <button class="btn ghost" data-act="go" data-p="shots">🎬 生成拍摄清单</button>
      <button class="btn ghost" data-act="go" data-p="posts">📮 记一条发布</button>
      <button class="btn ghost" data-act="go" data-p="books">📚 更新读书进度</button>
    </div>
  </div>`;
};

/* ---------------- 选题 ---------------- */
VIEWS.topics = () => {
  const plats = ['全部'].concat(DB.prefs.platforms);
  const list = DATA.topics.filter(t => TSTATE.plat === '全部' || (t.fit || [t.platform]).includes(TSTATE.plat));
  return `
  <div class="page-head"><h1>🔥 今日选题</h1><p>每天早晨自动抓取，${DATA.topics.length} 条。热搜词只是线索，动笔前建议点开来源自己核一遍。</p></div>
  <div class="chips">${plats.map(p => `<span class="chip ${TSTATE.plat === p ? 'on' : ''}" data-act="plat" data-p="${esc(p)}">${esc(p)}</span>`).join('')}</div>
  ${list.length ? `<div class="grid g2">${list.map(t => `
    <div class="topic-card">
      <div class="th">
        <span class="pill p">${esc(t.platform)}</span>
        <span class="pill y">${esc(t.heat || '在榜')}</span>
        ${t.article && t.article.body ? '<span class="pill g">已有精写稿</span>' : ''}
      </div>
      <div class="tt">${esc(t.title)}</div>
      <div class="ts">${esc(t.summary)}</div>
      ${t.angle ? `<div class="ta">💡 切入建议：${esc(t.angle)}</div>` : ''}
      <div style="margin-bottom:8px">${(t.tags || []).map(x => `<span class="tag">#${esc(x)}</span>`).join('')}</div>
      <div class="tf">
        <button class="btn sm" data-act="write" data-id="${t.id}">✍️ 写成文章</button>
        <button class="btn sm ghost" data-act="shot" data-id="${t.id}">🎬 拍摄清单</button>
        ${t.source && t.source.url ? `<a class="src" href="${esc(t.source.url)}" target="_blank" rel="noopener">来源 ${esc(t.source.name)} ↗</a>` : ''}
      </div>
    </div>`).join('')}</div>`
      : `<div class="card"><div class="empty"><span class="big">🔍</span>这个平台今天没有匹配的话题，换一个筛选看看</div></div>`}
  `;
};

/* ---------------- 写文案 ---------------- */
VIEWS.writer = () => {
  const t = getTopic(WSTATE.topicId);
  const r = WSTATE.result;
  return `
  <div class="page-head"><h1>✍️ 写文案</h1><p>公众号调性：设计师的日常脑暴，观察生活，古画新解，热点事件。结构固定为 引出热点 → 前因后果 → 设计师观点 → 金句总结。</p></div>

  <div class="card">
    <div class="field">
      <label>选一个话题</label>
      <select id="wTopic">
        <option value="">🖊️ 自定义话题</option>
        ${DATA.topics.map(x => `<option value="${x.id}" ${x.id === WSTATE.topicId ? 'selected' : ''}>${esc(x.platform)} ｜ ${esc(x.title)}</option>`).join('')}
      </select>
    </div>
    <div id="customBox" style="display:${WSTATE.topicId ? 'none' : 'block'}">
      <div class="field"><label>话题标题</label><input type="text" id="cTitle" placeholder="例如 老小区的手写招牌为什么好看" value="${esc(WSTATE.custom && WSTATE.custom.title || '')}"></div>
      <div class="field"><label>事件背景（一两句话说清发生了什么）</label><textarea id="cSum" rows="3" placeholder="谁在什么时间做了什么，引发了什么讨论">${esc(WSTATE.custom && WSTATE.custom.summary || '')}</textarea></div>
    </div>
    <div class="field">
      <label>切入角度</label>
      <div class="btn-row">${ANGLES.map(a => `<span class="chip ${WSTATE.angle === a.k ? 'on' : ''}" data-act="angle" data-k="${a.k}" title="${a.d}">${a.e} ${a.k}</span>`).join('')}</div>
    </div>
    <div class="btn-row">
      <button class="btn" data-act="gen">✨ 生成文章</button>
      <button class="btn ghost" data-act="regen">🔄 换个说法</button>
      ${t && t.article && t.article.body ? `<button class="btn ghost" data-act="genfree">🎲 不用精写稿，按角度重写</button>` : ''}
    </div>
  </div>

  ${r ? `
  <div class="card">
    <h3>📌 标题候选 <span class="more">${esc(r.mode)}</span></h3>
    ${r.titles.map(x => `<div class="list-row"><div class="body"><div class="t">${esc(x)}</div></div><button class="btn sm ghost" data-act="cp" data-v="${esc(x)}">复制</button></div>`).join('')}
  </div>
  <div class="card">
    <h3>📝 正文 <span class="more">${wordCount(r.body)} 字</span></h3>
    <div class="article" id="artBox">${esc(r.body)}</div>
    <div class="btn-row" style="margin-top:12px">
      <button class="btn" data-act="cpbody">📋 复制全文</button>
      <button class="btn ghost" data-act="draft">💾 存为草稿</button>
      <button class="btn ghost" data-act="topost">📮 记入发布记录</button>
      <button class="btn ghost" data-act="edit">✏️ 我要改一改</button>
    </div>
    ${r.golden ? `<div class="risk" style="background:var(--pink-soft);color:var(--pink-deep);margin-top:12px">💎 金句 ｜ ${esc(r.golden)}</div>` : ''}
  </div>` : `<div class="card"><div class="empty"><span class="big">🪄</span>选一个话题，点生成就有一篇完整稿子</div></div>`}

  ${DB.drafts.length ? `<div class="card">
    <h3>💾 我的草稿 <span class="more">${DB.drafts.length} 篇</span></h3>
    ${DB.drafts.slice().reverse().map(d => `
      <div class="list-row">
        <div class="body"><div class="t">${esc(d.title)}</div><div class="d">${esc(d.date)} ｜ ${d.words} 字</div></div>
        <button class="btn sm ghost" data-act="loaddraft" data-id="${d.id}">打开</button>
        <button class="btn sm danger" data-act="deldraft" data-id="${d.id}">删</button>
      </div>`).join('')}
  </div>` : ''}
  `;
};

function getTopic(id) {
  if (!id) return null;
  return DATA.topics.find(x => x.id === id) || null;
}

/* ---------------- 拍摄清单 ---------------- */
VIEWS.shots = () => {
  const keys = Object.keys(DB.shots);
  return `
  <div class="page-head"><h1>🎬 拍摄清单</h1><p>把一个选题拆成能直接开拍的分镜、道具和口播要点。勾选状态会自动保存。</p></div>
  <div class="card">
    <div class="field">
      <label>选一个话题生成清单</label>
      <select id="sTopic">${DATA.topics.map(x => `<option value="${x.id}">${esc(x.platform)} ｜ ${esc(x.title)}</option>`).join('')}</select>
    </div>
    <div class="btn-row"><button class="btn" data-act="mkshot">🎬 生成拍摄清单</button></div>
  </div>
  ${keys.length ? keys.slice().reverse().map(k => {
    const s = DB.shots[k];
    const done = s.items.filter(i => i.done).length;
    return `<div class="card">
      <h3>🎬 ${esc(s.title)} <span class="more">${done}/${s.items.length} 完成 · <span data-act="delshot" data-id="${k}" style="cursor:pointer">删除</span></span></h3>
      <div class="progress" style="margin-bottom:10px"><i style="width:${Math.round(done / s.items.length * 100)}%"></i></div>
      ${s.items.map((it, i) => `
        <label class="checkline ${it.done ? 'done' : ''}">
          <input type="checkbox" ${it.done ? 'checked' : ''} data-act="tickshot" data-id="${k}" data-i="${i}">
          <span class="ct"><b>${esc(it.t)}</b>${it.d ? '<br><span class="mini">' + esc(it.d) + '</span>' : ''}</span>
        </label>`).join('')}
    </div>`;
  }).join('') : `<div class="card"><div class="empty"><span class="big">🎥</span>还没有清单，上面选个话题生成一份</div></div>`}
  `;
};

/* ---------------- 发布记录 ---------------- */
VIEWS.posts = () => {
  const ps = DB.posts.slice().reverse();
  const reads = ps.reduce((s, p) => s + (+p.read || 0), 0);
  const fans = ps.reduce((s, p) => s + (+p.fans || 0), 0);
  const m = today().slice(0, 7);
  const thisMonth = ps.filter(p => (p.date || '').startsWith(m)).length;
  return `
  <div class="page-head"><h1>📮 发布记录</h1><p>发了什么、数据怎么样，记下来才看得出规律。</p></div>
  <div class="grid g4">
    <div class="card tight"><div class="mini">累计发布</div><div style="font-size:23px;font-weight:700">${ps.length}</div></div>
    <div class="card tight"><div class="mini">本月发布</div><div style="font-size:23px;font-weight:700">${thisMonth}</div></div>
    <div class="card tight"><div class="mini">累计阅读</div><div style="font-size:23px;font-weight:700">${reads}</div></div>
    <div class="card tight"><div class="mini">累计涨粉</div><div style="font-size:23px;font-weight:700">${fans}</div></div>
  </div>
  <div class="card">
    <h3>➕ 新增一条</h3>
    <div class="grid g3">
      <div class="field"><label>日期</label><input type="date" id="pDate" value="${today()}"></div>
      <div class="field"><label>平台</label><select id="pPlat">${DB.prefs.platforms.map(x => `<option>${esc(x)}</option>`).join('')}</select></div>
      <div class="field"><label>标题</label><input type="text" id="pTitle" placeholder="文章或视频标题"></div>
      <div class="field"><label>阅读 / 播放</label><input type="number" id="pRead" placeholder="0"></div>
      <div class="field"><label>涨粉</label><input type="number" id="pFans" placeholder="0"></div>
      <div class="field"><label>备注</label><input type="text" id="pNote" placeholder="这条为什么行或者为什么不行"></div>
    </div>
    <button class="btn" data-act="addpost">保存这条</button>
  </div>
  <div class="card">
    <h3>📋 全部记录</h3>
    ${ps.length ? `<div class="tw"><table>
      <tr><th>日期</th><th>平台</th><th>标题</th><th>阅读</th><th>涨粉</th><th>备注</th><th></th></tr>
      ${ps.map(p => `<tr>
        <td>${esc(p.date)}</td><td><span class="pill p">${esc(p.plat)}</span></td>
        <td>${esc(p.title)}</td><td>${esc(p.read || 0)}</td><td>${esc(p.fans || 0)}</td>
        <td class="mini">${esc(p.note || '')}</td>
        <td><span data-act="delpost" data-id="${p.id}" style="cursor:pointer;color:#D9536F">删</span></td>
      </tr>`).join('')}
    </table></div>` : `<div class="empty"><span class="big">📭</span>还没有记录</div>`}
  </div>`;
};

/* ---------------- 搞钱灵感 ---------------- */
VIEWS.money = () => {
  const bars = ['全部', '极低', '低', '中'];
  const list = DATA.money.filter(m => MSTATE.bar === '全部' || m.barrier === MSTATE.bar);
  return `
  <div class="page-head"><h1>💰 搞钱灵感</h1><p>每天更新，只收零门槛或低门槛、平台官方入口、不需要先交钱的项目。</p></div>
  <div class="card tight" style="background:#FFF8EC;border-color:#FFE7C2">
    <div class="mini" style="color:#8A6516">⚠️ 先说清楚：下面的收益区间来自公开报道里的从业者反馈，属于上限不是保底，前两周大概率一分钱都赚不到。凡是要你先交押金、培训费、激活费的，全部拉黑。</div>
  </div>
  <div class="chips">${bars.map(b => `<span class="chip pink ${MSTATE.bar === b ? 'on' : ''}" data-act="bar" data-b="${b}">${b === '全部' ? '全部' : '门槛' + b}</span>`).join('')}</div>
  ${list.length ? `<div class="grid g2">${list.map(m => `
    <div class="money-card">
      <div class="mh"><span style="font-size:20px">${m.emoji}</span><span class="mn">${esc(m.name)}</span></div>
      <div class="btn-row" style="margin-bottom:9px">
        <span class="pill g">门槛 ${esc(m.barrier)}</span>
        <span class="pill">启动 ${esc(m.cost)}</span>
      </div>
      <div class="kv"><b>参考收益</b><span>${esc(m.income)}</span></div>
      <div class="kv"><b>适合谁</b><span>${esc(m.fitFor)}</span></div>
      <div class="kv"><b>去哪做</b><span>${esc(m.channel)}</span></div>
      <ol class="steps">${(m.steps || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="risk">🚧 ${esc(m.risk)}</div>
      ${m.source && m.source.url ? `<div style="margin-top:8px"><a class="src" href="${esc(m.source.url)}" target="_blank" rel="noopener">信息来源 ${esc(m.source.name)} ↗</a></div>` : ''}
    </div>`).join('')}</div>` : `<div class="card"><div class="empty"><span class="big">🪙</span>这个门槛下暂时没有项目</div></div>`}
  `;
};

/* ---------------- 成长计划 ---------------- */
VIEWS.growth = () => {
  const cells = [];
  for (let i = 83; i >= 0; i--) {
    const d = daysAgo(i);
    const n = (DB.checkins[d] || []).length;
    cells.push(`<i class="${n ? 'l' + Math.min(n, 4) : ''}" title="${d} 打卡 ${n} 次"></i>`);
  }
  return `
  <div class="page-head"><h1>🌱 成长计划</h1><p>目标写下来才算数。下面是最近 12 周的打卡热力图。</p></div>
  <div class="card">
    <h3>🔥 打卡热力图 <span class="more">连续 ${streak()} 天 · 本周 ${weekCount()} 次</span></h3>
    <div class="heat">${cells.join('')}</div>
    <div class="mini" style="margin-top:9px">颜色越深当天打卡越多。今天的打卡在首页点。</div>
  </div>
  <div class="card">
    <h3>🎯 我的目标</h3>
    <div class="grid g3">
      <div class="field"><label>目标名称</label><input type="text" id="gName" placeholder="例如 公众号做到 1000 粉"></div>
      <div class="field"><label>截止日期</label><input type="date" id="gDate"></div>
      <div class="field"><label>当前进度 %</label><input type="number" id="gPct" value="0" min="0" max="100"></div>
    </div>
    <button class="btn" data-act="addgoal">添加目标</button>
  </div>
  ${DB.goals.length ? DB.goals.map(g => `
    <div class="card tight">
      <div class="list-row" style="border:none;padding:0">
        <div class="body">
          <div class="t">🎯 ${esc(g.name)}</div>
          <div class="d">截止 ${esc(g.date || '未设置')} ｜ 进度 ${g.pct}%</div>
          <div class="progress" style="margin-top:7px"><i style="width:${g.pct}%"></i></div>
        </div>
        <button class="btn sm ghost" data-act="goalup" data-id="${g.id}">+10%</button>
        <button class="btn sm danger" data-act="delgoal" data-id="${g.id}">删</button>
      </div>
    </div>`).join('') : `<div class="card"><div class="empty"><span class="big">🌿</span>还没有目标，先写一个小的</div></div>`}
  `;
};

/* ---------------- 技能学习 ---------------- */
VIEWS.skills = () => {
  const total = DB.skills.reduce((s, x) => s + (x.done || 0), 0);
  return `
  <div class="page-head"><h1>🎓 技能学习</h1><p>把技能拆成小时数，学一次记一次。累计已学 ${total} 小时。</p></div>
  <div class="card">
    <h3>➕ 新增技能</h3>
    <div class="grid g3">
      <div class="field"><label>技能名称</label><input type="text" id="kName" placeholder="例如 剪映进阶 / AI 出图 / 版式设计"></div>
      <div class="field"><label>目标小时数</label><input type="number" id="kTarget" value="20" min="1"></div>
      <div class="field"><label>备注</label><input type="text" id="kNote" placeholder="学来干什么"></div>
    </div>
    <button class="btn" data-act="addskill">添加</button>
  </div>
  ${DB.skills.length ? DB.skills.map(s => {
    const pct = Math.min(100, Math.round((s.done || 0) / (s.target || 1) * 100));
    return `<div class="card tight">
      <div class="list-row" style="border:none;padding:0">
        <div class="body">
          <div class="t">🎓 ${esc(s.name)} <span class="pill">${s.done || 0} / ${s.target} 小时</span></div>
          ${s.note ? `<div class="d">${esc(s.note)}</div>` : ''}
          <div class="progress" style="margin-top:7px"><i style="width:${pct}%"></i></div>
        </div>
        <button class="btn sm ghost" data-act="skilladd" data-id="${s.id}" data-v="0.5">+30分</button>
        <button class="btn sm" data-act="skilladd" data-id="${s.id}" data-v="1">+1小时</button>
        <button class="btn sm danger" data-act="delskill" data-id="${s.id}">删</button>
      </div>
    </div>`;
  }).join('') : `<div class="card"><div class="empty"><span class="big">📐</span>还没有技能条目</div></div>`}
  `;
};

/* ---------------- 读书 ---------------- */
VIEWS.books = () => {
  const fin = DB.books.filter(b => b.status === '已读完').length;
  return `
  <div class="page-head"><h1>📚 读书</h1><p>今年已读完 ${fin} 本，在读 ${DB.books.filter(b => b.status === '在读').length} 本。</p></div>
  <div class="card">
    <h3>➕ 添加一本书</h3>
    <div class="grid g4">
      <div class="field"><label>书名</label><input type="text" id="bName" placeholder="书名"></div>
      <div class="field"><label>作者</label><input type="text" id="bAuthor" placeholder="作者"></div>
      <div class="field"><label>总页数</label><input type="number" id="bTotal" value="300" min="1"></div>
      <div class="field"><label>状态</label><select id="bStatus"><option>在读</option><option>想读</option><option>已读完</option></select></div>
    </div>
    <button class="btn" data-act="addbook">添加</button>
  </div>
  ${DB.books.length ? DB.books.map(b => {
    const pct = Math.min(100, Math.round((b.page || 0) / (b.total || 1) * 100));
    return `<div class="card tight">
      <div class="list-row" style="border:none;padding:0;flex-wrap:wrap">
        <div class="body" style="min-width:200px">
          <div class="t">📖 ${esc(b.name)} <span class="pill ${b.status === '已读完' ? 'g' : b.status === '在读' ? 'p' : ''}">${esc(b.status)}</span></div>
          <div class="d">${esc(b.author || '佚名')} ｜ ${b.page || 0} / ${b.total} 页</div>
          <div class="progress" style="margin-top:7px"><i style="width:${pct}%"></i></div>
        </div>
        <button class="btn sm ghost" data-act="bookadd" data-id="${b.id}" data-v="10">+10页</button>
        <button class="btn sm" data-act="bookadd" data-id="${b.id}" data-v="30">+30页</button>
        <button class="btn sm ghost" data-act="booknote" data-id="${b.id}">笔记</button>
        <button class="btn sm danger" data-act="delbook" data-id="${b.id}">删</button>
      </div>
      ${b.note ? `<div class="risk" style="background:var(--blue-soft);color:var(--blue-deep);margin-top:9px">📝 ${esc(b.note)}</div>` : ''}
    </div>`;
  }).join('') : `<div class="card"><div class="empty"><span class="big">📕</span>书架空着，加一本吧</div></div>`}
  `;
};

/* ---------------- 设置 ---------------- */
VIEWS.settings = () => {
  const all = ['抖音', '小红书', '视频号', '微博', '公众号', '知乎', 'B站', '快手'];
  return `
  <div class="page-head"><h1>⚙️ 设置</h1><p>偏好、备份和使用说明都在这里。</p></div>
  <div class="card">
    <h3>🙋 我的称呼</h3>
    <div class="field"><input type="text" id="sNick" value="${esc(DB.prefs.nick)}" placeholder="首页怎么称呼你"></div>
    <button class="btn sm" data-act="savenick">保存</button>
  </div>
  <div class="card">
    <h3>📱 关注的平台</h3>
    <div class="chips">${all.map(p => `<span class="chip ${DB.prefs.platforms.includes(p) ? 'on' : ''}" data-act="togplat" data-p="${p}">${p}</span>`).join('')}</div>
    <div class="mini">选中的平台会出现在选题筛选和发布记录里。</div>
  </div>
  <div class="card">
    <h3>💾 数据备份</h3>
    <div class="mini" style="margin-bottom:10px">所有记录只存在这台设备的浏览器里，换设备或清缓存前记得导出。</div>
    <div class="btn-row">
      <button class="btn" data-act="export">⬇️ 导出备份文件</button>
      <button class="btn ghost" data-act="import">⬆️ 导入备份</button>
      <button class="btn danger" data-act="clear">🗑️ 清空全部记录</button>
    </div>
    <input type="file" id="impFile" accept=".json" style="display:none">
  </div>
  <div class="card">
    <h3>📲 装到手机桌面</h3>
    <div class="mini" style="line-height:1.9">
      <b>iPhone</b>：Safari 打开本页 → 底部分享按钮 → 添加到主屏幕。<br>
      <b>安卓</b>：Chrome 打开本页 → 右上角三个点 → 添加到主屏幕 / 安装应用。<br>
      <b>电脑</b>：Chrome 或 Edge 打开 → 地址栏右侧的安装图标 → 安装。<br>
      装好之后没有网也能打开，显示的是上一次抓到的数据。
    </div>
  </div>
  <div class="card">
    <h3>🔄 数据是怎么来的</h3>
    <div class="mini" style="line-height:1.9">
      每天早晨由本机的定时任务联网抓取各平台热榜和公开报道，生成当天的选题、精写稿和搞钱项目，写入 data/daily.js。<br>
      当前状态：<b>${esc(DATA.from)}</b>${DATA.updatedAt ? '，更新于 ' + esc(DATA.updatedAt) : ''}。<br>
      抓取失败或者没网的时候，页面会自动用上一次的数据，不会空白。
    </div>
  </div>
  <div class="card">
    <h3>⚖️ 关于内容的几句实话</h3>
    <div class="mini" style="line-height:1.9">
      热搜词是选题线索，不等于已核实的事实，动笔前请点开来源自己核一遍。<br>
      搞钱项目的收益区间来自公开报道中的从业者反馈，属于上限而非保底，个人结果差异很大。<br>
      生成的文案是初稿，观点和事实都需要你自己过一遍再发。
    </div>
  </div>`;
};
