// ---------- state & storage ----------
const $ = s => document.querySelector(s);
const TOPIC = Object.fromEntries(TOPICS.map(t => [t.id, t]));
const KIND = {mc:{zh:'单选', en:'Multiple choice'}, multi:{zh:'多选', en:'Select all'}, tf:{zh:'判断', en:'True / False'}, short:{zh:'简答', en:'Short answer'}, code:{zh:'代码填空', en:'Code'}};
const WEAK = ['hyptest', 'ci', 'bootstrap', 'abtest'];
const store = {
  get(k, d) { try { const v = localStorage.getItem('c8lab:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('c8lab:' + k, JSON.stringify(v)); } catch {} },
};
const S = {
  topics: new Set(store.get('topics', ['hyptest', 'ci', 'bootstrap'])),
  count: store.get('count', 10),
  kinds: new Set(store.get('kinds', ['mc', 'multi', 'tf', 'short', 'code'])),
  diff: store.get('diff', 'mixed'),
  mode: store.get('mode', 'practice'),
  src: 'bank',
  exam: [], // prepared questions
  submitted: false, startedAt: 0, timer: null,
  sample: null, aiCtl: null,
};
const saveSettings = () => { store.set('topics', [...S.topics]); store.set('count', S.count); store.set('kinds', [...S.kinds]); store.set('diff', S.diff); store.set('mode', S.mode); };

// ---------- text helpers ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const rich = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
const LETTERS = 'ABCDEFGH';
const ANCHOR = /^(none of|all of|not enough|cannot be|neither)/i;

// ---------- building an exam from the bank ----------
function poolFor(topics, kinds, diff) {
  const okD = q => diff === 'mixed' || (diff === 'exam' ? q.d >= 2 : q.d >= 3);
  const statics = BANK.filter(q => q.t.some(t => topics.has(t)) && kinds.has(q.k) && okD(q));
  const gens = kinds.has('mc') ? GENS.filter(g => g.t.some(t => topics.has(t)) && (diff !== 'hard' || g.d >= 2)) : [];
  return {statics, gens};
}

function shuffleChoices(q) {
  if (!(q.k === 'mc' || q.k === 'multi') || q.fixed) return q;
  const idx = q.c.map((_, i) => i);
  const free = idx.filter(i => !ANCHOR.test(q.c[i])), tail = idx.filter(i => ANCHOR.test(q.c[i]));
  const order = R.shuffle(free).concat(tail);
  const c = order.map(i => q.c[i]);
  const a = q.k === 'mc' ? order.indexOf(q.a) : q.a.map(x => order.indexOf(x)).sort((x, y) => x - y);
  return {...q, c, a};
}
// Generator output with a fixed list still needs its correct answer moved off position 0.
function shuffleGen(q) {
  if (q.k !== 'mc') return q;
  if (!q.fixed) return shuffleChoices(q);
  return q;
}

function buildExam() {
  const {statics, gens} = poolFor(S.topics, S.kinds, S.diff);
  const seen = new Set(store.get('seen', []));
  const byTopic = new Map([...S.topics].map(t => [t, []]));
  // Fresh questions first, then ones seen recently; questions tagged with several chosen topics get a boost.
  const rank = q => (seen.has(q.id) ? 1 : 0) + Math.random() * 0.9 - (q.t.filter(t => S.topics.has(t)).length > 1 ? 0.3 : 0);
  for (const q of statics.slice().sort((a, b) => rank(a) - rank(b))) {
    const home = R.shuffle(q.t.filter(t => S.topics.has(t)))[0];
    byTopic.get(home).push({type:'static', q});
  }
  for (const g of gens) {
    const home = R.pick(g.t.filter(t => S.topics.has(t)));
    // Each template can appear up to twice; slot it in after a couple of fixed questions.
    const list = byTopic.get(home);
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
        out.push(shuffleGen({...made, id: item.g.id + '-' + Math.random().toString(36).slice(2, 7), t: item.g.t, d: item.g.d, gen: true}));
        progressed = true; break;
      }
    }
    if (!progressed) break;
  }
  // Exam order: follow the syllabus, the way a real paper moves from earlier to later material.
  const pos = id => TOPICS.findIndex(t => t.id === id);
  out.sort((a, b) => Math.min(...a.t.map(pos)) - Math.min(...b.t.map(pos)));
  store.set('seen', [...new Set([...out.map(q => q.id), ...seen])].slice(0, 400));
  return out;
}

// ---------- rendering questions ----------
function renderExam(title) {
  S.submitted = false;
  S.exam.forEach(q => { q.res = null; q.self = null; q.ai = null; });
  $('#paperTitle').textContent = title;
  const kinds = {}; S.exam.forEach(q => kinds[q.k] = (kinds[q.k] || 0) + 1);
  const topicNames = [...new Set(S.exam.flatMap(q => q.t))].filter(t => TOPIC[t]).map(t => TOPIC[t].en);
  $('#paperMeta').innerHTML = `<span>${S.exam.length} 题 questions</span><span>${Object.entries(kinds).map(([k, n]) => `${KIND[k].zh} ${n}`).join(' · ')}</span><span>${S.mode === 'exam' ? '考试模式：交卷后统一批改' : '练习模式：每题可单独检查'}</span><span id="clock"></span>` +
    `<span style="flex-basis:100%">${esc(topicNames.join(' · '))}</span>`;
  $('#questions').innerHTML = S.exam.length ? S.exam.map((q, i) => renderQ(q, i)).join('') :
    `<div class="empty">当前组合没有可用的题目。换几个知识点或题型试试。<br>No questions match. Try other topics or types.</div>`;
  $('#submitBar').hidden = !S.exam.length;
  $('#results').hidden = true; $('#results').innerHTML = '';
  $('#submitBtn').textContent = S.mode === 'exam' ? '交卷 Submit' : '全部批改 Grade all';
  clearInterval(S.timer); S.startedAt = Date.now();
  const tick = () => { const s = Math.floor((Date.now() - S.startedAt) / 1000); const el = $('#clock'); if (el) el.textContent = `⏱ ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  tick(); S.timer = setInterval(tick, 1000);
  updateAnswered();
}

function renderQ(q, i) {
  const tags = q.t.filter(t => TOPIC[t]).map(t => `<span class="tag">${esc(TOPIC[t].zh)}</span>`).join('');
  const d = '●'.repeat(q.d || 2) + '○'.repeat(3 - (q.d || 2));
  let body = '';
  if (q.k === 'mc' || q.k === 'multi' || q.k === 'tf') {
    const c = q.k === 'tf' ? ['True', 'False'] : q.c;
    const type = q.k === 'multi' ? 'checkbox' : 'radio';
    body = `<div class="opts" role="${q.k === 'multi' ? 'group' : 'radiogroup'}">` + c.map((txt, j) =>
      `<label class="opt" data-j="${j}"><input type="${type}" name="q${i}" id="q${i}o${j}" value="${j}"><span class="bub ${q.k === 'multi' ? 's' : 'c'}">${LETTERS[j]}</span><span class="txt">${rich(txt)}</span></label>`).join('') + `</div>`;
  } else if (q.k === 'code') {
    body = `<div class="blanks">` + q.blanks.map((b, j) => `<div class="blank"><label for="q${i}b${j}">${b.l === 'output' ? 'output' : '[' + esc(b.l) + ']'}</label><input id="q${i}b${j}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${b.l === 'output' ? 'value' : 'code for blank ' + esc(b.l)}"></div>`).join('') + `</div>`;
  } else {
    body = `<textarea id="q${i}t" placeholder="用英文或中文作答都可以。Answer in English or Chinese."></textarea>`;
  }
  return `<article class="q" id="qcard${i}" data-i="${i}">
    <div class="q-head"><span class="q-num">${i + 1}.</span><span class="tag kind">${KIND[q.k].zh} · ${KIND[q.k].en}</span>${q.ai ? '' : ''}${q.fromAI ? '<span class="tag ai">Claude 生成</span>' : ''}${q.gen ? '<span class="tag">随机数值</span>' : ''}${tags}<span class="diff" title="difficulty">${d}</span></div>
    <div class="stem">${rich(q.q)}</div>
    ${q.code ? `<pre class="code">${esc(q.code)}</pre>` : ''}
    ${body}
    <div class="q-actions">${S.mode === 'practice' ? `<button class="ghost" data-check="${i}">检查 Check</button>` : ''}<span class="verdict" id="v${i}"></span></div>
    <div id="ex${i}"></div>
  </article>`;
}

function updateAnswered() {
  const n = S.exam.filter((q, i) => isAnswered(q, i)).length;
  $('#answeredInfo').textContent = S.exam.length ? `已作答 ${n} / ${S.exam.length}` : '';
}
function isAnswered(q, i) {
  if (q.k === 'code') return q.blanks.some((_, j) => ($('#q' + i + 'b' + j)?.value || '').trim());
  if (q.k === 'short') return ($('#q' + i + 't')?.value || '').trim().length > 0;
  return !!document.querySelector(`input[name="q${i}"]:checked`);
}
