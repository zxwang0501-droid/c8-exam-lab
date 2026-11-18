// Interface language: 'zh' (Chinese + English course terms, the original), 'en' (English only), 'es' (Spanish).
// Content translations live in TR (filled by tr-*.js); code and datascience method names always stay in English.
let LANG = (() => { try { return JSON.parse(localStorage.getItem('c8lab:lang')) || 'zh'; } catch { return 'zh'; } })();
if (!['zh', 'en', 'es'].includes(LANG)) LANG = 'zh';
const TR = {};
const addTr = obj => Object.assign(TR, obj);
const TOPIC_ES = {causality:'Causalidad y experimentos', python:'Python, tipos de datos y arrays', tables:'Tablas', viz:'Visualización', hist:'Histogramas', functions:'Funciones y apply',
  groups:'Group, pivot y join', iteration:'Condicionales, iteración y simulación', probability:'Probabilidad', sampling:'Muestreo y distribuciones empíricas', models:'Modelos, estadísticos de prueba y TVD',
  hyptest:'Pruebas de hipótesis y valores p', abtest:'Pruebas A/B y permutación', bootstrap:'El bootstrap', ci:'Intervalos de confianza', center:'Centro, dispersión y Chebyshev',
  normal:'Distribución normal, TCL y tamaño de muestra', correlation:'Correlación', regression:'Recta de regresión y mínimos cuadrados', residuals:'Residuos', reginf:'Inferencia en regresión',
  classification:'Clasificación y k-NN', bayes:'Actualizar probabilidades (Bayes)'};
const UNIT_ES = {m1:'Parcial 1', m2:'Parcial 2', fin:'Final'};
const KIND_L = {
  mc:{en:'Multiple choice', es:'Opción única'}, multi:{en:'Select all', es:'Selección múltiple'}, tf:{en:'True / False', es:'Verdadero / Falso'},
  short:{en:'Short answer', es:'Respuesta corta'}, code:{en:'Code', es:'Código'}, case:{en:'Case study', es:'Caso de estudio'}};

