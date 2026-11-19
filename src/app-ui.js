// ---------- grading ----------
const norm = s => String(s).trim().replace(/\s+/g, '').replace(/"/g, "'").replace(/;+$/, '');
const loosen = s => norm(s).toLowerCase().replace(/array\(|\)|\[|\]/g, '');
function blankOk(input, b, loose) {
  const v = loose ? loosen(input) : norm(input);
  if (!v) return false;
  return b.acc.some(a => {
    const x = loose ? loosen(a) : norm(a);
    if (v === x) return true;
    if (loose && /^[-\d.e]+$/.test(v) && !isNaN(parseFloat(x)) && Math.abs(parseFloat(v) - parseFloat(x)) < 1e-9) return true;
    if (loose && /^\d+\/\d+$/.test(v)) { const [p, q] = v.split('/').map(Number); return Math.abs(p / q - parseFloat(x)) < 1e-9; }
    return false;
  });
}
const el = id => document.getElementById(id);
function grade(q, key) {
  if (q.k === 'mc' || q.k === 'tf') {
    const c = document.querySelector(`input[name="q${key}"]:checked`);
    const pick = c ? +c.value : -1; const right = q.k === 'tf' ? (q.a ? 0 : 1) : q.a;
    return {score: pick === right ? 1 : 0, pick: [pick], right: [right]};
  }
  if (q.k === 'multi') {
    const picks = [...document.querySelectorAll(`input[name="q${key}"]:checked`)].map(e => +e.value);
    const hits = picks.filter(p => q.a.includes(p)).length, wrong = picks.length - hits;
    const exact = hits === q.a.length && wrong === 0;
    return {score: exact ? 1 : Math.max(0, (hits - wrong) / q.a.length) * 0.5, pick: picks, right: q.a, exact};
  }
  if (q.k === 'code') {
    const oks = q.blanks.map((b, j) => blankOk(el(`q${key}b${j}`).value, b, q.loose));
    return {score: oks.filter(Boolean).length / oks.length, oks};
  }
  return {score: q.self == null ? null : q.self};
}

// Shows a graded unit. regrade=false re-displays an existing result (after a language switch).
function showResult(key, regrade = true) {
  key = String(key);
  const q = getQ(key); const card = el('qcard' + key);
  if (!q || !card) return;
  if (regrade || !q.res) q.res = grade(q, key);
  card.querySelectorAll(':scope > .opts input, :scope > .blanks input, :scope > textarea').forEach(e => { if (q.k === 'code') e.readOnly = true; else e.disabled = true; });
  card.querySelector(':scope > .q-actions [data-check]')?.remove();
  if (q.k === 'mc' || q.k === 'tf' || q.k === 'multi') {
    card.querySelectorAll(':scope > .opts .opt').forEach(o => {
      const j = +o.dataset.j;
      if (q.res.right.includes(j)) o.classList.add('is-right');
      else if (q.res.pick.includes(j)) o.classList.add('is-wrong');
    });
  }
  if (q.k === 'code') q.res.oks.forEach((ok, j) => el(`q${key}b${j}`).classList.add(ok ? 'ok' : 'no'));
  paintVerdict(key);
  el('ex' + key).innerHTML = explainHTML(q, key);
  if (regrade) afterScore(key); else if (key.includes('-')) paintCase(+key.split('-')[0]);
}
function afterScore(key) {
  const [i, j] = String(key).split('-');
  const top = S.exam[+i];
  if (j != null) paintCase(+i);
  const scores = top.k === 'case' ? top.parts.map(unitScore) : [unitScore(top)];
  if (scores.some(s => s != null && s < 1)) addMistake(top);
  else if (scores.every(s => s != null && s >= 1)) dropMistake(top.id);
  if (S.submitted) renderResults();
}
function paintCase(i) {
  const q = S.exam[i]; const done = q.parts.filter(p => unitScore(p) != null);
  if (!done.length) return;
  const got = done.reduce((s, p) => s + unitScore(p) * ptsOf(p), 0);
  el('cs' + i).textContent = `${fmt(got, 1)} / ${ptsOf(q)} pts${done.length < q.parts.length ? t('partly') : ''}`;
}
function paintVerdict(key) {
  const q = getQ(key), v = el('v' + key), s = unitScore(q);
  if (s == null) { v.className = 'verdict'; v.textContent = q.k === 'short' ? t('selfPrompt') : ''; return; }
  v.className = 'verdict ' + (s >= 1 ? 'good' : s > 0 ? 'part' : 'bad');
  const p = ptsOf(q);
  v.textContent = t(s >= 1 ? 'vRight' : s > 0 ? 'vPart' : 'vWrong') + ` · ${fmt(s * p, 1)}/${p} pts`;
}
function explainHTML(q, key) {
  let ans = '';
  if (q.k === 'mc') ans = `${t('ansIs')}${LETTERS[q.a]}. ${rich(q.c[q.a])}`;
  else if (q.k === 'multi') ans = `${t('ansIs')}${q.a.map(j => LETTERS[j]).join(', ')}`;
  else if (q.k === 'tf') ans = `${t('ansIs')}${t(q.a ? 'T' : 'F')}`;
  else if (q.k === 'code') ans = t('ansRef') + q.blanks.map(b => `${b.l === 'output' ? '' : '[' + esc(b.l) + '] '}<code>${esc(b.acc[0])}</code>`).join('　');
  const keys = q.p && q.p.length ? `<div><b>${t('keyPts')}</b><ul>${q.p.map(p => `<li>${rich(p)}</li>`).join('')}</ul></div>` : '';
  const model = q.k === 'short' ? `<div><b>${t('model')}</b><br>${rich(q.a)}</div>` : '';
  const self = q.k === 'short' ? `<div class="selfgrade">${t('selfGrade')}
      <button class="ghost${q.self === 1 ? ' on' : ''}" data-self="${key}" data-v="1">${t('sgRight')}</button>
      <button class="ghost${q.self === 0.5 ? ' on' : ''}" data-self="${key}" data-v="0.5">${t('sgPart')}</button>
      <button class="ghost${q.self === 0 ? ' on' : ''}" data-self="${key}" data-v="0">${t('sgWrong')}</button>
      ${aiReady() ? `<button class="ghost" data-ai-grade="${key}">${t(S.ai.provider === 'chat' ? 'gradeChat' : 'aiGradeBtn')}</button>` : ''}</div>` : '';
  const override = q.k === 'code' && q.res && q.res.score < 1 ? `<div class="selfgrade">${t('eqQ')}<button class="ghost" data-override="${key}">${t('markRight')}</button></div>` : '';
  const ai = q.ai ? `<div class="ai-fb"><b>${t('aiFb')}</b>${q.ai}</div>` : '';
  return `<div class="explain"><div class="ans">${ans}</div>${model}${keys}<div>${rich(q.e || '')}</div>${self}${override}${ai}</div>`;
}

function submitAll() {
  units().forEach(({q, key}) => { if (!q.res) showResult(key); });
  S.submitted = true; S.endedAt = Date.now(); clearInterval(S.timer);
  renderResults();
  $('#results').scrollIntoView({behavior: 'smooth', block: 'start'});
}
function renderResults() {
  const us = units();
  const graded = us.filter(u => unitScore(u.q) != null);
  const pending = us.filter(u => u.q.k === 'short' && u.q.self == null).length;
  const got = graded.reduce((s, u) => s + unitScore(u.q) * ptsOf(u.q), 0);
  const possible = graded.reduce((s, u) => s + ptsOf(u.q), 0);
  const per = {};
  graded.forEach(u => (u.q.t || u.parent.t).forEach(x => { if (!TOPIC[x]) return; per[x] = per[x] || [0, 0]; per[x][0] += unitScore(u.q) * ptsOf(u.q); per[x][1] += ptsOf(u.q); }));
  const secs = Math.floor(((S.endedAt || Date.now()) - S.startedAt) / 1000);
  const wrong = S.exam.filter(q => (q.k === 'case' ? q.parts : [q]).some(p => { const s = unitScore(p); return s != null && s < 1; })).length;
  $('#results').hidden = false;
  $('#results').innerHTML = `
    <div class="score"><b>${fmt(got, 1)} / ${possible}</b><span>${t('resLine', {pct: possible ? Math.round(got / possible * 100) : 0, m: Math.floor(secs / 60), s: secs % 60})}${pending ? t('resPending', {n: pending}) : ''}</span></div>
    <div class="bars">${Object.entries(per).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]).map(([x, [s, n]]) => `
      <div class="bar"><span>${esc(LANG === 'zh' ? TOPIC[x].zh + ' ' : '')}<span class="${LANG === 'zh' ? 'hint' : ''}">${esc(topicName(x))}</span></span><span class="track"><span class="fill" style="width:${Math.round(s / n * 100)}%"></span></span><span class="v">${fmt(s, 1)}/${n}</span></div>`).join('')}</div>
    <p class="hint">${t('resHint')}</p>
    <div class="q-actions"><button class="primary" data-act="again">${t('again')}</button>${wrong ? `<button class="ghost" data-act="retry">${t('retry', {n: wrong})}</button>` : ''}<button class="ghost" data-act="kb">${t('review')}</button></div>`;
}

// ---------- mistakes (stored as the original source, so they show in any language) ----------
function addMistake(q) {
  const src = q._src || q;
  const list = store.get('mistakes', []).filter(m => m.id !== src.id);
  list.unshift({...src, ts: Date.now()});
  store.set('mistakes', list.slice(0, 150));
  renderMistakes();
}
function dropMistake(id) { store.set('mistakes', store.get('mistakes', []).filter(m => m.id !== id)); renderMistakes(); }
function renderMistakes() {
  const list = store.get('mistakes', []);
  $('#mkHint').textContent = list.length ? t('mkHint', {n: list.length}) : t('mkEmpty');
  $('#mkPractice').disabled = !list.length;
  $('#mkList').innerHTML = list.map(m => {
    let q; try { q = baseOf(m); } catch { q = m; }
    return `<div class="mk"><div class="meta"><span class="tag kind">${esc(kindShort(q.k))}</span> ${(q.t || []).filter(x => TOPIC[x]).map(x => esc(LANG === 'zh' ? TOPIC[x].zh : topicName(x))).join(' · ')} · ${new Date(m.ts).toLocaleDateString()}</div><div class="stem">${q.k === 'case' ? '<b>' + esc(q.title) + '</b> — ' + rich(q.bg) : rich(q.q)}</div></div>`;
  }).join('');
}

// ---------- Claude: generate & grade ----------
const AI_LANG = {
  zh: {expl: 'explanation in simplified Chinese, plain and friendly, keeping English course terms (null hypothesis, p-value, bootstrap, confidence interval...)', stem: 'stem in English', keys: '得分要点 in Chinese', fb: 'simplified Chinese (keep English course terms)'},
  en: {expl: 'explanation in plain, friendly English', stem: 'stem in English', keys: 'grading key points in English', fb: 'English'},
  es: {expl: 'explanation in plain, friendly Spanish (keep code and datascience method names in English)', stem: 'stem in Spanish (keep code, column names, and datascience method names in English)', keys: 'grading key points in Spanish', fb: 'Spanish'},
};
function aiPrompt() {
  const L = AI_LANG[LANG];
  const topics = [...S.topics].map(id => TOPIC[id]);
  const kb = topics.map(x => `## ${x.id} — ${x.en}\n` + (KB[x.id] || []).map(([term, en]) => `- ${term}: ${en}`).join('\n')).join('\n\n');
  const kinds = [...S.kinds];
  const plain = q => { const {_src, _order, res, self, ai, ...r} = q; return r; };
  const ex = R.shuffle(BANK.filter(q => q.t.some(x => S.topics.has(x)))).slice(0, 3).map(q => JSON.stringify(plain(loc(q))));
  const pool = CASES.filter(c => c.t.some(x => S.topics.has(x)));
  const exCase = JSON.stringify(plain(loc((pool.length ? pool : CASES)[Math.floor(Math.random() * (pool.length || CASES.length))])));
  const diff = {mixed: 'a mix of warm-up (d=1) and exam-level (d=2) questions, plus a few hard ones (d=3)', exam: 'exam-level (d=2) and hard (d=3)', hard: 'hard (d=3): multi-step reasoning, subtle misconceptions'}[S.diff];
  const n = nCases();
  const caseSpec = n ? `

ALSO write exactly ${n} CASE STUDIES ("big questions", about 20 points each), like the long multi-part questions on 2021–2026 Data 8 finals: a realistic background story (3–5 sentences, original scenario), then data tables that look like REAL exam tables: each table has a name and 5–7 columns of mixed types (str, int, float, bool), including columns that the main question does not need, 5–6 realistic rows shown plus a "rows omitted" count, and often a SECOND related table that must be joined; describe every column as "table.column (type): meaning". Then 6–9 parts labeled a, b, c... that build on the same scenario and COMBINE several of the chosen topics (e.g. a hypothesis test from null/alternative through test statistic, simulation code, p-value code, and conclusion; or regression from slope through residuals to inference and causation). At least two parts must require multi-step datascience Table code on those tables (for example where + group, join + select + group, pivot with a collect function, with_column with apply or column arithmetic) EVEN WHEN the main topic is inference, testing, or regression, the way real exams mix Table manipulation into every big question. Parts may be any of mc, multi, tf, short, code, each with "pts" (1–5) so the parts add up to 20–26. Example case (format only):
${exCase}` : '';
  return `You write ORIGINAL practice questions for UC Berkeley Data C8 (Data 8, Foundations of Data Science), matching the style and difficulty of the course's 2021–2026 midterms and finals. Do not reproduce real exam questions; invent new scenarios (campus life, sports, health, transit, food, etc.).

Style of real Data 8 exams: short realistic scenarios; conceptual multiple-choice with plausible distractors built from common misconceptions (p-value as P(null true), "accept the null", CI as a probability about a fixed parameter, association vs causation, bootstrap with/without replacement, Chebyshev vs normal, regression to the mean); "select all that apply" questions (e.g. "select all correct statements of the null hypothesis"); blocks of True/False statements about properties; choosing appropriate test statistics; fill-in-the-blank code using ONLY the datascience Table API and numpy as taught (Table methods: select, drop, where with are.*, sort, take, column, num_rows, with_column(s), relabeled, group, pivot, join, apply, sample, hist, scatter, plot, barh; functions: make_array, np.arange, np.append, np.random.choice, sample_proportions, percentile, np.mean, np.std, np.count_nonzero, minimize). Never use pandas, list comprehensions, or brackets for indexing.

Topics to cover (use these ids in "t"; spread questions across them, and when several topics are chosen, write some questions that combine two topics):
${kb}

Write exactly ${S.count} single questions. Allowed kinds: ${kinds.join(', ') || 'none'}. Difficulty: ${diff}. Emphasize definitions, interpretation, and conceptual reasoning; at most a quarter of single questions should be "code".${caseSpec}

LANGUAGE: write each "q" (and case "bg", "title", "cols", choices) as a ${L.stem}; write "e" as an ${L.expl}; write "p" as ${L.keys}.

Return ONLY a JSON object: {"questions": [...], "cases": [...]}. Each question (and each case part) is:
{"k": "mc"|"multi"|"tf"|"short"|"code", "t": ["topic id"], "d": 1|2|3, "pts": number (case parts only),
 "q": "stem (use backticks for inline code)",
 "code": "optional Python shown under the stem; for code questions put blanks as [A], [B]",
 "c": ["choice", ...]            // mc and multi only, 4-5 choices
 "a": 0                          // mc: index of the correct choice; multi: array of correct indices; tf: true/false; short: model answer string
 "blanks": [{"l": "A", "acc": ["accepted answer", "equivalent alternative"]}]   // code only
 "p": ["key point"]              // short only, 2-4 grading key points
 "e": "explanation; for multiple choice say why the wrong options are wrong"}
Each case is: {"title": "short title", "t": ["topic ids"], "bg": "background", ${LANG === 'zh' ? '"bgzh": "one-sentence Chinese summary of the background", ' : ''}"tables": [{"name": "table name", "cols": [...], "rows": [[...]], "more": number of omitted rows}], "cols": ["table.column (type): description", ...], "code": "optional shared code", "parts": [ {"l": "a", ...question fields...}, ... ]}

Examples of single questions (format only):
${ex.join('\n')}`;
}
function validAI(x, inCase) {
  if (!x || typeof x !== 'object' || !PTS[x.k] || typeof x.q !== 'string') return null;
  const tp = (Array.isArray(x.t) ? x.t : [x.t]).filter(id => TOPIC[id]);
  const q = {id: 'ai-' + Math.random().toString(36).slice(2, 8), k: x.k, t: tp.length ? tp : [[...S.topics][0]], d: [1, 2, 3].includes(+x.d) ? +x.d : 2, q: x.q, e: String(x.e || ''), fromAI: true};
  if (inCase) { q.l = String(x.l || '').slice(0, 2); q.pts = Math.max(1, Math.min(10, +x.pts || PTS[x.k])); }
  if (x.code) q.code = String(x.code);
  if (x.k === 'mc') { if (!Array.isArray(x.c) || x.c.length < 2 || !Number.isInteger(x.a) || x.c[x.a] == null) return null; q.c = x.c.map(String); q.a = x.a; }
  if (x.k === 'multi') { if (!Array.isArray(x.c) || !Array.isArray(x.a) || !x.a.length || x.a.some(j => !Number.isInteger(j) || x.c[j] == null)) return null; q.c = x.c.map(String); q.a = [...new Set(x.a)].sort(); }
  if (x.k === 'tf') { if (typeof x.a !== 'boolean') return null; q.a = x.a; }
  if (x.k === 'short') { if (typeof x.a !== 'string') return null; q.a = x.a; q.p = Array.isArray(x.p) ? x.p.map(String) : []; }
  if (x.k === 'code') { if (!Array.isArray(x.blanks) || !x.blanks.length || x.blanks.some(b => !b || !Array.isArray(b.acc) || !b.acc.length)) return null; q.blanks = x.blanks.map(b => ({l: String(b.l || '?'), acc: b.acc.map(String)})); }
  return q;
}
function validCase(x) {
  if (!x || typeof x !== 'object' || typeof x.bg !== 'string' || !Array.isArray(x.parts)) return null;
  const parts = x.parts.map(p => validAI(p, true)).filter(Boolean);
  if (parts.length < 2) return null;
  parts.forEach((p, j) => { if (!p.l) p.l = 'abcdefghij'[j]; });
  const tp = (Array.isArray(x.t) ? x.t : []).filter(id => TOPIC[id]);
  const c = {id: 'aic-' + Math.random().toString(36).slice(2, 8), k: 'case', d: 3, fromAI: true, title: String(x.title || 'Case Study'), t: tp.length ? tp : [...new Set(parts.flatMap(p => p.t))], bg: x.bg, parts};
  if (x.bgzh) c.bgzh = String(x.bgzh);
  if (x.code) c.code = String(x.code);
  if (Array.isArray(x.cols)) c.cols = x.cols.map(String);
  const tb = (Array.isArray(x.tables) ? x.tables : x.table ? [x.table] : []).filter(o => o && Array.isArray(o.cols) && Array.isArray(o.rows)).slice(0, 3);
  if (tb.length) c.tables = tb.map(o => ({name: o.name ? String(o.name) : '', cols: o.cols.map(String), rows: o.rows.filter(Array.isArray).slice(0, 8).map(r => r.map(String)), more: +o.more || 0}));
  return c;
}
function setStatus(html, err) { const s = $('#status'); s.hidden = !html; s.className = 'status' + (err ? ' err' : ''); s.innerHTML = html || ''; }
function setTitle() {
  if (S.topics.size === 1) S.title = {key: 'tPracticeOne', suffix: ' · ' + TOPIC[[...S.topics][0]].en};
  else if (S.topics.size >= TOPICS.length) S.title = {key: 'tFinal'};
  else S.title = {key: 'tPractice', vars: {n: S.topics.size}};
}

function importAIResult(res) {
  const singles = (Array.isArray(res) ? res : res?.questions || []).map(x => validAI(x)).filter(Boolean);
  const cases = (Array.isArray(res?.cases) ? res.cases : []).map(validCase).filter(Boolean);
  if (!singles.length && !cases.length) throw {code: 'invalid_json'};
  let note = t('aiNote', {a: singles.length, b: cases.length ? t('aiNoteCases', {n: cases.length}) : ''});
  const fill = buildExam();
  const exam = singles.map(prep);
  if (singles.length < S.count) { const top = fill.filter(q => q.k !== 'case').slice(0, S.count - singles.length); exam.push(...top); if (top.length) note += t('aiTopS', {n: top.length}); }
  exam.push(...cases.map(prep));
  if (cases.length < nCases()) { const top = fill.filter(q => q.k === 'case').slice(0, nCases() - cases.length); exam.push(...top); if (top.length) note += t('aiTopC', {n: top.length}); }
  setTitle(); S.endedAt = null; S.exam = exam; S.title.suffix = (S.title.suffix || '') + ' · AI';
  renderExam(); setStatus(note);
}

async function generate() {
  if (!S.topics.size) { go('exam'); setupErr(t('needTopic')); return; }
  if (!S.kinds.size && !nCases()) { go('exam'); setupErr(t('needType')); return; }
  saveSettings(); setTitle(); S.endedAt = null; setupErr('');
  if (S.src === 'ai') {
    const prompt = aiPrompt();
    if (S.ai.provider === 'chat') { go('paper'); showChatFlow(prompt); return; }
    if (!aiReady()) { go('exam'); $('#aiBox').open = true; setupErr(t(S.ai.provider === 'app' ? 'appWait' : 'needKey')); return; }
    go('paper');
    S.aiCtl?.abort(); const ctl = S.aiCtl = new AbortController();
    $('#genBtn').disabled = true;
    setStatus(`${t('aiWorking', {n: S.count, c: nCases() ? t('aiWorkingCases', {n: nCases()}) : ''})} <span class="hint" id="aiProg"></span> <button class="ghost" id="stopAI">${t('stop')}</button>`);
    $('#stopAI').onclick = () => ctl.abort();
    try {
      const res = await aiJSON(prompt, {kind: 'gen', signal: ctl.signal, onProgress: n => { const p = $('#aiProg'); if (p) p.textContent = t('aiProgress', {n: n.toLocaleString('en-US')}); }});
      importAIResult(res);
    } catch (e) {
      if (e?.code === 'cancelled') { setStatus(t('stopped')); }
      else {
        S.exam = buildExam(); renderExam();
        setStatus(t('aiFail', {w: aiErrMsg(e)}), true);
        if (e?.code === 'not_granted') { S.sample = null; renderSetup(); }
      }
    } finally { $('#genBtn').disabled = false; }
    return;
  }
  S.exam = buildExam();
  renderExam(); setStatus(''); go('paper');
  const singles = S.exam.filter(q => q.k !== 'case').length, cases = S.exam.length - singles;
  const lack = [singles < S.count ? t('shortS', {n: singles}) : '', cases < nCases() ? t('shortC', {n: cases}) : ''].filter(Boolean);
  if (lack.length) setStatus(t('short', {x: lack.join(LANG === 'zh' ? '，' : '; ')}));
}

function gradePrompt(q, key, ans) {
  const parent = String(key).includes('-') ? S.exam[+String(key).split('-')[0]] : null;
  return `You are a Data 8 (UC Berkeley) TA grading a short-answer exam question. Be fair but strict about the course's precise wording (e.g. "fail to reject" not "accept"; confidence is about the process; null must be a chance model).
${parent ? 'Background: ' + parent.bg + '\n' : ''}Question: ${q.q}${q.code ? '\nCode:\n' + q.code : ''}
Model answer: ${q.a}
Grading key points: ${(q.p || []).join(' | ')}
Student answer: ${ans}
Reply with ONLY a JSON object: {"score": 0 | 0.5 | 1, "feedback": "2-4 sentences in ${AI_LANG[LANG].fb} saying what was right, what was missing or wrong, and how to phrase it on the exam"}`;
}
async function aiGrade(key) {
  const q = getQ(key); const ans = (el(`q${key}t`).value || '').trim();
  const box = el('ex' + key);
  if (!ans) { q.ai = t('aiNoAns'); box.innerHTML = explainHTML(q, key); return; }
  if (S.ai.provider === 'chat') {
    const ok = await copyText(gradePrompt(q, key, ans));
    q.ai = t(ok ? 'gradeChatNote' : 'copyFail') + ' <a href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT ↗</a> · <a href="https://claude.ai/new" target="_blank" rel="noopener">Claude ↗</a>';
    box.innerHTML = explainHTML(q, key); return;
  }
  q.ai = t('aiGrading'); box.innerHTML = explainHTML(q, key);
  try {
    const r = await aiJSON(gradePrompt(q, key, ans), {kind: 'grade'});
    const s = [0, 0.5, 1].includes(+r?.score) ? +r.score : null;
    q.ai = esc(`${s == null ? '' : t('aiSuggest', {a: s * ptsOf(q), b: ptsOf(q)})}${r?.feedback || ''}`);
    if (s != null) { q.self = s; paintVerdict(key); afterScore(key); }
  } catch (e) {
    q.ai = esc(e?.code === 'not_granted' ? t('aiNoPerm') : t('aiGradeErr', {w: aiErrMsg(e)}));
  }
  box.innerHTML = explainHTML(q, key);
}
