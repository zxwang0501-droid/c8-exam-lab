// ---------- static text & language ----------
function applyStatic() {
  document.documentElement.lang = {zh: 'zh-CN', en: 'en', es: 'es'}[LANG];
  document.querySelectorAll('[data-t]').forEach(e => { e.textContent = t(e.dataset.t); });
  document.querySelectorAll('[data-th]').forEach(e => { e.innerHTML = t(e.dataset.th); });
  document.querySelectorAll('[data-tp]').forEach(e => { e.placeholder = t(e.dataset.tp); });
  document.querySelectorAll('[data-lang]').forEach(b => { b.classList.toggle('on', b.dataset.lang === LANG); b.setAttribute('aria-pressed', b.dataset.lang === LANG); });
  $('#langGroup').setAttribute('aria-label', t('langLabel'));
}
function setLang(l) {
  if (l === LANG) return;
  // Remember what was typed or ticked, re-translate the paper in place, then put the answers back.
  const snap = [...document.querySelectorAll('#questions input, #questions textarea')].map(e => ({id: e.id, checked: e.checked, value: e.value}));
  LANG = l; store.set('lang', l);
  S.exam = S.exam.map(relocal);
  applyStatic(); renderSetup(); renderKB(); renderMistakes();
  renderExam(true);
  snap.forEach(s => { const e = el(s.id); if (!e) return; if (e.type === 'radio' || e.type === 'checkbox') e.checked = s.checked; else e.value = s.value; });
  units().forEach(({q, key}) => { if (q.res || q.self != null) showResult(key, false); });
  if (S.submitted) renderResults();
  updateAnswered();
  const st = $('#status'); if (!st.hidden) setStatus('');
}

// ---------- setup rail ----------
function renderSetup() {
  const counts = {};
  TOPICS.forEach(x => counts[x.id] = BANK.filter(q => q.t.includes(x.id)).length + GENS.filter(g => g.t.includes(x.id)).length + CASES.filter(c => c.t.includes(x.id)).length);
  $('#topicList').innerHTML = Object.keys(UNITS).map(u => `<div class="unit"><h4>${esc(unitName(u))}</h4>` +
    TOPICS.filter(x => x.unit === u).map(x => `<label class="topic${S.topics.has(x.id) ? ' on' : ''}" for="tp-${x.id}"><input type="checkbox" id="tp-${x.id}" data-topic="${x.id}"${S.topics.has(x.id) ? ' checked' : ''}><span>${esc(topicName(x.id))}${LANG === 'zh' || WEAK.includes(x.id) ? `<span class="tz">${esc(topicSub(x.id))}${WEAK.includes(x.id) ? esc(t('weakTag')) : ''}</span>` : ''}</span><span class="n">${counts[x.id]}</span></label>`).join('') + `</div>`).join('');
  $('#selCount').textContent = t('selCount', {n: S.topics.size});
  const seg = (sel, items, cur, attr) => { $(sel).innerHTML = items.map(([v, label, dis]) => `<button data-${attr}="${v}" class="${(cur instanceof Set ? cur.has(v) : cur == v) ? 'on' : ''}"${dis ? ' disabled' : ''} aria-pressed="${cur instanceof Set ? cur.has(v) : cur == v}">${esc(label)}</button>`).join(''); };
  seg('#countSeg', [[0, '0'], [5, '5'], [10, '10'], [15, '15'], [20, '20'], [30, '30']], S.count, 'count');
  seg('#caseToggle', [['on', t('caseOn')], ['off', t('caseOff')]], S.caseOn ? 'on' : 'off', 'caseon');
  seg('#caseSeg', [1, 2, 3, 4, 5].map(n => [n, t('caseN', {n})]), S.cases, 'cases');
  $('#caseSeg').hidden = !S.caseOn;
  seg('#typeSeg', Object.keys(PTS).map(k => [k, LANG === 'zh' ? `${KIND[k].zh} ${KIND[k].en}` : KIND_L[k][LANG]]), S.kinds, 'kind');
  seg('#diffSeg', [['mixed', t('dMixed')], ['exam', t('dExam')], ['hard', t('dHard')]], S.diff, 'diff');
  seg('#modeSeg', [['practice', t('mPractice')], ['exam', t('mExam')]], S.mode, 'mode');
  seg('#srcSeg', [['bank', t('sBank')], ['ai', t('sAI')]], S.src, 'src');
  $('#srcHint').textContent = t(S.src === 'ai' ? 'hintAI' : 'hintBank');
  renderAIPanel();
  const {statics, gens, cases} = poolFor(S.topics, S.kinds, S.diff);
  $('#poolInfo').textContent = S.topics.size ? t('pool', {a: statics.length, b: gens.length, c: S.caseOn ? cases.length : 0}) : '';
}

