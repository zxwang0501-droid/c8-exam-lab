// ---------- grading ----------
const norm = s => String(s).trim().replace(/\s+/g, '').replace(/"/g, "'").replace(/;+$/, '');
const loosen = s => norm(s).toLowerCase().replace(/array\(|\)|\[|\]/g, '');
function blankOk(input, b, loose) {
  const v = loose ? loosen(input) : norm(input);
  if (!v) return false;
  return b.acc.some(a => {
    const t = loose ? loosen(a) : norm(a);
    if (v === t) return true;
    if (loose && !isNaN(parseFloat(v)) && !isNaN(parseFloat(t)) && /^[-\d.e]+$/.test(v) && Math.abs(parseFloat(v) - parseFloat(t)) < 1e-9) return true;
    if (/^\d+\/\d+$/.test(v) && loose) { const [x, y] = v.split('/').map(Number); return Math.abs(x / y - parseFloat(t)) < 1e-9; }
    return false;
  });
}
function grade(q, i) {
  if (q.k === 'mc' || q.k === 'tf') {
    const el = document.querySelector(`input[name="q${i}"]:checked`);
    const pick = el ? +el.value : -1; const right = q.k === 'tf' ? (q.a ? 0 : 1) : q.a;
    return {score: pick === right ? 1 : 0, pick: [pick], right: [right]};
  }
  if (q.k === 'multi') {
    const picks = [...document.querySelectorAll(`input[name="q${i}"]:checked`)].map(e => +e.value);
    const hits = picks.filter(p => q.a.includes(p)).length, wrong = picks.length - hits;
    const exact = hits === q.a.length && wrong === 0;
    return {score: exact ? 1 : Math.max(0, (hits - wrong) / q.a.length) * 0.5, pick: picks, right: q.a, exact};
  }
  if (q.k === 'code') {
    const oks = q.blanks.map((b, j) => blankOk($('#q' + i + 'b' + j).value, b, q.loose));
    return {score: oks.filter(Boolean).length / oks.length, oks};
  }
  return {score: q.self == null ? null : q.self};
}

function showResult(i) {
  const q = S.exam[i]; const card = $('#qcard' + i);
  q.res = grade(q, i);
  card.querySelectorAll('input, textarea').forEach(el => { if (el.type !== 'text' || q.k !== 'code') el.disabled = true; else el.readOnly = true; });
  card.querySelector('[data-check]')?.remove();
  if (q.k === 'mc' || q.k === 'tf' || q.k === 'multi') {
    card.querySelectorAll('.opt').forEach(o => {
      const j = +o.dataset.j;
      if (q.res.right.includes(j)) o.classList.add('is-right');
      else if (q.res.pick.includes(j)) o.classList.add('is-wrong');
    });
  }
  if (q.k === 'code') q.res.oks.forEach((ok, j) => $('#q' + i + 'b' + j).classList.add(ok ? 'ok' : 'no'));
  paintVerdict(i);
  $('#ex' + i).innerHTML = explainHTML(q, i);
  if (q.k !== 'short' && q.res.score < 1) addMistake(q);
}
function paintVerdict(i) {
  const q = S.exam[i], v = $('#v' + i), s = q.k === 'short' ? q.self : q.res?.score;
  if (s == null) { v.className = 'verdict'; v.textContent = q.k === 'short' ? '对照参考答案给自己打分 →' : ''; return; }
  v.className = 'verdict ' + (s >= 1 ? 'good' : s > 0 ? 'part' : 'bad');
  v.textContent = s >= 1 ? '✓ 正确 Correct' : s > 0 ? `◐ 部分正确 Partial (${Math.round(s * 100)}%)` : '✗ 错误 Incorrect';
}
function explainHTML(q, i) {
  let ans = '';
  if (q.k === 'mc') ans = `正确答案：${LETTERS[q.a]}. ${rich(q.c[q.a])}`;
  else if (q.k === 'multi') ans = `正确答案：${q.a.map(j => LETTERS[j]).join(', ')}`;
  else if (q.k === 'tf') ans = `正确答案：${q.a ? 'True' : 'False'}`;
  else if (q.k === 'code') ans = '参考答案：' + q.blanks.map(b => `${b.l === 'output' ? '' : '[' + esc(b.l) + '] '}<code>${esc(b.acc[0])}</code>`).join('　');
  const keys = q.p ? `<div><b>得分要点</b><ul>${q.p.map(p => `<li>${rich(p)}</li>`).join('')}</ul></div>` : '';
  const model = q.k === 'short' ? `<div><b>参考答案 Model answer</b><br>${rich(q.a)}</div>` : '';
  const self = q.k === 'short' ? `<div class="selfgrade">自评 Self-grade:
      <button class="ghost${q.self === 1 ? ' on' : ''}" data-self="${i}" data-v="1">答对了</button>
      <button class="ghost${q.self === 0.5 ? ' on' : ''}" data-self="${i}" data-v="0.5">部分</button>
      <button class="ghost${q.self === 0 ? ' on' : ''}" data-self="${i}" data-v="0">没答对</button>
      ${S.sample ? `<button class="ghost" data-ai-grade="${i}">让 Claude 批改</button>` : ''}</div>` : '';
  const override = q.k === 'code' && q.res.score < 1 ? `<div class="selfgrade">写法不同但等价？<button class="ghost" data-override="${i}">算我对 Mark correct</button></div>` : '';
  const ai = q.ai ? `<div class="ai-fb"><b>Claude 批改：</b>${rich(q.ai)}</div>` : '';
  return `<div class="explain"><div class="ans">${ans}</div>${model}${keys}<div>${rich(q.e || '')}</div>${self}${override}${ai}</div>`;
}

function submitAll() {
  S.exam.forEach((q, i) => { if (!q.res) showResult(i); });
  S.submitted = true; clearInterval(S.timer);
  renderResults();
  $('#results').scrollIntoView({behavior: 'smooth', block: 'start'});
}
function renderResults() {
  const graded = S.exam.filter(q => (q.k === 'short' ? q.self : q.res?.score) != null);
  const pending = S.exam.length - graded.length;
  const pts = graded.reduce((s, q) => s + (q.k === 'short' ? q.self : q.res.score), 0);
  const per = {};
  graded.forEach(q => q.t.forEach(t => { if (!TOPIC[t]) return; per[t] = per[t] || [0, 0]; per[t][0] += (q.k === 'short' ? q.self : q.res.score); per[t][1] += 1; }));
  const secs = Math.floor((Date.now() - S.startedAt) / 1000);
  const wrong = S.exam.filter(q => { const s = q.k === 'short' ? q.self : q.res?.score; return s != null && s < 1; }).length;
  $('#results').hidden = false;
  $('#results').innerHTML = `
    <div class="score"><b>${fmt(pts, 1)} / ${graded.length}</b><span>${graded.length ? Math.round(pts / graded.length * 100) : 0}% · 用时 ${Math.floor(secs / 60)} 分 ${secs % 60} 秒${pending ? ` · ${pending} 道简答题待自评` : ''}</span></div>
    <div class="bars">${Object.entries(per).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]).map(([t, [s, n]]) => `
      <div class="bar"><span>${esc(TOPIC[t].zh)} <span class="hint">${esc(TOPIC[t].en)}</span></span><span class="track"><span class="fill" style="width:${Math.round(s / n * 100)}%"></span></span><span class="v">${fmt(s, 1)}/${n}</span></div>`).join('')}</div>
    <p class="hint">错题已自动加入错题本（简答题自评“部分/没答对”也会加入）。按正确率从低到高排列，最上面就是最该复习的知识点。</p>
    <div class="q-actions"><button class="primary" data-act="again">再来一套 New set</button>${wrong ? `<button class="ghost" data-act="retry">只练这次的错题 (${wrong})</button>` : ''}<button class="ghost" data-act="kb">复习相关知识点</button></div>`;
}

// ---------- mistakes ----------
function strip(q) { const {res, self, ai, ...rest} = q; return rest; }
function addMistake(q) {
  const list = store.get('mistakes', []).filter(m => m.id !== q.id);
  list.unshift({...strip(q), ts: Date.now()});
  store.set('mistakes', list.slice(0, 150));
  renderMistakes();
}
function renderMistakes() {
  const list = store.get('mistakes', []);
  $('#mkHint').textContent = list.length ? `共 ${list.length} 道。重练时答对的题会自动从错题本移除。` : '还没有错题。做完一套题后，答错的题会出现在这里。';
  $('#mkPractice').disabled = !list.length;
  $('#mkList').innerHTML = list.map(q => `<div class="mk"><div class="meta"><span class="tag kind">${KIND[q.k].zh}</span> ${q.t.filter(t => TOPIC[t]).map(t => esc(TOPIC[t].zh)).join(' · ')} · ${new Date(q.ts).toLocaleDateString()}</div><div class="stem">${rich(q.q)}</div></div>`).join('');
}

// ---------- Claude: generate & grade ----------
function aiPrompt() {
  const topics = [...S.topics].map(id => TOPIC[id]);
  const kb = topics.map(t => `## ${t.id} — ${t.en} (${t.zh})\n` + (KB[t.id] || []).map(([term, en, , trap]) => `- ${term}: ${en}${trap ? ' [common mistake: ' + trap + ']' : ''}`).join('\n')).join('\n\n');
  const kinds = [...S.kinds];
  const ex = R.shuffle(BANK.filter(q => q.t.some(t => S.topics.has(t)))).slice(0, 3).map(q => JSON.stringify(strip(q)));
  const diff = {mixed: 'a mix of warm-up (d=1) and exam-level (d=2) questions, plus a few hard ones (d=3)', exam: 'exam-level (d=2) and hard (d=3)', hard: 'hard (d=3): multi-step reasoning, subtle misconceptions'}[S.diff];
  return `You write ORIGINAL practice questions for UC Berkeley Data C8 (Data 8, Foundations of Data Science), matching the style and difficulty of the course's 2023–2026 midterms and finals. Do not reproduce real exam questions; invent new scenarios (campus life, sports, health, transit, food, etc.).

Style of real Data 8 exams: short realistic scenarios; conceptual multiple-choice with plausible distractors built from common misconceptions (p-value as P(null true), "accept the null", CI as a probability about a fixed parameter, association vs causation, bootstrap with/without replacement, Chebyshev vs normal, regression to the mean); "select all that apply" questions; True/False about properties; choosing appropriate test statistics; fill-in-the-blank code using ONLY the datascience Table API and numpy as taught (Table methods: select, drop, where with are.*, sort, take, column, num_rows, with_column(s), relabeled, group, pivot, join, apply, sample, hist, scatter, plot, barh; functions: make_array, np.arange, np.append, np.random.choice, sample_proportions, percentile, np.mean, np.std, np.count_nonzero, minimize). Never use pandas, list comprehensions, or brackets for indexing.

Topics to cover (use these ids in "t"; spread questions across them, and when several topics are chosen, write some questions that combine two topics):
${kb}

Write exactly ${S.count} questions. Allowed kinds: ${kinds.join(', ')}. Difficulty: ${diff}. Emphasize definitions, interpretation, and conceptual reasoning; at most a quarter of questions should be "code".

Return ONLY a JSON array. Each element:
{"k": "mc"|"multi"|"tf"|"short"|"code", "t": ["topic id"], "d": 1|2|3,
 "q": "stem in English (use backticks for inline code)",
 "code": "optional Python shown under the stem; for code questions put blanks as [A], [B]",
 "c": ["choice", ...]            // mc and multi only, 4-5 choices
 "a": 0                          // mc: index of the correct choice; multi: array of correct indices; tf: true/false; short: model answer string in English
 "blanks": [{"l": "A", "acc": ["accepted answer", "equivalent alternative"]}]   // code only
 "p": ["得分要点 in Chinese"]     // short only, 2-4 grading key points
 "e": "explanation in simplified Chinese, plain and friendly, keeping English course terms (null hypothesis, p-value, bootstrap, confidence interval...). For multiple choice say why the wrong options are wrong."}

Examples of the exact JSON format (from the app's own bank):
${ex.join('\n')}`;
}
function validAI(x) {
  if (!x || typeof x !== 'object' || !KIND[x.k] || typeof x.q !== 'string') return null;
  const t = (Array.isArray(x.t) ? x.t : [x.t]).filter(id => TOPIC[id]);
  const q = {id: 'ai-' + Math.random().toString(36).slice(2, 8), k: x.k, t: t.length ? t : [[...S.topics][0]], d: [1, 2, 3].includes(+x.d) ? +x.d : 2, q: x.q, e: String(x.e || ''), fromAI: true};
  if (x.code) q.code = String(x.code);
  if (x.k === 'mc') { if (!Array.isArray(x.c) || x.c.length < 2 || !Number.isInteger(x.a) || !x.c[x.a]) return null; q.c = x.c.map(String); q.a = x.a; }
  if (x.k === 'multi') { if (!Array.isArray(x.c) || !Array.isArray(x.a) || !x.a.length || x.a.some(j => !Number.isInteger(j) || !x.c[j])) return null; q.c = x.c.map(String); q.a = [...new Set(x.a)].sort(); }
  if (x.k === 'tf') { if (typeof x.a !== 'boolean') return null; q.a = x.a; }
  if (x.k === 'short') { if (typeof x.a !== 'string') return null; q.a = x.a; q.p = Array.isArray(x.p) ? x.p.map(String) : []; }
  if (x.k === 'code') { if (!Array.isArray(x.blanks) || !x.blanks.length || x.blanks.some(b => !b || !Array.isArray(b.acc) || !b.acc.length)) return null; q.blanks = x.blanks.map(b => ({l: String(b.l || '?'), acc: b.acc.map(String)})); }
  return q;
}
function setStatus(html, err) { const s = $('#status'); s.hidden = !html; s.className = 'status' + (err ? ' err' : ''); s.innerHTML = html || ''; }

async function generate() {
  if (!S.topics.size) { setStatus('先在左边至少选一个知识点。Pick at least one topic.', true); return; }
  if (!S.kinds.size) { setStatus('至少选一种题型。Pick at least one question type.', true); return; }
  saveSettings();
  const title = S.topics.size === 1 ? TOPIC[[...S.topics][0]].en : S.topics.size >= TOPICS.length ? 'Cumulative Practice Final' : `Practice Exam · ${S.topics.size} topics`;
  if (S.src === 'ai' && S.sample) {
    S.aiCtl?.abort(); const ctl = S.aiCtl = new AbortController();
    $('#genBtn').disabled = true;
    setStatus(`Claude 正在出题（${S.count} 道），通常需要 30–90 秒… <button class="ghost" id="stopAI">停止 Stop</button>`);
    $('#stopAI').onclick = () => ctl.abort();
    try {
      const arr = await S.sample.json(aiPrompt(), {signal: ctl.signal, cache: false});
      const qs = (Array.isArray(arr) ? arr : arr?.questions || []).map(validAI).filter(Boolean);
      if (!qs.length) throw {code: 'invalid_json'};
      let note = `Claude 生成了 ${qs.length} 道新题。AI 题目偶尔会有瑕疵，觉得答案不对可以对照“知识点”页核实。`;
      if (qs.length < S.count) { const top = buildExam().slice(0, S.count - qs.length); qs.push(...top); note += ` 另从题库补了 ${top.length} 道。`; }
      S.exam = qs.map(shuffleChoices);
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
  if (S.exam.length < S.count) setStatus(`这个组合目前只有 ${S.exam.length} 道可用题目。加选题型或知识点、把难度设为“混合”，或改用 Claude 出题可以得到更多。`);
}

async function aiGrade(i) {
  const q = S.exam[i]; const ans = ($('#q' + i + 't').value || '').trim();
  const box = $('#ex' + i);
  if (!ans) { q.ai = '还没有作答，先写下你的答案再让 Claude 批改。'; box.innerHTML = explainHTML(q, i); return; }
  q.ai = '批改中…'; box.innerHTML = explainHTML(q, i);
  try {
    const r = await S.sample.json(`You are a Data 8 (UC Berkeley) TA grading a short-answer exam question. Be fair but strict about the course's precise wording (e.g. "fail to reject" not "accept"; confidence is about the process; null must be a chance model).
Question: ${q.q}${q.code ? '\nCode:\n' + q.code : ''}
Model answer: ${q.a}
Grading key points: ${(q.p || []).join(' | ')}
Student answer: ${ans}
Reply with ONLY JSON: {"score": 0 | 0.5 | 1, "feedback": "2-4 sentences in simplified Chinese (keep English course terms) saying what was right, what was missing or wrong, and how to phrase it on the exam"}`, {modelTier: 'default', cache: false});
    const s = [0, 0.5, 1].includes(+r?.score) ? +r.score : null;
    q.ai = `${s == null ? '' : `建议得分 ${s} 分。`}${r?.feedback || ''}`;
    if (s != null) { q.self = s; paintVerdict(i); if (s < 1) addMistake(q); if (S.submitted) renderResults(); }
  } catch (e) {
    q.ai = e?.code === 'not_granted' ? '没有获得使用 Claude 的许可，请用上面的自评按钮。' : '批改失败，请稍后再试或使用自评。';
  }
  box.innerHTML = explainHTML(q, i);
}
