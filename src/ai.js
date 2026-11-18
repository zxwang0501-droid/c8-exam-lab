// AI services for writing and grading questions.
//   app       - the viewer's own Claude account, when this page is opened as a Claude artifact
//   chat      - the viewer's own ChatGPT or Claude website login: copy the prompt over, paste the JSON reply back
//   anthropic - the viewer's Anthropic API key, called from this browser (raw HTTP; the page has no build step)
//   openai    - the viewer's OpenAI API key, called from this browser
// Keys stay in this browser: in memory, or in localStorage only if the viewer ticks "remember".
const ART_URL = 'https://claude.ai/artifact/KVZa8r6iJx1qoGPswrFtbn';
const IN_CLAUDE = !!window.claude;              // inside a Claude artifact, other hosts are blocked, so API keys cannot be used
const AI_PROVIDERS = IN_CLAUDE ? ['app', 'chat'] : ['chat', 'anthropic', 'openai'];
const readKey = p => { try { return localStorage.getItem('c8lab:key:' + p) || ''; } catch { return ''; } };
const writeKey = (p, v) => { try { v ? localStorage.setItem('c8lab:key:' + p, v) : localStorage.removeItem('c8lab:key:' + p); } catch {} };
S.ai = {
  provider: AI_PROVIDERS.includes(store.get('aiProvider')) ? store.get('aiProvider') : AI_PROVIDERS[0],
  remember: store.get('aiRemember', false),
  keys: {anthropic: readKey('anthropic'), openai: readKey('openai')},
  models: {anthropic: store.get('aiModel:anthropic', 'claude-opus-5-5'), openai: store.get('aiModel:openai', 'gpt-5')},
};
const aiReady = () => S.ai.provider === 'app' ? !!S.sample : S.ai.provider === 'chat' ? true : !!S.ai.keys[S.ai.provider];

// Reads the first JSON value out of a reply, tolerating code fences or a sentence around it.
function parseLoose(text) {
  const s = String(text || '').trim();
  const tries = [s];
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i); if (fence) tries.push(fence[1]);
  const i = Math.min(...['{', '['].map(c => s.indexOf(c)).filter(x => x >= 0)); const j = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (isFinite(i) && j > i) tries.push(s.slice(i, j + 1));
  for (const x of tries) { try { return JSON.parse(x); } catch {} }
  throw {code: 'invalid_json', text: s};
}

// Claude Messages API over HTTP, streamed so long case-study replies do not time out.
const FALLBACK_MODELS = ['claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5', 'claude-fable-5-2', 'claude-fable-5-1'];
async function callAnthropic(prompt, kind, signal, onProgress) {
  const model = (S.ai.models.anthropic || '').trim() || 'claude-opus-5-5';
  const headers = {'content-type': 'application/json', 'x-api-key': S.ai.keys.anthropic, 'anthropic-version': '2026-10-21', 'anthropic-dangerous-direct-browser-access': 'true'};
  const body = {model, max_tokens: kind === 'grade' ? 8000 : 64000, stream: true, messages: [{role: 'user', content: prompt}]};
  if (/^claude-(opus-5|sonnet-5-5|haiku-5-5|fable-5|mythos-5)/.test(model)) body.output_config = {effort: kind === 'grade' ? 'low' : 'high'};
  if (FALLBACK_MODELS.includes(model)) { headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; body.fallbacks = 'default'; }
  let res;
  try { res = await fetch('https://api.anthropic.com/v1/messages', {method: 'POST', headers, body: JSON.stringify(body), signal}); }
  catch (e) { throw e?.name === 'AbortError' ? {code: 'cancelled'} : {code: 'network'}; }
  if (!res.ok) { const j = await res.json().catch(() => null); throw {code: 'http', status: res.status, message: j?.error?.message || res.statusText}; }
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = '', text = '', stop = null;
  try {
    for (;;) {
      const {value, done} = await reader.read(); if (done) break;
      buf += dec.decode(value, {stream: true});
      let cut;
      while ((cut = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, cut); buf = buf.slice(cut + 2);
        const data = chunk.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('');
        if (!data) continue;
        let ev; try { ev = JSON.parse(data); } catch { continue; }
        if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') { text += ev.delta.text; onProgress?.(text.length); }
        else if (ev.type === 'message_delta' && ev.delta?.stop_reason) stop = ev.delta.stop_reason;
        else if (ev.type === 'error') throw {code: 'http', status: 'stream', message: ev.error?.message || 'stream error'};
      }
    }
  } catch (e) { throw e?.name === 'AbortError' ? {code: 'cancelled'} : e; }
  if (stop === 'refusal') throw {code: 'refused'};
  if (stop === 'max_tokens') throw {code: 'truncated'};
  return text;
}

// OpenAI Chat Completions over HTTP, asking for a JSON object back.
async function callOpenAI(prompt, signal) {
  const model = (S.ai.models.openai || '').trim() || 'gpt-5';
  let res;
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {method: 'POST', signal,
      headers: {'content-type': 'application/json', authorization: 'Bearer ' + S.ai.keys.openai},
      body: JSON.stringify({model, messages: [{role: 'user', content: prompt}], response_format: {type: 'json_object'}})});
  } catch (e) { throw e?.name === 'AbortError' ? {code: 'cancelled'} : {code: 'network'}; }
  const j = await res.json().catch(() => null);
  if (!res.ok) throw {code: 'http', status: res.status, message: j?.error?.message || res.statusText};
  const choice = j?.choices?.[0];
  if (choice?.finish_reason === 'length') throw {code: 'truncated'};
  return choice?.message?.content || '';
}

