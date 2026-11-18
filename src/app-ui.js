// ---------- grading ----------
const norm = s => String(s).trim().replace(/\s+/g, '').replace(/"/g, "'").replace(/;+$/, '');
const loosen = s => norm(s).toLowerCase().replace(/array\(|\)|\[|\]/g, '');
function blankOk(input, b, loose) {
  const v = loose ? loosen(input) : norm(input);
  if (!v) return false;
  return b.acc.some(a => {
    const t = loose ? loosen(a) : norm(a);
    if (v === t) return true;
    if (loose && /^[-\d.e]+$/.test(v) && !isNaN(parseFloat(t)) && Math.abs(parseFloat(v) - parseFloat(t)) < 1e-9) return true;
    if (loose && /^\d+\/\d+$/.test(v)) { const [x, y] = v.split('/').map(Number); return Math.abs(x / y - parseFloat(t)) < 1e-9; }
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

function showResult(key) {
  key = String(key);
  const q = getQ(key); const card = el('qcard' + key);
  if (!q || !card) return;
  q.res = grade(q, key);
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
  afterScore(key);
}
// Keeps the mistake book and the case total in sync whenever a unit's score changes.
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
  el('cs' + i).textContent = `${fmt(got, 1)} / ${ptsOf(q)} pts${done.length < q.parts.length ? '（部分已批改）' : ''}`;
}
function paintVerdict(key) {
  const q = getQ(key), v = el('v' + key), s = unitScore(q);
  if (s == null) { v.className = 'verdict'; v.textContent = q.k === 'short' ? '对照参考答案给自己打分 →' : ''; return; }
  v.className = 'verdict ' + (s >= 1 ? 'good' : s > 0 ? 'part' : 'bad');
  const p = ptsOf(q);
  v.textContent = (s >= 1 ? '✓ 正确 Correct' : s > 0 ? '◐ 部分正确 Partial' : '✗ 错误 Incorrect') + ` · ${fmt(s * p, 1)}/${p} pts`;
}
function explainHTML(q, key) {
  let ans = '';
  if (q.k === 'mc') ans = `正确答案：${LETTERS[q.a]}. ${rich(q.c[q.a])}`;
  else if (q.k === 'multi') ans = `正确答案：${q.a.map(j => LETTERS[j]).join(', ')}`;
  else if (q.k === 'tf') ans = `正确答案：${q.a ? 'True' : 'False'}`;
  else if (q.k === 'code') ans = '参考答案：' + q.blanks.map(b => `${b.l === 'output' ? '' : '[' + esc(b.l) + '] '}<code>${esc(b.acc[0])}</code>`).join('　');
  const keys = q.p && q.p.length ? `<div><b>得分要点</b><ul>${q.p.map(p => `<li>${rich(p)}</li>`).join('')}</ul></div>` : '';
  const model = q.k === 'short' ? `<div><b>参考答案 Model answer</b><br>${rich(q.a)}</div>` : '';
  const self = q.k === 'short' ? `<div class="selfgrade">自评 Self-grade:
      <button class="ghost${q.self === 1 ? ' on' : ''}" data-self="${key}" data-v="1">答对了</button>
      <button class="ghost${q.self === 0.5 ? ' on' : ''}" data-self="${key}" data-v="0.5">部分</button>
      <button class="ghost${q.self === 0 ? ' on' : ''}" data-self="${key}" data-v="0">没答对</button>
      ${S.sample ? `<button class="ghost" data-ai-grade="${key}">让 Claude 批改</button>` : ''}</div>` : '';
  const override = q.k === 'code' && q.res && q.res.score < 1 ? `<div class="selfgrade">写法不同但等价？<button class="ghost" data-override="${key}">算我对 Mark correct</button></div>` : '';
  const ai = q.ai ? `<div class="ai-fb"><b>Claude 批改：</b>${rich(q.ai)}</div>` : '';
  return `<div class="explain"><div class="ans">${ans}</div>${model}${keys}<div>${rich(q.e || '')}</div>${self}${override}${ai}</div>`;
}

function submitAll() {
  units().forEach(({q, key}) => { if (!q.res) showResult(key); });
  S.submitted = true; clearInterval(S.timer);
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
  graded.forEach(u => (u.q.t || u.parent.t).forEach(t => { if (!TOPIC[t]) return; per[t] = per[t] || [0, 0]; per[t][0] += unitScore(u.q) * ptsOf(u.q); per[t][1] += ptsOf(u.q); }));
  const secs = Math.floor((Date.now() - S.startedAt) / 1000);
  const wrong = S.exam.filter((q, i) => (q.k === 'case' ? q.parts : [q]).some(p => { const s = unitScore(p); return s != null && s < 1; })).length;
  $('#results').hidden = false;
  $('#results').innerHTML = `
    <div class="score"><b>${fmt(got, 1)} / ${possible}</b><span>分 points · ${possible ? Math.round(got / possible * 100) : 0}% · 用时 ${Math.floor(secs / 60)} 分 ${secs % 60} 秒${pending ? ` · ${pending} 道简答待自评（未计入）` : ''}</span></div>
    <div class="bars">${Object.entries(per).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]).map(([t, [s, n]]) => `
      <div class="bar"><span>${esc(TOPIC[t].zh)} <span class="hint">${esc(TOPIC[t].en)}</span></span><span class="track"><span class="fill" style="width:${Math.round(s / n * 100)}%"></span></span><span class="v">${fmt(s, 1)}/${n}</span></div>`).join('')}</div>
    <p class="hint">按得分率从低到高排列，最上面就是最该复习的知识点。有错的题（大题整题）已自动加入错题本。</p>
    <div class="q-actions"><button class="primary" data-act="again">再来一套 New set</button>${wrong ? `<button class="ghost" data-act="retry">只练这次的错题 (${wrong})</button>` : ''}<button class="ghost" data-act="kb">复习相关知识点</button></div>`;
}

// ---------- mistakes ----------
function strip(q) {
  const {res, self, ai, ...rest} = q;
  if (rest.parts) rest.parts = rest.parts.map(p => strip(p));
  return rest;
}
function addMistake(q) {
  const list = store.get('mistakes', []).filter(m => m.id !== q.id);
  list.unshift({...strip(q), ts: Date.now()});
  store.set('mistakes', list.slice(0, 150));
  renderMistakes();
}
function dropMistake(id) { store.set('mistakes', store.get('mistakes', []).filter(m => m.id !== id)); renderMistakes(); }
function renderMistakes() {
  const list = store.get('mistakes', []);
  $('#mkHint').textContent = list.length ? `共 ${list.length} 道。重练时全部答对的题会自动从错题本移除。` : '还没有错题。做完一套题后，答错的题会出现在这里。';
  $('#mkPractice').disabled = !list.length;
  $('#mkList').innerHTML = list.map(q => `<div class="mk"><div class="meta"><span class="tag kind">${KIND[q.k].zh}</span> ${q.t.filter(t => TOPIC[t]).map(t => esc(TOPIC[t].zh)).join(' · ')} · ${new Date(q.ts).toLocaleDateString()}</div><div class="stem">${q.k === 'case' ? '<b>' + esc(q.title) + '</b> — ' + rich(q.bg) : rich(q.q)}</div></div>`).join('');
}

// ---------- Claude: generate & grade ----------
function aiPrompt() {
  const topics = [...S.topics].map(id => TOPIC[id]);
  const kb = topics.map(t => `## ${t.id} — ${t.en} (${t.zh})\n` + (KB[t.id] || []).map(([term, en, , trap]) => `- ${term}: ${en}${trap ? ' [common mistake: ' + trap + ']' : ''}`).join('\n')).join('\n\n');
  const kinds = [...S.kinds];
  const ex = R.shuffle(BANK.filter(q => q.t.some(t => S.topics.has(t)))).slice(0, 3).map(q => JSON.stringify(strip(q)));
  const exCase = JSON.stringify(strip(R.pick(CASES.filter(c => c.t.some(t => S.topics.has(t))).concat(CASES).slice(0, 4))));
  const diff = {mixed: 'a mix of warm-up (d=1) and exam-level (d=2) questions, plus a few hard ones (d=3)', exam: 'exam-level (d=2) and hard (d=3)', hard: 'hard (d=3): multi-step reasoning, subtle misconceptions'}[S.diff];
  const caseSpec = S.cases ? `

ALSO write exactly ${S.cases} CASE STUDIES ("big questions", about 20 points each), like the long multi-part questions on 2021–2026 Data 8 finals: a realistic background story (3–5 sentences, original scenario), usually a small table excerpt (4–5 rows plus "rows omitted"), a description of each column, then 5–8 parts labeled a, b, c... that build on the same scenario and COMBINE several of the chosen topics (e.g. a hypothesis test from null/alternative through test statistic, simulation code, p-value code, and conclusion; or regression from slope through residuals to inference and causation). Parts may be any of mc, multi, tf, short, code, each with "pts" (1–5) so the parts add up to about 20. Example case (format only):
${exCase}` : '';
  return `You write ORIGINAL practice questions for UC Berkeley Data C8 (Data 8, Foundations of Data Science), matching the style and difficulty of the course's 2021–2026 midterms and finals. Do not reproduce real exam questions; invent new scenarios (campus life, sports, health, transit, food, etc.).

Style of real Data 8 exams: short realistic scenarios; conceptual multiple-choice with plausible distractors built from common misconceptions (p-value as P(null true), "accept the null", CI as a probability about a fixed parameter, association vs causation, bootstrap with/without replacement, Chebyshev vs normal, regression to the mean); "select all that apply" questions (e.g. "select all correct statements of the null hypothesis"); blocks of True/False statements about properties; choosing appropriate test statistics; fill-in-the-blank code using ONLY the datascience Table API and numpy as taught (Table methods: select, drop, where with are.*, sort, take, column, num_rows, with_column(s), relabeled, group, pivot, join, apply, sample, hist, scatter, plot, barh; functions: make_array, np.arange, np.append, np.random.choice, sample_proportions, percentile, np.mean, np.std, np.count_nonzero, minimize). Never use pandas, list comprehensions, or brackets for indexing.

Topics to cover (use these ids in "t"; spread questions across them, and when several topics are chosen, write some questions that combine two topics):
${kb}

Write exactly ${S.count} single questions. Allowed kinds: ${kinds.join(', ')}. Difficulty: ${diff}. Emphasize definitions, interpretation, and conceptual reasoning; at most a quarter of single questions should be "code".${caseSpec}

Return ONLY a JSON object: {"questions": [...], "cases": [...]}. Each question (and each case part) is:
{"k": "mc"|"multi"|"tf"|"short"|"code", "t": ["topic id"], "d": 1|2|3, "pts": number (case parts only),
 "q": "stem in English (use backticks for inline code)",
 "code": "optional Python shown under the stem; for code questions put blanks as [A], [B]",
 "c": ["choice", ...]            // mc and multi only, 4-5 choices
 "a": 0                          // mc: index of the correct choice; multi: array of correct indices; tf: true/false; short: model answer string in English
 "blanks": [{"l": "A", "acc": ["accepted answer", "equivalent alternative"]}]   // code only
 "p": ["得分要点 in Chinese"]     // short only, 2-4 grading key points
 "e": "explanation in simplified Chinese, plain and friendly, keeping English course terms (null hypothesis, p-value, bootstrap, confidence interval...). For multiple choice say why the wrong options are wrong."}
Each case is: {"title": "short title", "t": ["topic ids"], "bg": "background in English", "bgzh": "one-sentence Chinese summary of the background", "table": {"cols": [...], "rows": [[...]], "more": number of omitted rows} (optional), "cols": ["column (type): description", ...] (optional), "code": "optional shared code" , "parts": [ {"l": "a", ...question fields...}, ... ]}

Examples of single questions (format only):
${ex.join('\n')}`;
}
function validAI(x, inCase) {
  if (!x || typeof x !== 'object' || !PTS[x.k] || typeof x.q !== 'string') return null;
  const t = (Array.isArray(x.t) ? x.t : [x.t]).filter(id => TOPIC[id]);
  const q = {id: 'ai-' + Math.random().toString(36).slice(2, 8), k: x.k, t: t.length ? t : [[...S.topics][0]], d: [1, 2, 3].includes(+x.d) ? +x.d : 2, q: x.q, e: String(x.e || ''), fromAI: true};
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
  const t = (Array.isArray(x.t) ? x.t : []).filter(id => TOPIC[id]);
  const c = {id: 'aic-' + Math.random().toString(36).slice(2, 8), k: 'case', d: 3, fromAI: true, title: String(x.title || 'Case Study'), t: t.length ? t : [...new Set(parts.flatMap(p => p.t))], bg: x.bg, parts};
  if (x.bgzh) c.bgzh = String(x.bgzh);
  if (x.code) c.code = String(x.code);
  if (Array.isArray(x.cols)) c.cols = x.cols.map(String);
  if (x.table && Array.isArray(x.table.cols) && Array.isArray(x.table.rows)) c.table = {cols: x.table.cols.map(String), rows: x.table.rows.filter(Array.isArray).slice(0, 8).map(r => r.map(String)), more: +x.table.more || 0};
  return c;
}
function setStatus(html, err) { const s = $('#status'); s.hidden = !html; s.className = 'status' + (err ? ' err' : ''); s.innerHTML = html || ''; }

async function generate() {
  if (!S.topics.size) { setStatus('先在左边至少选一个知识点。Pick at least one topic.', true); return; }
  if (!S.kinds.size && !S.cases) { setStatus('至少选一种题型或至少 1 道大题。', true); return; }
  saveSettings();
  const title = S.topics.size === 1 ? TOPIC[[...S.topics][0]].en : S.topics.size >= TOPICS.length ? 'Cumulative Practice Final' : `Practice Exam · ${S.topics.size} topics`;
  if (S.src === 'ai' && S.sample) {
    S.aiCtl?.abort(); const ctl = S.aiCtl = new AbortController();
    $('#genBtn').disabled = true;
    setStatus(`Claude 正在出题（${S.count} 道小题${S.cases ? ` + ${S.cases} 道大题` : ''}），通常需要 1–3 分钟… <button class="ghost" id="stopAI">停止 Stop</button>`);
    $('#stopAI').onclick = () => ctl.abort();
    try {
      const res = await S.sample.json(aiPrompt(), {signal: ctl.signal, cache: false, modelTier: S.cases ? 'complex' : 'default'});
      const singles = (Array.isArray(res) ? res : res?.questions || []).map(x => validAI(x)).filter(Boolean);
      const cases = (res?.cases || []).map(validCase).filter(Boolean);
      if (!singles.length && !cases.length) throw {code: 'invalid_json'};
      let note = `Claude 生成了 ${singles.length} 道小题${cases.length ? ` 和 ${cases.length} 道大题` : ''}。AI 题目偶尔会有瑕疵，觉得答案不对可以对照“知识点”页核实。`;
      const fill = buildExam();
      if (singles.length < S.count) { const top = fill.filter(q => q.k !== 'case').slice(0, S.count - singles.length); singles.push(...top); note += ` 小题从题库补了 ${top.length} 道。`; }
      if (cases.length < S.cases) { const top = fill.filter(q => q.k === 'case').slice(0, S.cases - cases.length); cases.push(...top); if (top.length) note += ` 大题从题库补了 ${top.length} 道。`; }
      S.exam = [...singles, ...cases].map(shuffleChoices);
      renderExam(title + ' · Claude');
      setStatus(note);
    } catch (e) {
      if (e?.code === 'cancelled') { setStatus('已停止。Stopped.'); }
      else {
        const why = {not_granted: '你没有允许这个页面使用 Claude', rate_limited: '调用太频繁或额度已用完，稍后再试', invalid_json: 'Claude 返回的格式无法解析'}[e?.code] || '连接出了问题';
        S.exam = buildExam(); renderExam(title);
        setStatus(`Claude 出题失败（${why}），已改用题库出题。`, true);
        if (e?.code === 'not_granted') { S.sample = null; S.src = 'bank'; renderSetup(); }
      }
    } finally { $('#genBtn').disabled = false; }
    return;
  }
  S.exam = buildExam();
  renderExam(title);
  setStatus('');
  const singles = S.exam.filter(q => q.k !== 'case').length, cases = S.exam.length - singles;
  const short = [singles < S.count ? `小题只有 ${singles} 道可用` : '', cases < S.cases ? `大题只有 ${cases} 道涉及所选知识点` : ''].filter(Boolean);
  if (short.length) setStatus(`这个组合${short.join('，')}。多选几个知识点或题型、把难度设为“混合”，或改用 Claude 出题，可以得到更多。`);
}

async function aiGrade(key) {
  const q = getQ(key); const ans = (el(`q${key}t`).value || '').trim();
  const box = el('ex' + key);
  if (!ans) { q.ai = '还没有作答，先写下你的答案再让 Claude 批改。'; box.innerHTML = explainHTML(q, key); return; }
  q.ai = '批改中…'; box.innerHTML = explainHTML(q, key);
  const parent = String(key).includes('-') ? S.exam[+String(key).split('-')[0]] : null;
  try {
    const r = await S.sample.json(`You are a Data 8 (UC Berkeley) TA grading a short-answer exam question. Be fair but strict about the course's precise wording (e.g. "fail to reject" not "accept"; confidence is about the process; null must be a chance model).
${parent ? 'Background: ' + parent.bg + '\n' : ''}Question: ${q.q}${q.code ? '\nCode:\n' + q.code : ''}
Model answer: ${q.a}
Grading key points: ${(q.p || []).join(' | ')}
Student answer: ${ans}
Reply with ONLY JSON: {"score": 0 | 0.5 | 1, "feedback": "2-4 sentences in simplified Chinese (keep English course terms) saying what was right, what was missing or wrong, and how to phrase it on the exam"}`, {modelTier: 'default', cache: false});
    const s = [0, 0.5, 1].includes(+r?.score) ? +r.score : null;
    q.ai = `${s == null ? '' : `建议得分 ${s * ptsOf(q)} / ${ptsOf(q)}。`}${r?.feedback || ''}`;
    if (s != null) { q.self = s; paintVerdict(key); afterScore(key); }
  } catch (e) {
    q.ai = e?.code === 'not_granted' ? '没有获得使用 Claude 的许可，请用上面的自评按钮。' : '批改失败，请稍后再试或使用自评。';
  }
  box.innerHTML = explainHTML(q, key);
}