// ---------- concepts ----------
function kbEntry(topic, i) {
  const [term, en, zh, trap] = KB[topic][i];
  if (LANG === 'zh') return {name: term, lines: [['en', en], ['zh', zh]], trap};
  if (LANG === 'en') return {name: term, lines: [['zh', en]], trap: KB_EN[topic]?.[i] || ''};
  const es = KB_ES[topic]?.[i];
  if (!es) return {name: term, lines: [['zh', en]], trap: ''};
  return {name: es[0] === term ? term : `${es[0]} (${term})`, lines: [['zh', es[1]]], trap: es[2] || ''};
}
function renderKB() {
  const term = ($('#kbSearch').value || '').trim().toLowerCase();
  const hl = s => { const h = esc(s); if (!term) return h; const x = esc(term).toLowerCase(); const i = h.toLowerCase().indexOf(x); return i < 0 ? h : h.slice(0, i) + '<mark>' + h.slice(i, i + x.length) + '</mark>' + h.slice(i + x.length); };
  let shown = 0;
  const html = TOPICS.map(x => {
    const items = (KB[x.id] || []).map((_, i) => kbEntry(x.id, i)).filter(e => !term || [e.name, e.trap, ...e.lines.map(l => l[1])].join(' ').toLowerCase().includes(term) || topicName(x.id).toLowerCase().includes(term) || x.zh.includes(term));
    if (!items.length) return '';
    shown += items.length;
    return `<section class="kb-topic" id="kb-${x.id}"><header><h2>${esc(topicName(x.id))}</h2>${LANG === 'zh' ? `<span class="zh">${esc(x.zh)}</span>` : ''}<span class="lec">${esc(LANG === 'es' ? UNIT_ES[x.unit] : UNITS[x.unit].en)} · ${x.lec}</span><button class="ghost" data-drill="${x.id}">${t('kbPractice')}</button></header>
      <div class="kb-list">${items.map(e => `<div class="kb-item"><h3>${hl(e.name)}</h3>${e.lines.map(([cls, s]) => `<div class="${cls}">${hl(s)}</div>`).join('')}${e.trap ? `<div class="trap" data-label="${esc(t('kbTrap'))}">${hl(e.trap)}</div>` : ''}</div>`).join('')}</div></section>`;
  }).join('');
  $('#kbBody').innerHTML = html || `<div class="empty">${t('kbNone')}</div>`;
  $('#kbCount').textContent = t('kbCount', {a: shown, b: TOPICS.length, c: BANK.length, d: CASES.length, e: GENS.length});
}

// ---------- routing ----------
function route() {
  const v = ['exam', 'concepts', 'mistakes'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'exam';
  document.querySelectorAll('.view').forEach(s => s.hidden = s.id !== 'view-' + v);
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.view === v));
  if (v === 'mistakes') renderMistakes();
}
window.addEventListener('hashchange', route);

