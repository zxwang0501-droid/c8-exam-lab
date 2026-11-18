// ---------- setup rail ----------
function renderSetup() {
  const counts = {};
  TOPICS.forEach(t => counts[t.id] = BANK.filter(q => q.t.includes(t.id)).length + GENS.filter(g => g.t.includes(t.id)).length);
  $('#topicList').innerHTML = Object.entries(UNITS).map(([u, name]) => `<div class="unit"><h4>${name.zh} · ${name.en}</h4>` +
    TOPICS.filter(t => t.unit === u).map(t => `<label class="topic${S.topics.has(t.id) ? ' on' : ''}" for="tp-${t.id}"><input type="checkbox" id="tp-${t.id}" data-topic="${t.id}"${S.topics.has(t.id) ? ' checked' : ''}><span>${esc(t.en)}<span class="tz">${esc(t.zh)}${WEAK.includes(t.id) ? ' · 弱项' : ''}</span></span><span class="n" title="题库题 + 随机模板">${counts[t.id]}</span></label>`).join('') + `</div>`).join('');
  $('#selCount').textContent = `已选 ${S.topics.size}`;
  const seg = (el, items, cur, attr) => { $(el).innerHTML = items.map(([v, label, dis]) => `<button data-${attr}="${v}" class="${(cur instanceof Set ? cur.has(v) : cur == v) ? 'on' : ''}"${dis ? ' disabled' : ''}>${label}</button>`).join(''); };
  seg('#countSeg', [[5, '5'], [10, '10'], [15, '15'], [20, '20'], [30, '30']], S.count, 'count');
  seg('#typeSeg', Object.entries(KIND).map(([k, v]) => [k, `${v.zh} ${v.en}`]), S.kinds, 'kind');
  seg('#diffSeg', [['mixed', '混合 Mixed'], ['exam', '考试难度 Exam'], ['hard', '只要难题 Hard']], S.diff, 'diff');
  seg('#modeSeg', [['practice', '练习 Practice'], ['exam', '考试 Exam']], S.mode, 'mode');
  seg('#srcSeg', [['bank', '题库 + 随机模板'], ['ai', 'Claude 出新题', !S.sample]], S.src, 'src');
  $('#srcHint').textContent = S.sample
    ? (S.src === 'ai' ? '由 Claude 按所选知识点现场出题（会用到你自己的 Claude 额度，第一次会请你授权）。' : '题库题都有标准答案和中文解析；随机模板每次生成新数字。')
    : '题库题都有标准答案和中文解析。在 Claude 里打开本页时，还可以让 Claude 现场出新题、批改简答题。';
  const {statics, gens} = poolFor(S.topics, S.kinds, S.diff);
  $('#poolInfo').textContent = S.topics.size ? `当前组合：${statics.length} 道题库题 + ${gens.length} 个随机数值模板` : '';
}