async function aiJSON(prompt, {kind = 'gen', signal, onProgress} = {}) {
  const p = S.ai.provider;
  if (p === 'app') return S.sample.json(prompt, {signal, cache: false, modelTier: kind === 'grade' ? 'default' : nCases() ? 'complex' : 'default'});
  if (p === 'anthropic') return parseLoose(await callAnthropic(prompt, kind, signal, onProgress));
  if (p === 'openai') return parseLoose(await callOpenAI(prompt, signal));
  throw {code: 'manual'};
}
function aiErrMsg(e) {
  const c = e?.code;
  if (c === 'http') {
    if (e.status === 401 || e.status === 403) return t('eKey');
    if (e.status === 429) return t('wRate');
    return t('eHttp', {s: e.status, m: String(e.message || '').slice(0, 160)});
  }
  return t({not_granted: 'wNotGranted', rate_limited: 'wRate', invalid_json: 'wJson', network: 'eNet', refused: 'eRefused', truncated: 'eTrunc'}[c] || 'wConn');
}

// ---------- copy-paste flow for ChatGPT / Claude websites ----------
async function copyText(s) { try { await navigator.clipboard.writeText(s); return true; } catch { return false; } }
function showChatFlow(prompt) {
  S.chatPrompt = prompt;
  setStatus(`<div class="chatflow">
    <b>${t('chatTitle')}</b>
    <ol>
      <li><button class="ghost" data-act="chatCopy">${t('chatCopy')}</button> <span class="hint" id="chatCopied"></span></li>
      <li>${t('chatOpen')} <a class="ghost" href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT ↗</a> <a class="ghost" href="https://claude.ai/new" target="_blank" rel="noopener">Claude ↗</a></li>
      <li>${t('chatPasteStep')}</li>
    </ol>
    <details><summary>${t('chatShow')}</summary><textarea id="chatPromptBox" readonly>${esc(prompt)}</textarea></details>
    <textarea id="chatIn" placeholder="${esc(t('chatPastePh'))}"></textarea>
    <div class="q-actions"><button class="primary" data-act="chatImport">${t('chatImport')}</button><span class="hint" id="chatErr"></span></div>
  </div>`);
}

// ---------- AI service panel in the setup rail ----------
function renderAIPanel() {
  const p = S.ai.provider;
  const label = {app: t('pvApp'), chat: t('pvChat'), anthropic: t('pvAnthropic'), openai: t('pvOpenAI')};
  let conf = '';
  if (p === 'app') conf = `<p class="hint">${t(S.sample ? 'appReady' : 'appWait')}</p>`;
  else if (p === 'chat') conf = `<p class="hint">${t('chatNote')}</p>`;
  else conf = `
    <label class="field"><span>API key</span><input id="aiKey" type="password" autocomplete="off" spellcheck="false" placeholder="${p === 'anthropic' ? 'sk-ant-…' : 'sk-…'}" value="${esc(S.ai.keys[p])}"></label>
    <label class="field"><span>${t('modelLabel')}</span><input id="aiModel" list="aiModels-${p}" autocomplete="off" spellcheck="false" value="${esc(S.ai.models[p])}"></label>
    <datalist id="aiModels-anthropic"><option value="claude-opus-5-5"><option value="claude-sonnet-5-5"><option value="claude-haiku-5-5"></datalist>
    <datalist id="aiModels-openai"><option value="gpt-5"><option value="gpt-5-mini"></datalist>
    <label class="check"><input type="checkbox" id="aiRemember"${S.ai.remember ? ' checked' : ''}> ${t('remember')}</label>
    <p class="hint">${t(p === 'anthropic' ? 'keyNoteA' : 'keyNoteO')}</p>`;
  $('#aiPanel').innerHTML = `
    ${IN_CLAUDE ? '' : `<a class="claude-link" href="${ART_URL}" target="_blank" rel="noopener"><b>${t('openInClaude')}</b><span>${t('openInClaudeHint')}</span></a>`}
    <div class="seg">${AI_PROVIDERS.map(x => `<button data-aip="${x}" class="${x === p ? 'on' : ''}" aria-pressed="${x === p}">${esc(label[x])}</button>`).join('')}</div>
    ${conf}`;
}
document.addEventListener('input', e => {
  const p = S.ai.provider;
  if (e.target.id === 'aiKey') { S.ai.keys[p] = e.target.value.trim(); if (S.ai.remember) writeKey(p, S.ai.keys[p]); }
  if (e.target.id === 'aiModel') { S.ai.models[p] = e.target.value.trim(); store.set('aiModel:' + p, S.ai.models[p]); }
});
document.addEventListener('change', e => {
  if (e.target.id !== 'aiRemember') return;
  S.ai.remember = e.target.checked; store.set('aiRemember', S.ai.remember);
  ['anthropic', 'openai'].forEach(p => writeKey(p, S.ai.remember ? S.ai.keys[p] : ''));
});