// UI strings. zh keeps the original bilingual wording.
const UI = {
  brandSub:{zh:'刷题机 · Foundations of Data Science', en:'Practice exams · Foundations of Data Science', es:'Exámenes de práctica · Foundations of Data Science'},
  tabExam:{zh:'出题<small>Exam</small>', en:'Exam', es:'Examen'}, tabConcepts:{zh:'知识点<small>Concepts</small>', en:'Concepts', es:'Conceptos'}, tabMistakes:{zh:'错题本<small>Mistakes</small>', en:'Mistakes', es:'Errores'},
  topics:{zh:'知识点 Topics', en:'Topics', es:'Temas'}, selCount:{zh:'已选 {n}', en:'{n} selected', es:'{n} elegidos'},
  pMock:{zh:'完整模拟考 Mock exam', en:'Full mock exam', es:'Simulacro completo'}, pWeak:{zh:'我的弱项 · 检验/区间', en:'Weak spots: tests & CIs', es:'Puntos débiles: pruebas e intervalos'},
  pM1:{zh:'期中一 MT1', en:'Midterm 1', es:'Parcial 1'}, pM2:{zh:'期中二 MT2', en:'Midterm 2', es:'Parcial 2'}, pFin:{zh:'期末新增', en:'Final-only', es:'Solo final'},
  pAll:{zh:'全选 All', en:'All', es:'Todos'}, pNone:{zh:'清空 Clear', en:'Clear', es:'Ninguno'}, weakTag:{zh:' · 弱项', en:' · weak spot', es:' · punto débil'},
  countLabel:{zh:'小题数量 Questions', en:'Single questions', es:'Preguntas sueltas'},
  caseLabel:{zh:'大题 Case studies', en:'Case studies', es:'Casos de estudio'}, caseHint:{zh:'约 20 分/道', en:'about 20 pts each', es:'unos 20 pts cada uno'},
  caseOn:{zh:'生成大题', en:'Include', es:'Incluir'}, caseOff:{zh:'不要大题', en:'Skip', es:'Omitir'}, caseN:{zh:'{n} 道', en:'{n}', es:'{n}'},
  typesLabel:{zh:'题型 Types', en:'Question types', es:'Tipos de pregunta'},
  diffLabel:{zh:'难度 Difficulty', en:'Difficulty', es:'Dificultad'}, dMixed:{zh:'混合 Mixed', en:'Mixed', es:'Mixta'}, dExam:{zh:'考试难度 Exam', en:'Exam level', es:'Nivel examen'}, dHard:{zh:'只要难题 Hard', en:'Hard only', es:'Solo difíciles'},
  modeLabel:{zh:'模式 Mode', en:'Mode', es:'Modo'}, mPractice:{zh:'练习 Practice', en:'Practice', es:'Práctica'}, mExam:{zh:'考试 Exam', en:'Exam', es:'Examen'},
  srcLabel:{zh:'出题来源 Source', en:'Source', es:'Fuente'}, sBank:{zh:'题库 + 随机模板', en:'Bank + random templates', es:'Banco + plantillas'}, sAI:{zh:'Claude 出新题', en:'New questions by Claude', es:'Preguntas nuevas de Claude'},
  hintAI:{zh:'由 Claude 按所选知识点现场出题，大题也会现写（会用到你自己的 Claude 额度，第一次会请你授权）。', en:'Claude writes new questions, including case studies, for the chosen topics. This uses your own Claude usage and asks permission the first time.', es:'Claude escribe preguntas nuevas, incluidos casos de estudio, para los temas elegidos. Usa tu propio uso de Claude y pide permiso la primera vez.'},
  hintBank:{zh:'题库题都有标准答案和中文解析；随机模板每次生成新数字。', en:'Bank questions come with answers and explanations; random templates make new numbers every time.', es:'Las preguntas del banco traen respuesta y explicación; las plantillas generan números nuevos cada vez.'},
  hintNoAI:{zh:'题库题都有标准答案和中文解析。在 Claude 里打开本页时，还可以让 Claude 现场出新题（包括大题）、批改简答题。', en:'Bank questions come with answers and explanations. When this page is opened in Claude, Claude can also write new questions (including case studies) and grade short answers.', es:'Las preguntas del banco traen respuesta y explicación. Si abres esta página en Claude, Claude también puede escribir preguntas nuevas (incluidos casos) y calificar respuestas cortas.'},
  genBtn:{zh:'生成试卷 Generate', en:'Generate exam', es:'Generar examen'},
  pool:{zh:'当前组合：{a} 道题库小题 + {b} 个随机模板 + {c} 道大题', en:'This selection: {a} bank questions + {b} random templates + {c} case studies', es:'Esta selección: {a} preguntas del banco + {b} plantillas + {c} casos'},
  lgCircle:{zh:'圆圈 = 单选 (one answer)', en:'Circle = one answer', es:'Círculo = una respuesta'}, lgSquare:{zh:'方框 = 多选 (select all that apply)', en:'Square = select all that apply', es:'Cuadrado = marca todas las correctas'},
  lgCase:{zh:'大题 = 背景故事 + 数据表 + 多个小问', en:'Case study = story + data table + several parts', es:'Caso = contexto + tabla de datos + varias partes'}, lgLang:{zh:'题干英文同考试，解析中文', en:'Code and method names follow the course', es:'El código y los nombres de métodos siguen el curso (en inglés)'},
  metaN:{zh:'{n} 题 · 共 {p} 分', en:'{n} questions · {p} points', es:'{n} preguntas · {p} puntos'}, metaCases:{zh:'大题 {n}', en:'case studies {n}', es:'casos {n}'},
  metaExam:{zh:'考试模式：交卷后统一批改', en:'Exam mode: graded when you submit', es:'Modo examen: se califica al entregar'}, metaPractice:{zh:'练习模式：每题可单独检查', en:'Practice mode: check each question', es:'Modo práctica: revisa cada pregunta'},
  empty:{zh:'当前组合没有可用的题目。换几个知识点或题型试试。<br>No questions match. Try other topics or types.', en:'No questions match. Try other topics or question types.', es:'No hay preguntas para esta selección. Prueba otros temas o tipos.'},
  submit:{zh:'交卷 Submit', en:'Submit', es:'Entregar'}, gradeAll:{zh:'全部批改 Grade all', en:'Grade all', es:'Calificar todo'}, answered:{zh:'已作答 {a} / {b}', en:'Answered {a} / {b}', es:'Respondidas {a} / {b}'},
  check:{zh:'检查 Check', en:'Check', es:'Revisar'}, tagRand:{zh:'随机数值', en:'random numbers', es:'números aleatorios'}, tagAI:{zh:'Claude 生成', en:'by Claude', es:'de Claude'},
  tagCase:{zh:'大题 · Case study', en:'Case study', es:'Caso de estudio'}, bgHint:{zh:'中文背景提示', en:'', es:''}, rowsOmitted:{zh:'… ({n} rows omitted)', en:'… ({n} rows omitted)', es:'… ({n} filas omitidas)'},
  phText:{zh:'用英文或中文作答都可以。Answer in English or Chinese.', en:'Write your answer.', es:'Escribe tu respuesta.'}, phBlank:{zh:'code for blank {l}', en:'code for blank {l}', es:'código para el espacio {l}'}, phOut:{zh:'value', en:'value', es:'valor'},
  vRight:{zh:'✓ 正确 Correct', en:'✓ Correct', es:'✓ Correcto'}, vPart:{zh:'◐ 部分正确 Partial', en:'◐ Partly correct', es:'◐ Parcialmente correcto'}, vWrong:{zh:'✗ 错误 Incorrect', en:'✗ Incorrect', es:'✗ Incorrecto'},
  selfPrompt:{zh:'对照参考答案给自己打分 →', en:'Grade yourself against the model answer →', es:'Califícate con la respuesta modelo →'},
  ansIs:{zh:'正确答案：', en:'Answer: ', es:'Respuesta: '}, ansRef:{zh:'参考答案：', en:'Answer: ', es:'Respuesta: '}, keyPts:{zh:'得分要点', en:'Key points', es:'Puntos clave'}, model:{zh:'参考答案 Model answer', en:'Model answer', es:'Respuesta modelo'},
  selfGrade:{zh:'自评 Self-grade:', en:'Self-grade:', es:'Autoevaluación:'}, sgRight:{zh:'答对了', en:'Correct', es:'Correcta'}, sgPart:{zh:'部分', en:'Partly', es:'Parcial'}, sgWrong:{zh:'没答对', en:'Wrong', es:'Incorrecta'},
  aiGradeBtn:{zh:'让 Claude 批改', en:'Ask Claude to grade', es:'Que Claude califique'}, eqQ:{zh:'写法不同但等价？', en:'Different but equivalent?', es:'¿Distinta pero equivalente?'}, markRight:{zh:'算我对 Mark correct', en:'Mark correct', es:'Marcar como correcta'},
  aiFb:{zh:'Claude 批改：', en:'Claude\'s feedback: ', es:'Comentario de Claude: '}, T:{zh:'True', en:'True', es:'Verdadero'}, F:{zh:'False', en:'False', es:'Falso'},
  partly:{zh:'（部分已批改）', en:' (partly graded)', es:' (calificado en parte)'},
  resLine:{zh:'分 points · {pct}% · 用时 {m} 分 {s} 秒', en:'points · {pct}% · time {m}m {s}s', es:'puntos · {pct}% · tiempo {m} min {s} s'},
  resPending:{zh:' · {n} 道简答待自评（未计入）', en:' · {n} short answers not graded yet (not counted)', es:' · {n} respuestas cortas sin calificar (no cuentan)'},
  resHint:{zh:'按得分率从低到高排列，最上面就是最该复习的知识点。有错的题（大题整题）已自动加入错题本。', en:'Topics are sorted from lowest to highest score, so the top ones need the most review. Missed questions (whole case studies) were added to Mistakes.', es:'Los temas van del puntaje más bajo al más alto: los de arriba necesitan más repaso. Las preguntas falladas (casos completos) se añadieron a Errores.'},
  again:{zh:'再来一套 New set', en:'New set', es:'Nuevo examen'}, retry:{zh:'只练这次的错题 ({n})', en:'Retry mistakes ({n})', es:'Repetir errores ({n})'}, review:{zh:'复习相关知识点', en:'Review concepts', es:'Repasar conceptos'},
  mkTitle:{zh:'错题本 Mistakes', en:'Mistakes', es:'Errores'}, mkRetry:{zh:'重练错题 Retry', en:'Retry', es:'Repetir'}, mkClear:{zh:'清空 Clear', en:'Clear', es:'Borrar'}, mkConfirm:{zh:'再点一次确认清空', en:'Click again to clear', es:'Haz clic de nuevo para borrar'},
  mkHint:{zh:'共 {n} 道。重练时全部答对的题会自动从错题本移除。', en:'{n} saved. Questions you fully answer correctly on a retry leave the list.', es:'{n} guardadas. Las que respondas bien por completo al repetir salen de la lista.'},
  mkEmpty:{zh:'还没有错题。做完一套题后，答错的题会出现在这里。', en:'No mistakes yet. After you finish a set, missed questions appear here.', es:'Todavía no hay errores. Al terminar un examen, las preguntas falladas aparecen aquí.'},
  mkStatus:{zh:'全部答对的题会自动移出错题本。', en:'Questions you get fully right leave the mistake list.', es:'Las preguntas que aciertes por completo salen de la lista.'},
  kbSearch:{zh:'搜索概念 Search a term… (e.g. p-value, bootstrap, 置信区间)', en:'Search a term… (e.g. p-value, bootstrap)', es:'Busca un término… (p. ej. valor p, bootstrap)'},
  kbCount:{zh:'{a} 个概念 · {b} 个知识点 · 题库 {c} 道小题 + {d} 道大题 + {e} 个随机模板', en:'{a} concepts · {b} topics · {c} questions + {d} case studies + {e} random templates', es:'{a} conceptos · {b} temas · {c} preguntas + {d} casos + {e} plantillas'},
  kbPractice:{zh:'练这个知识点 Practice', en:'Practice this topic', es:'Practicar este tema'}, kbTrap:{zh:'易错 · ', en:'Common mistake · ', es:'Error común · '}, kbNone:{zh:'没有找到匹配的概念。No matching concepts.', en:'No matching concepts.', es:'No hay conceptos que coincidan.'},
  needTopic:{zh:'先在左边至少选一个知识点。Pick at least one topic.', en:'Pick at least one topic.', es:'Elige al menos un tema.'}, needType:{zh:'至少选一种题型或至少 1 道大题。', en:'Pick at least one question type or include case studies.', es:'Elige al menos un tipo de pregunta o incluye casos.'},
  aiWorking:{zh:'Claude 正在出题（{n} 道小题{c}），通常需要 1–3 分钟…', en:'Claude is writing {n} questions{c}. This usually takes 1–3 minutes…', es:'Claude está escribiendo {n} preguntas{c}. Suele tardar 1–3 minutos…'},
  aiWorkingCases:{zh:' + {n} 道大题', en:' and {n} case studies', es:' y {n} casos'}, stop:{zh:'停止 Stop', en:'Stop', es:'Detener'}, stopped:{zh:'已停止。Stopped.', en:'Stopped.', es:'Detenido.'},
  aiNote:{zh:'Claude 生成了 {a} 道小题{b}。AI 题目偶尔会有瑕疵，觉得答案不对可以对照“知识点”页核实。', en:'Claude wrote {a} questions{b}. AI questions can have mistakes; check the Concepts page if an answer looks wrong.', es:'Claude escribió {a} preguntas{b}. Las preguntas de IA pueden tener errores; revisa Conceptos si una respuesta parece incorrecta.'},
  aiNoteCases:{zh:' 和 {n} 道大题', en:' and {n} case studies', es:' y {n} casos'}, aiTopS:{zh:' 小题从题库补了 {n} 道。', en:' Added {n} bank questions.', es:' Se añadieron {n} preguntas del banco.'}, aiTopC:{zh:' 大题从题库补了 {n} 道。', en:' Added {n} bank case studies.', es:' Se añadieron {n} casos del banco.'},
  aiFail:{zh:'Claude 出题失败（{w}），已改用题库出题。', en:'Claude could not write the questions ({w}), so the bank was used instead.', es:'Claude no pudo escribir las preguntas ({w}); se usó el banco.'},
  wNotGranted:{zh:'你没有允许这个页面使用 Claude', en:'this page was not allowed to use Claude', es:'no se permitió que esta página usara Claude'}, wRate:{zh:'调用太频繁或额度已用完，稍后再试', en:'too many requests or usage limit reached; try later', es:'demasiadas solicitudes o límite alcanzado; inténtalo más tarde'},
  wJson:{zh:'Claude 返回的格式无法解析', en:'the reply could not be read', es:'no se pudo leer la respuesta'}, wConn:{zh:'连接出了问题', en:'connection problem', es:'problema de conexión'},
  short:{zh:'这个组合{x}。多选几个知识点或题型、把难度设为“混合”，或改用 Claude 出题，可以得到更多。', en:'For this selection, {x}. Pick more topics or types, set difficulty to Mixed, or use Claude to get more.', es:'Para esta selección, {x}. Elige más temas o tipos, usa dificultad Mixta o usa Claude para obtener más.'},
  shortS:{zh:'小题只有 {n} 道可用', en:'only {n} single questions are available', es:'solo hay {n} preguntas sueltas'}, shortC:{zh:'大题只有 {n} 道涉及所选知识点', en:'only {n} case studies cover these topics', es:'solo {n} casos cubren estos temas'},
  aiNoAns:{zh:'还没有作答，先写下你的答案再让 Claude 批改。', en:'Write an answer first, then ask Claude to grade it.', es:'Escribe una respuesta primero y luego pide a Claude que la califique.'}, aiGrading:{zh:'批改中…', en:'Grading…', es:'Calificando…'},
  aiSuggest:{zh:'建议得分 {a} / {b}。', en:'Suggested score {a} / {b}. ', es:'Puntaje sugerido {a} / {b}. '}, aiNoPerm:{zh:'没有获得使用 Claude 的许可，请用上面的自评按钮。', en:'Claude was not allowed; use the self-grade buttons above.', es:'No se permitió usar Claude; usa los botones de autoevaluación.'},
  aiGradeFail:{zh:'批改失败，请稍后再试或使用自评。', en:'Grading failed; try again later or self-grade.', es:'La calificación falló; inténtalo más tarde o autoevalúate.'},
  tPractice:{zh:'Practice Exam · {n} topics', en:'Practice Exam · {n} topics', es:'Examen de práctica · {n} temas'}, tPracticeOne:{zh:'Practice Exam', en:'Practice Exam', es:'Examen de práctica'},
  tFinal:{zh:'Cumulative Practice Final', en:'Cumulative Practice Final', es:'Final de práctica acumulativo'}, tRetry:{zh:'Retry · 错题重练', en:'Retry', es:'Repetición'}, tMistakes:{zh:'Mistakes Review · 错题本', en:'Mistakes Review', es:'Repaso de errores'},
  tfTitle:{zh:'True or False', en:'True or False', es:'Verdadero o falso'}, tfBg:{zh:'For each statement below, choose True or False. Each part is worth 2 points.', en:'For each statement below, choose True or False. Each part is worth 2 points.', es:'Para cada afirmación, elige Verdadero o Falso. Cada parte vale 2 puntos.'},
  foot:{zh:'非官方学习工具，与 UC Berkeley 及 Data 8 / Data C8 课程团队无关。题目均为原创练习题，风格参考历年公开考试。Unofficial study tool, not affiliated with UC Berkeley or the course staff.', en:'Unofficial study tool, not affiliated with UC Berkeley or the Data 8 / Data C8 course staff. All questions are original practice questions in the style of past public exams.', es:'Herramienta de estudio no oficial, sin relación con UC Berkeley ni con el equipo de Data 8 / Data C8. Todas las preguntas son originales, al estilo de exámenes públicos anteriores.'},
  langLabel:{zh:'界面语言', en:'Language', es:'Idioma'},
};
const t = (key, vars) => { let s = (UI[key] || {})[LANG] ?? (UI[key] || {}).en ?? key; if (vars) for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(v); return s; };
const topicName = id => { const tp = TOPICS.find(x => x.id === id); return LANG === 'es' ? TOPIC_ES[id] : tp.en; };
const topicSub = id => LANG === 'zh' ? TOPICS.find(x => x.id === id).zh : '';
const unitName = u => LANG === 'es' ? UNIT_ES[u] : LANG === 'en' ? UNITS[u].en : `${UNITS[u].zh} · ${UNITS[u].en}`;
const kindName = k => LANG === 'zh' ? `${KIND[k].zh} · ${KIND[k].en}` : KIND_L[k][LANG];
const kindShort = k => LANG === 'zh' ? KIND[k].zh : KIND_L[k][LANG];

// Localize a bank question or case (before choices are shuffled). zh returns the original.
function loc(q) {
  if (LANG === 'zh' || q.fromAI) return q;
  const tr = TR[q.id]?.[LANG];
  if (q.k === 'case') {
    const c = {...q, title: tr?.title || q.title, bg: tr?.bg || q.bg, cols: tr?.cols || q.cols, bgzh: undefined};
    c.parts = q.parts.map(p => locPart(p, tr?.parts?.[p.l]));
    if (q.id.startsWith('tfb-')) { c.title = t('tfTitle'); c.bg = t('tfBg'); }
    return c;
  }
  return locPart(q, tr);
}
function locPart(p, tr) {
  if (!tr && TR[p.id]) tr = TR[p.id][LANG]; // T/F block parts are bank questions
  if (!tr) return p;
  const o = {...p};
  if (tr.q) o.q = tr.q;
  if (tr.c) o.c = p.c.map((x, i) => tr.c[i] ?? x);
  if (tr.e) o.e = tr.e;
  if (tr.p) o.p = tr.p;
  if (tr.a && p.k === 'short') o.a = tr.a;
  if (tr.code) o.code = tr.code;
  return o;
}