// ---------- concepts ----------
function renderKB() {
  const term = ($('#kbSearch').value || '').trim().toLowerCase();
  const hl = s => { const h = esc(s); if (!term) return h; const i = h.toLowerCase().indexOf(esc(term).toLowerCase()); return i < 0 ? h : h.slice(0, i) + '<mark>' + h.slice(i, i + esc(term).length) + '</mark>' + h.slice(i + esc(term).length); };
  let shown = 0;
  const html = TOPICS.map(t => {
    const items = (KB[t.id] || []).filter(e => !term || e.join(' ').toLowerCase().includes(term) || t.en.toLowerCase().includes(term) || t.zh.includes(term));
    if (!items.length) return '';
    shown += items.length;
    return `<section class="kb-topic" id="kb-${t.id}"><header><h2>${esc(t.en)}</h2><span class="zh">${esc(t.zh)}</span><span class="lec">${UNITS[t.unit].en} · ${t.lec}</span><button class="ghost" data-drill="${t.id}">练这个知识点 Practice</button></header>
      <div class="kb-list">${items.map(([name, en, zh, trap]) => `<div class="kb-item"><h3>${hl(name)}</h3><div class="en">${hl(en)}</div><div class="zh">${hl(zh)}</div>${trap ? `<div class="trap">${hl(trap)}</div>` : ''}</div>`).join('')}</div></section>`;
  }).join('');
  $('#kbBody').innerHTML = html || '<div class="empty">没有找到匹配的概念。No matching concepts.</div>';
  $('#kbCount').textContent = `${shown} 个概念 · ${TOPICS.length} 个知识点 · 题库 ${BANK.length} 题 + ${GENS.length} 个随机模板`;
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
  if (d.preset) {
    if (d.preset === 'all') S.topics = new Set(TOPICS.map(t => t.id));
    else if (d.preset === 'none') S.topics = new Set();
    else if (d.preset === 'weak') S.topics = new Set(WEAK);
    else S.topics = new Set(TOPICS.filter(t => t.unit === d.preset).map(t => t.id));
    renderSetup(); saveSettings();
  }
  else if (d.count) { S.count = +d.count; renderSetup(); saveSettings(); }
  else if (d.kind) { S.kinds.has(d.kind) ? S.kinds.delete(d.kind) : S.kinds.add(d.kind); renderSetup(); saveSettings(); }
  else if (d.diff) { S.diff = d.diff; renderSetup(); saveSettings(); }
  else if (d.mode) { S.mode = d.mode; renderSetup(); saveSettings(); }
  else if (d.src) { S.src = d.src; renderSetup(); }
  else if (d.check != null) { showResult(+d.check); }
  else if (d.self != null) {
    const i = +d.self, q = S.exam[i]; q.self = +d.v; paintVerdict(i);
    $('#ex' + i).innerHTML = explainHTML(q, i);
    if (q.self < 1) addMistake(q); else dropMistake(q.id);
    if (S.submitted) renderResults();
  }
  else if (d.aiGrade != null) { aiGrade(+d.aiGrade); }
  else if (d.override != null) {
    const i = +d.override, q = S.exam[i]; q.res.score = 1; dropMistake(q.id); paintVerdict(i);
    $('#ex' + i).innerHTML = explainHTML(q, i); if (S.submitted) renderResults();
  }
  else if (d.drill) { S.topics = new Set([d.drill]); renderSetup(); location.hash = '#exam'; generate(); window.scrollTo(0, 0); }
  else if (d.act === 'again') { generate(); window.scrollTo(0, 0); }
  else if (d.act === 'retry') {
    S.exam = S.exam.filter(q => { const s = q.k === 'short' ? q.self : q.res?.score; return s != null && s < 1; }).map(q => shuffleChoices(strip(q)));
    renderExam('Retry · 错题重练'); setStatus(''); window.scrollTo(0, 0);
  }
  else if (d.act === 'kb') { const t = S.exam.flatMap(q => q.t)[0]; location.hash = '#concepts'; setTimeout(() => $('#kb-' + t)?.scrollIntoView(), 50); }
});
function dropMistake(id) { store.set('mistakes', store.get('mistakes', []).filter(m => m.id !== id)); }
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
  S.exam = R.shuffle(list).slice(0, 20).map(q => { const {ts, ...rest} = q; return shuffleChoices(rest); });
  location.hash = '#exam'; renderExam('Mistakes Review · 错题本'); setStatus('答对的题会自动移出错题本。');
});
let clearArmed = false;
$('#mkClear').addEventListener('click', e => {
  if (!clearArmed) { clearArmed = true; e.target.textContent = '再点一次确认清空'; setTimeout(() => { clearArmed = false; e.target.textContent = '清空 Clear'; }, 3000); return; }
  store.set('mistakes', []); clearArmed = false; e.target.textContent = '清空 Clear'; renderMistakes();
});
// Correct answers on retried mistakes leave the mistake book.
const _showResult = showResult;
showResult = function (i) { _showResult(i); const q = S.exam[i]; if (q.k !== 'short' && q.res.score >= 1) dropMistake(q.id); };

// ---------- start ----------
renderSetup(); renderKB(); renderMistakes(); route();
S.exam = buildExam(); renderExam(S.topics.size ? `Practice Exam · ${S.topics.size} topics` : 'Practice Exam');
if (window.claude?.use) {
  window.claude.use('sample').then(s => { if (s) { S.sample = s; renderSetup(); } }).catch(() => {});
}