// ---------- events ----------
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  if (d.lang) { setLang(d.lang); return; }
  if (d.aip) { S.ai.provider = d.aip; store.set('aiProvider', d.aip); renderAIPanel(); return; }
  if (d.act === 'chatCopy') { copyText(S.chatPrompt).then(ok => { el('chatCopied').textContent = t(ok ? 'copied' : 'copyFail'); if (!ok) { const dt = document.querySelector('.chatflow details'); if (dt) dt.open = true; el('chatPromptBox')?.select(); } }); return; }
  if (d.act === 'chatImport') {
    try { importAIResult(parseLoose(el('chatIn').value)); window.scrollTo(0, 0); }
    catch { el('chatErr').textContent = t('chatBad'); }
    return;
  }
  if (d.preset) {
    if (d.preset === 'all') S.topics = new Set(TOPICS.map(x => x.id));
    else if (d.preset === 'none') S.topics = new Set();
    else if (d.preset === 'weak') S.topics = new Set(WEAK);
    else if (d.preset === 'mock') {
      S.topics = new Set(TOPICS.map(x => x.id)); S.count = 15; S.caseOn = true; S.cases = 3; S.mode = 'exam'; S.diff = 'mixed';
      S.kinds = new Set(Object.keys(PTS)); renderSetup(); generate(); if (window.innerWidth <= 900) $('.paper').scrollIntoView({behavior: 'smooth'});
      return;
    }
    else S.topics = new Set(TOPICS.filter(x => x.unit === d.preset).map(x => x.id));
    renderSetup(); saveSettings();
  }
  else if (d.count != null) { S.count = +d.count; renderSetup(); saveSettings(); }
  else if (d.caseon) { S.caseOn = d.caseon === 'on'; renderSetup(); saveSettings(); }
  else if (d.cases != null) { S.cases = +d.cases; renderSetup(); saveSettings(); }
  else if (d.kind) { S.kinds.has(d.kind) ? S.kinds.delete(d.kind) : S.kinds.add(d.kind); renderSetup(); saveSettings(); }
  else if (d.diff) { S.diff = d.diff; renderSetup(); saveSettings(); }
  else if (d.mode) { S.mode = d.mode; renderSetup(); saveSettings(); }
  else if (d.src) { S.src = d.src; renderSetup(); }
  else if (d.check != null) { showResult(d.check); }
  else if (d.self != null) {
    const q = getQ(d.self); q.self = +d.v; paintVerdict(d.self);
    el('ex' + d.self).innerHTML = explainHTML(q, d.self); afterScore(d.self);
  }
  else if (d.aiGrade != null) { aiGrade(d.aiGrade); }
  else if (d.override != null) {
    const q = getQ(d.override); q.res.score = 1; paintVerdict(d.override);
    el('ex' + d.override).innerHTML = explainHTML(q, d.override); afterScore(d.override);
  }
  else if (d.drill) { S.topics = new Set([d.drill]); renderSetup(); location.hash = '#exam'; generate(); window.scrollTo(0, 0); }
  else if (d.act === 'again') { generate(); window.scrollTo(0, 0); }
  else if (d.act === 'retry') {
    S.exam = S.exam.filter(q => (q.k === 'case' ? q.parts : [q]).some(p => { const s = unitScore(p); return s != null && s < 1; })).map(q => prep(q._src));
    S.title = {key: 'tRetry'}; S.endedAt = null; renderExam(); setStatus(''); window.scrollTo(0, 0);
  }
  else if (d.act === 'kb') { const x = units().map(u => u.q.t || u.parent.t)[0]?.[0]; location.hash = '#concepts'; setTimeout(() => el('kb-' + x)?.scrollIntoView(), 50); }
});
$('#topicList').addEventListener('change', e => {
  const id = e.target.dataset.topic; if (!id) return;
  e.target.checked ? S.topics.add(id) : S.topics.delete(id); renderSetup(); saveSettings();
});
$('#genBtn').addEventListener('click', () => { generate(); if (window.innerWidth <= 900) $('.paper').scrollIntoView({behavior: 'smooth'}); });
$('#submitBtn').addEventListener('click', submitAll);
$('#questions').addEventListener('input', updateAnswered);
$('#questions').addEventListener('change', updateAnswered);
$('#kbSearch').addEventListener('input', renderKB);
$('#mkPractice').addEventListener('click', () => {
  const list = store.get('mistakes', []); if (!list.length) return;
  S.exam = R.shuffle(list).slice(0, 20).map(m => { const {ts, ...src} = m; return prep(src); });
  S.title = {key: 'tMistakes'}; S.endedAt = null;
  location.hash = '#exam'; renderExam(); setStatus(t('mkStatus'));
});
let clearArmed = false;
$('#mkClear').addEventListener('click', e => {
  if (!clearArmed) { clearArmed = true; e.target.textContent = t('mkConfirm'); setTimeout(() => { clearArmed = false; e.target.textContent = t('mkClear'); }, 3000); return; }
  store.set('mistakes', []); clearArmed = false; e.target.textContent = t('mkClear'); renderMistakes();
});

// ---------- start ----------
applyStatic(); renderSetup(); renderKB(); renderMistakes(); route();
setTitle(); S.exam = buildExam(); renderExam();
if (window.claude?.use) {
  window.claude.use('sample').then(s => { if (s) { S.sample = s; renderSetup(); } }).catch(() => {});
}
