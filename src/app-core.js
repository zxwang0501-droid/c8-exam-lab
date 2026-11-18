// ---------- state & storage ----------
const $ = s => document.querySelector(s);
const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));
const KIND = {mc:{zh:'单选', en:'Multiple choice'}, multi:{zh:'多选', en:'Select all'}, tf:{zh:'判断', en:'True / False'}, short:{zh:'简答', en:'Short answer'}, code:{zh:'代码填空', en:'Code'}, case:{zh:'大题', en:'Case study'}};
const PTS = {mc:2, multi:3, tf:2, short:4, code:4};
const WEAK = ['hyptest', 'ci', 'bootstrap', 'abtest'];
const store = {
  get(k, d) { try { const v = localStorage.getItem('c8lab:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('c8lab:' + k, JSON.stringify(v)); } catch {} },
};
const S = {
  topics: new Set(store.get('topics', ['hyptest', 'ci', 'bootstrap'])),
  count: store.get('count', 10),
  cases: store.get('cases', 1),
  kinds: new Set(store.get('kinds', ['mc', 'multi', 'tf', 'short', 'code']).filter(k => PTS[k])),
  diff: store.get('diff', 'mixed'),
  mode: store.get('mode', 'practice'),
  src: 'bank',
  exam: [],
  submitted: false, startedAt: 0, timer: null,
  sample: null, aiCtl: null,
};
const saveSettings = () => { store.set('topics', [...S.topics]); store.set('count', S.count); store.set('cases', S.cases); store.set('kinds', [...S.kinds]); store.set('diff', S.diff); store.set('mode', S.mode); };

// ---------- text helpers ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const rich = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
const LETTERS = 'ABCDEFGH';
const ANCHOR = /^(none of|all of|not enough|cannot be|neither)/i;
const ptsOf = q => q.k === 'case' ? q.parts.reduce((s, p) => s + ptsOf(p), 0) : (q.pts || PTS[q.k] || 2);
// Every answerable unit has a key: "3" for question 3, "3-1" for part (b) of case question 3.
const getQ = key => { const [i, j] = String(key).split('-').map(Number); return j == null || isNaN(j) ? S.exam[i] : S.exam[i].parts[j]; };
const units = () => S.exam.flatMap((q, i) => q.k === 'case' ? q.parts.map((p, j) => ({q: p, key: `${i}-${j}`, parent: q})) : [{q, key: String(i)}]);
const unitScore = q => q.k === 'short' ? q.self : q.res?.score;

// ---------- building an exam from the bank ----------
function poolFor(topics, kinds, diff) {
  const okD = q => diff === 'mixed' || (diff === 'exam' ? q.d >= 2 : q.d >= 3);
  const statics = BANK.filter(q => q.t.some(t => topics.has(t)) && kinds.has(q.k) && okD(q));
  const gens = kinds.has('mc') ? GENS.filter(g => g.t.some(t => topics.has(t)) && (diff !== 'hard' || g.d >= 2)) : [];
  const cases = CASES.filter(c => c.t.some(t => topics.has(t)));
  return {statics, gens, cases};
}

function shuffleChoices(q) {
  if (q.k === 'case') return {...q, parts: q.parts.map(p => shuffleChoices({...p, t: p.t || q.t}))};
  if (!(q.k === 'mc' || q.k === 'multi') || q.fixed) return q;
  const idx = q.c.map((_, i) => i);
  const free = idx.filter(i => !ANCHOR.test(q.c[i])), tail = idx.filter(i => ANCHOR.test(q.c[i]));
  const order = R.shuffle(free).concat(tail);
  const c = order.map(i => q.c[i]);
  const a = q.k === 'mc' ? order.indexOf(q.a) : q.a.map(x => order.indexOf(x)).sort((x, y) => x - y);
  return {...q, c, a};
}

function buildSingles() {
  const {statics, gens} = poolFor(S.topics, S.kinds, S.diff);
  const seen = new Set(store.get('seen', []));
  const byTopic = new Map([...S.topics].map(t => [t, []]));
  const rank = q => (seen.has(q.id) ? 1 : 0) + Math.random() * 0.9 - (q.t.filter(t => S.topics.has(t)).length > 1 ? 0.3 : 0);
  for (const q of statics.slice().sort((a, b) => rank(a) - rank(b))) {
    const home = R.shuffle(q.t.filter(t => S.topics.has(t)))[0];
    byTopic.get(home).push({type:'static', q});
  }
  for (const g of gens) {
    const list = byTopic.get(R.pick(g.t.filter(t => S.topics.has(t))));
    list.splice(Math.min(list.length, R.int(1, 3)), 0, {type:'gen', g});
    list.push({type:'gen', g});
  }
  const out = [], used = new Set(), topicOrder = R.shuffle([...S.topics]);
  let guard = 0;
  while (out.length < S.count && guard++ < 500) {
    let progressed = false;
    for (const t of topicOrder) {
      if (out.length >= S.count) break;
      const list = byTopic.get(t);
      while (list.length) {
        const item = list.shift();
        if (item.type === 'static') { if (used.has(item.q.id)) continue; used.add(item.q.id); out.push(shuffleChoices(item.q)); progressed = true; break; }
        const made = item.g.make();
        out.push(shuffleChoices({...made, id: item.g.id + '-' + Math.random().toString(36).slice(2, 7), t: item.g.t, d: item.g.d, gen: true}));
        progressed = true; break;
      }
    }
    if (!progressed) break;
  }
  const pos = id => TOPICS.findIndex(t => t.id === id);
  out.sort((a, b) => Math.min(...a.t.map(pos)) - Math.min(...b.t.map(pos)));
  return out;
}

// A "True or False" block like the ones that open recent finals: 8 statements, 2 points each.
function tfBlock(exclude) {
  let pool = BANK.filter(q => q.k === 'tf' && q.t.some(t => S.topics.has(t)) && !exclude.has(q.id));
  if (pool.length < 6) return null;
  const parts = R.shuffle(pool).slice(0, 8).map((q, j) => ({...q, l: 'abcdefgh'[j], pts: 2}));
  const t = [...new Set(parts.flatMap(p => p.t))];
  return {id: 'tfb-' + Math.random().toString(36).slice(2, 7), k: 'case', d: 2, title: 'True or False', t,
    bg: 'For each statement below, choose True or False. Each part is worth 2 points.', bgzh: '判断以下每个说法的对错，每小题 2 分。', parts};
}

function buildCases(n, singles) {
  if (!n) return [];
  const seen = new Set(store.get('seen', []));
  const overlap = c => c.t.filter(t => S.topics.has(t)).length / c.t.length;
  const ranked = poolFor(S.topics, S.kinds, S.diff).cases
    .map(c => ({c, r: (seen.has(c.id) ? 1 : 0) + Math.random() * 0.6 - overlap(c)}))
    .sort((a, b) => a.r - b.r).map(x => x.c);
  const out = ranked.slice(0, n).map(c => shuffleChoices(c));
  if (out.length < n) { const b = tfBlock(new Set(singles.map(q => q.id))); if (b) out.unshift(b); }
  return out;
}

function buildExam() {
  const singles = buildSingles();
  const cases = buildCases(S.cases, singles);
  const all = [...singles, ...cases];
  store.set('seen', [...new Set([...all.map(q => q.id), ...store.get('seen', [])])].slice(0, 400));
  return all;
}

// ---------- rendering ----------
function renderExam(title) {
  S.submitted = false;
  units().forEach(({q}) => { q.res = null; q.self = null; q.ai = null; });
  $('#paperTitle').textContent = title;
  const singles = S.exam.filter(q => q.k !== 'case'), cases = S.exam.filter(q => q.k === 'case');
  const total = S.exam.reduce((s, q) => s + ptsOf(q), 0);
  const kinds = {}; singles.forEach(q => kinds[q.k] = (kinds[q.k] || 0) + 1);
  const topicNames = [...new Set(units().flatMap(u => u.q.t || u.parent.t))].filter(t => TOPIC[t]).map(t => TOPIC[t].en);
  $('#paperMeta').innerHTML = `<span>${S.exam.length} 题 · 共 ${total} 分</span><span>${Object.entries(kinds).map(([k, n]) => `${KIND[k].zh} ${n}`).join(' · ')}${cases.length ? ` · 大题 ${cases.length}` : ''}</span><span>${S.mode === 'exam' ? '考试模式：交卷后统一批改' : '练习模式：每题可单独检查'}</span><span id="clock"></span>` +
    `<span style="flex-basis:100%">${esc(topicNames.join(' · '))}</span>`;
  $('#questions').innerHTML = S.exam.length ? S.exam.map((q, i) => q.k === 'case' ? renderCase(q, i) : renderQ(q, i)).join('') :
    `<div class="empty">当前组合没有可用的题目。换几个知识点或题型试试。<br>No questions match. Try other topics or types.</div>`;
  $('#submitBar').hidden = !S.exam.length;
  $('#results').hidden = true; $('#results').innerHTML = '';
  $('#submitBtn').textContent = S.mode === 'exam' ? '交卷 Submit' : '全部批改 Grade all';
  clearInterval(S.timer); S.startedAt = Date.now();
  const tick = () => { const s = Math.floor((Date.now() - S.startedAt) / 1000); const el = $('#clock'); if (el) el.textContent = `⏱ ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  tick(); S.timer = setInterval(tick, 1000);
  updateAnswered();
}

function bodyHTML(q, key) {
  if (q.k === 'mc' || q.k === 'multi' || q.k === 'tf') {
    const c = q.k === 'tf' ? ['True', 'False'] : q.c;
    const type = q.k === 'multi' ? 'checkbox' : 'radio';
    return `<div class="opts" role="${q.k === 'multi' ? 'group' : 'radiogroup'}">` + c.map((txt, j) =>
      `<label class="opt" data-j="${j}"><input type="${type}" name="q${key}" id="q${key}o${j}" value="${j}"><span class="bub ${q.k === 'multi' ? 's' : 'c'}">${LETTERS[j]}</span><span class="txt">${rich(txt)}</span></label>`).join('') + `</div>`;
  }
  if (q.k === 'code') return `<div class="blanks">` + q.blanks.map((b, j) => `<div class="blank"><label for="q${key}b${j}">${b.l === 'output' ? 'output' : '[' + esc(b.l) + ']'}</label><input id="q${key}b${j}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${b.l === 'output' ? 'value' : 'code for blank ' + esc(b.l)}"></div>`).join('') + `</div>`;
  return `<textarea id="q${key}t" placeholder="用英文或中文作答都可以。Answer in English or Chinese."></textarea>`;
}
const actionsHTML = key => `<div class="q-actions">${S.mode === 'practice' ? `<button class="ghost" data-check="${key}">检查 Check</button>` : ''}<span class="verdict" id="v${key}"></span></div><div id="ex${key}"></div>`;

function renderQ(q, i) {
  const tags = q.t.filter(t => TOPIC[t]).map(t => `<span class="tag">${esc(TOPIC[t].zh)}</span>`).join('');
  const d = '●'.repeat(q.d || 2) + '○'.repeat(3 - (q.d || 2));
  return `<article class="q" id="qcard${i}" data-i="${i}">
    <div class="q-head"><span class="q-num">${i + 1}.</span><span class="tag kind">${KIND[q.k].zh} · ${KIND[q.k].en}</span><span class="tag pts">${ptsOf(q)} pts</span>${q.fromAI ? '<span class="tag ai">Claude 生成</span>' : ''}${q.gen ? '<span class="tag">随机数值</span>' : ''}${tags}<span class="diff" title="difficulty">${d}</span></div>
    <div class="stem">${rich(q.q)}</div>
    ${q.code ? `<pre class="code">${esc(q.code)}</pre>` : ''}
    ${bodyHTML(q, String(i))}
    ${actionsHTML(String(i))}
  </article>`;
}

function renderCase(q, i) {
  const tags = q.t.filter(t => TOPIC[t]).map(t => `<span class="tag">${esc(TOPIC[t].zh)}</span>`).join('');
  const table = q.table ? `<div class="tbl"><table><thead><tr>${q.table.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${q.table.rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>${q.table.more ? `<div class="more">… (${Number(q.table.more).toLocaleString('en-US')} rows omitted)</div>` : ''}</div>` : '';
  const cols = q.cols ? `<ul class="cols">${q.cols.map(c => `<li>${rich(c)}</li>`).join('')}</ul>` : '';
  const parts = q.parts.map((p, j) => {
    const key = `${i}-${j}`;
    return `<div class="part" id="qcard${key}">
      <div class="part-head"><span class="part-l">(${esc(p.l || 'abcdefghij'[j])})</span><span class="tag pts">${ptsOf(p)} pts</span><span class="tag kind">${KIND[p.k].zh}</span>${p.note ? `<span class="hint">${esc(p.note)}</span>` : ''}</div>
      <div class="stem">${rich(p.q)}</div>
      ${p.code ? `<pre class="code">${esc(p.code)}</pre>` : ''}
      ${bodyHTML(p, key)}
      ${actionsHTML(key)}
    </div>`;
  }).join('');
  return `<article class="q case" id="qcard${i}" data-i="${i}">
    <div class="q-head"><span class="q-num">${i + 1}.</span><span class="tag kind">大题 · Case study</span><span class="tag pts">${ptsOf(q)} pts</span>${q.fromAI ? '<span class="tag ai">Claude 生成</span>' : ''}${tags}<span class="case-score" id="cs${i}"></span></div>
    <h3 class="case-title">${esc(q.title)}</h3>
    <div class="bgbox"><div class="stem">${rich(q.bg)}</div>${q.bgzh ? `<details><summary>中文背景提示</summary><p>${rich(q.bgzh)}</p></details>` : ''}</div>
    ${table}${cols}
    ${q.code ? `<pre class="code">${esc(q.code)}</pre>` : ''}
    <div class="parts">${parts}</div>
  </article>`;
}

function updateAnswered() {
  const n = S.exam.filter((q, i) => q.k === 'case' ? q.parts.some((p, j) => isAnswered(p, `${i}-${j}`)) : isAnswered(q, String(i))).length;
  $('#answeredInfo').textContent = S.exam.length ? `已作答 ${n} / ${S.exam.length}` : '';
}
function isAnswered(q, key) {
  if (q.k === 'code') return q.blanks.some((_, j) => (document.getElementById(`q${key}b${j}`)?.value || '').trim());
  if (q.k === 'short') return (document.getElementById(`q${key}t`)?.value || '').trim().length > 0;
  return !!document.querySelector(`input[name="q${key}"]:checked`);
}
