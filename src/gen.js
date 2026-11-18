// Randomized templates. Each instance stores a seed, so it can be re-rendered in another language with the same numbers.
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const R = {
  rand: Math.random,
  int: (a, b) => a + Math.floor(R.rand() * (b - a + 1)),
  pick: arr => arr[Math.floor(R.rand() * arr.length)],
  shuffle: arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
};
const fmt = (x, d = 2) => String(Number(x.toFixed(d)));
const pct = (x, d = 1) => fmt(x * 100, d) + '%';
const L3 = (zh, en, es) => LANG === 'zh' ? zh : LANG === 'es' ? es : en;   // explanations
const S2 = (en, es) => LANG === 'es' ? es : en;                            // stems and choices (zh mode uses English, like the exam)
function numMC(correct, distractors, show = v => v) {
  const seen = new Set([show(correct)]); const opts = [show(correct)];
  for (const d of distractors) { const s = show(d); if (!seen.has(s) && opts.length < 5) { seen.add(s); opts.push(s); } }
  return {c: opts, a: 0};
}
function makeGen(g, seed) {
  const keep = R.rand; R.rand = mulberry(seed);
  try { return g.make(); } finally { R.rand = keep; }
}

const GENS = [
{id:'g-hist', t:['hist'], d:2, make() {
  const w = R.pick([2, 5, 10]); const start = R.pick([0, 10, 20]);
  const h1 = R.pick([1, 2, 3, 4]) / (w === 10 ? 2 : 1), h2 = R.pick([1, 2, 3]) / (w === 10 ? 2 : 1);
  const w2 = w * 2, p1 = h1 * w, p2 = h2 * w2, tot = p1 + p2;
  const [unit, u1] = R.pick([['minutes', 'minute', 'minutos', 'minuto'], ['dollars', 'dollar', 'dólares', 'dólar'], ['inches', 'inch', 'pulgadas', 'pulgada']].map(x => LANG === 'es' ? [x[2], x[3]] : [x[0], x[1]]));
  const m = numMC(tot, [h1 + h2, p1, p2, tot / 2, h1 * w2 + h2 * w], v => fmt(v, 1) + '%');
  return {k:'mc', ...m,
    q: S2(`A histogram of a variable measured in ${unit} has a bin [${start}, ${start + w}) with height ${fmt(h1)} percent per ${u1} and the next bin [${start + w}, ${start + w + w2}) with height ${fmt(h2)} percent per ${u1}. What percent of the data are in [${start}, ${start + w + w2})?`,
      `Un histograma de una variable medida en ${unit} tiene un intervalo [${start}, ${start + w}) con altura ${fmt(h1)} por ciento por ${u1} y el siguiente intervalo [${start + w}, ${start + w + w2}) con altura ${fmt(h2)} por ciento por ${u1}. ¿Qué porcentaje de los datos está en [${start}, ${start + w + w2})?`),
    e: L3(`面积 = 百分比。第一个 bin：${fmt(h1)} × ${w} = ${fmt(p1, 1)}%；第二个 bin 宽度是 ${w2}：${fmt(h2)} × ${w2} = ${fmt(p2, 1)}%。合计 ${fmt(tot, 1)}%。常见错误是把高度直接相加（${fmt(h1 + h2)}），或忘了两个 bin 宽度不同。`,
      `Area is percent. First bin: ${fmt(h1)} × ${w} = ${fmt(p1, 1)}%. The second bin is ${w2} wide: ${fmt(h2)} × ${w2} = ${fmt(p2, 1)}%. Total ${fmt(tot, 1)}%. Common mistakes: adding the heights (${fmt(h1 + h2)}) or forgetting that the bins have different widths.`,
      `El área es el porcentaje. Primer intervalo: ${fmt(h1)} × ${w} = ${fmt(p1, 1)}%. El segundo mide ${w2}: ${fmt(h2)} × ${w2} = ${fmt(p2, 1)}%. Total ${fmt(tot, 1)}%. Errores comunes: sumar las alturas (${fmt(h1 + h2)}) u olvidar que los anchos son distintos.`)};
}},
{id:'g-hist-height', t:['hist'], d:1, make() {
  const n = R.pick([200, 400, 500]); const w = R.pick([4, 5, 10]); const cnt = R.pick([20, 40, 50, 80, 100]);
  const p = cnt / n * 100, h = p / w; const u = S2(' % per year', ' % por año');
  const m = numMC(h, [p, cnt / w, h * 10, p * w], v => fmt(v, 2) + u);
  return {k:'mc', ...m,
    q: S2(`${n} people's ages are shown in a density-scale histogram. ${cnt} of them are in the bin [30, ${30 + w}). What is the height of that bar?`,
      `Las edades de ${n} personas se muestran en un histograma en escala de densidad. ${cnt} de ellas están en el intervalo [30, ${30 + w}). ¿Cuál es la altura de esa barra?`),
    e: L3(`占比 = ${cnt}/${n} = ${fmt(p, 2)}%。高度 = 占比 / 宽度 = ${fmt(p, 2)} / ${w} = ${fmt(h, 2)} % per year。`,
      `Percent in the bin = ${cnt}/${n} = ${fmt(p, 2)}%. Height = percent / width = ${fmt(p, 2)} / ${w} = ${fmt(h, 2)} percent per year.`,
      `Porcentaje en el intervalo = ${cnt}/${n} = ${fmt(p, 2)}%. Altura = porcentaje / ancho = ${fmt(p, 2)} / ${w} = ${fmt(h, 2)} % por año.`)};
}},
{id:'g-cheb', t:['center'], d:2, make() {
  const z = R.pick([2, 2.5, 3, 4, 5]); const mean = R.pick([50, 60, 72, 100, 140]); const sd = R.pick([4, 5, 8, 10, 12]);
  const ans = 1 - 1 / (z * z);
  const normal = {2:0.95, 2.5:0.9876, 3:0.9973, 4:0.9999, 5:0.9999}[z];
  const m = numMC(ans, [1 / (z * z), 1 - 1 / z, normal, 0.68, ans === 0.75 ? 0.5 : 0.75], v => pct(v, 2));
  m.c.push(S2('Not enough information', 'Not enough information (no hay suficiente información)'));
  const lo = fmt(mean - z * sd), hi = fmt(mean + z * sd);
  return {k:'mc', ...m,
    q: S2(`A list of numbers has average ${mean} and SD ${sd}. Nothing is known about the shape of its distribution. What is the smallest possible percent of the numbers between ${lo} and ${hi}?`,
      `Una lista de números tiene promedio ${mean} y DE ${sd}. No se sabe nada de la forma de su distribución. ¿Cuál es el menor porcentaje posible de números entre ${lo} y ${hi}?`),
    e: L3(`区间是平均 ± ${z} 个 SD（(${hi} − ${mean}) / ${sd} = ${z}）。分布形状未知 → Chebyshev：至少 1 − 1/${z}² = ${pct(ans, 2)}。正态分布的数字（如 95%）在这里不能用。`,
      `The interval is the average ± ${z} SDs ((${hi} − ${mean}) / ${sd} = ${z}). The shape is unknown, so use Chebyshev: at least 1 − 1/${z}² = ${pct(ans, 2)}. Normal-curve numbers such as 95% do not apply here.`,
      `El intervalo es el promedio ± ${z} DE ((${hi} − ${mean}) / ${sd} = ${z}). La forma es desconocida, así que se usa Chebyshev: al menos 1 − 1/${z}² = ${pct(ans, 2)}. Los valores de la curva normal (como 95%) no aplican aquí.`)};
}},
{id:'g-su', t:['center'], d:1, make() {
  const mean = R.pick([60, 70, 75, 160, 20]); const sd = R.pick([4, 5, 8, 10]); const z = R.pick([-2, -1.5, -0.5, 0.5, 1.25, 1.5, 2.5]);
  const x = mean + z * sd;
  const m = numMC(z, [-z, z * sd, x - mean, x / sd, z / 10], v => fmt(v, 2));
  return {k:'mc', ...m, q: S2(`The average is ${mean} and the SD is ${sd}. What is ${fmt(x)} in standard units?`, `El promedio es ${mean} y la DE es ${sd}. ¿Cuánto es ${fmt(x)} en unidades estándar?`),
    e: L3(`z = (${fmt(x)} − ${mean}) / ${sd} = ${fmt(z)}。`, `z = (${fmt(x)} − ${mean}) / ${sd} = ${fmt(z)}.`, `z = (${fmt(x)} − ${mean}) / ${sd} = ${fmt(z)}.`)};
}},
{id:'g-sdmean', t:['normal'], d:2, make() {
  const sd = R.pick([12, 15, 20, 30, 40]); const n = R.pick([16, 25, 36, 64, 100, 144, 400]);
  const ans = sd / Math.sqrt(n);
  const m = numMC(ans, [sd / n, sd, sd * Math.sqrt(n), sd / Math.sqrt(n / 4)], v => fmt(v, 3));
  return {k:'mc', ...m, q: S2(`A population has SD ${sd}. For random samples of size ${n} drawn with replacement, what is the SD of the sample average?`, `Una población tiene DE ${sd}. Para muestras aleatorias de tamaño ${n} con reemplazo, ¿cuál es la DE del promedio muestral?`),
    e: L3(`SD of sample average = 总体 SD / √n = ${sd} / √${n} = ${sd} / ${Math.sqrt(n)} = ${fmt(ans, 3)}。`, `SD of the sample average = population SD / √n = ${sd} / √${n} = ${sd} / ${Math.sqrt(n)} = ${fmt(ans, 3)}.`, `DE del promedio muestral = DE de la población / √n = ${sd} / √${n} = ${sd} / ${Math.sqrt(n)} = ${fmt(ans, 3)}.`)};
}},
{id:'g-samplesize', t:['normal','ci'], d:3, make() {
  const w = R.pick([0.01, 0.02, 0.04, 0.05, 0.1]); const n = Math.pow(4 * 0.5 / w, 2);
  const m = numMC(n, [Math.pow(2 * 0.5 / w, 2), 4 * 0.5 / w, Math.pow(0.5 / w, 2), n * 4], v => Math.round(v).toLocaleString('en-US'));
  const N = Math.round(n).toLocaleString('en-US');
  return {k:'mc', ...m,
    q: S2(`A pollster wants a 95% confidence interval for the proportion of voters supporting a measure, with total WIDTH at most ${w}. Using the upper bound 0.5 for the SD of a 0/1 population, what is the smallest sample size that guarantees this?`,
      `Una encuestadora quiere un intervalo de confianza del 95% para la proporción de votantes que apoyan una medida, con ANCHO total de a lo sumo ${w}. Usando la cota 0.5 para la DE de una población 0/1, ¿cuál es el menor tamaño de muestra que lo garantiza?`),
    e: L3(`95% CI 宽度 ≈ 4 × SD / √n ≤ ${w} → √n ≥ 4 × 0.5 / ${w} = ${fmt(4 * 0.5 / w)} → n ≥ ${N}。注意是“总宽度”（两边各 2 个 SD），不是半宽。`,
      `Width of a 95% CI ≈ 4 × SD / √n ≤ ${w} → √n ≥ 4 × 0.5 / ${w} = ${fmt(4 * 0.5 / w)} → n ≥ ${N}. This is the total width (2 SDs on each side), not the half-width.`,
      `Ancho del IC del 95% ≈ 4 × DE / √n ≤ ${w} → √n ≥ 4 × 0.5 / ${w} = ${fmt(4 * 0.5 / w)} → n ≥ ${N}. Es el ancho total (2 DE a cada lado), no la mitad.`)};
}},
{id:'g-ciwidth', t:['ci','normal'], d:2, make() {
  const W = R.pick([2, 3, 4, 6, 8]); const k = R.pick([2, 3, 4]); const n = R.pick([50, 100, 200]);
  const ans = W / k;
  const m = numMC(ans, [W / (k * k), W * k, W, W / Math.sqrt(k)], v => fmt(v, 3));
  return {k:'mc', ...m,
    q: S2(`A 95% CI for a population mean, built from a random sample of ${n}, has width ${W}. About how wide would the 95% CI be with a sample of ${n * k * k} from the same population?`,
      `Un IC del 95% para la media poblacional, construido con una muestra aleatoria de ${n}, tiene ancho ${W}. ¿Qué ancho tendría aproximadamente el IC del 95% con una muestra de ${n * k * k} de la misma población?`),
    e: L3(`宽度 ∝ 1/√n。样本量变成 ${k * k} 倍，√${k * k} = ${k}，宽度变成 1/${k}：${W} / ${k} = ${fmt(ans, 3)}。`,
      `Width ∝ 1/√n. The sample is ${k * k} times larger and √${k * k} = ${k}, so the width becomes 1/${k} as large: ${W} / ${k} = ${fmt(ans, 3)}.`,
      `Ancho ∝ 1/√n. La muestra es ${k * k} veces mayor y √${k * k} = ${k}, así que el ancho se divide entre ${k}: ${W} / ${k} = ${fmt(ans, 3)}.`)};
}},
{id:'g-regpred', t:['regression'], d:2, make() {
  const r = R.pick([0.4, 0.5, 0.6, 0.75, -0.5, -0.6]); const mx = R.pick([60, 70, 100]); const sx = R.pick([5, 10, 20]);
  const my = R.pick([50, 80, 200]); const sy = R.pick([4, 8, 12, 30]); const zx = R.pick([-2, -1, 1, 1.5, 2]);
  const x = mx + zx * sx; const pred = my + r * zx * sy;
  const m = numMC(pred, [my + zx * sy, my + r * zx * sx, my - r * zx * sy, my + zx * sy / r], v => fmt(v, 2));
  return {k:'mc', ...m,
    q: S2(`For a set of individuals, x has average ${mx} and SD ${sx}; y has average ${my} and SD ${sy}; r = ${r}. Using the regression line, what is the predicted y for an individual with x = ${fmt(x)}?`,
      `En un grupo de individuos, x tiene promedio ${mx} y DE ${sx}; y tiene promedio ${my} y DE ${sy}; r = ${r}. Con la recta de regresión, ¿cuál es la y predicha para alguien con x = ${fmt(x)}?`),
    e: L3(`先转标准单位：x_su = (${fmt(x)} − ${mx}) / ${sx} = ${zx}。预测 y_su = r × x_su = ${r} × ${zx} = ${fmt(r * zx)}。换回原单位：${my} + ${fmt(r * zx)} × ${sy} = ${fmt(pred)}。注意预测值比 x 更靠近平均（regression to the mean）。`,
      `Convert to standard units: x_su = (${fmt(x)} − ${mx}) / ${sx} = ${zx}. Predicted y_su = r × x_su = ${r} × ${zx} = ${fmt(r * zx)}. Back to original units: ${my} + ${fmt(r * zx)} × ${sy} = ${fmt(pred)}. The prediction is closer to average than x is (regression to the mean).`,
      `En unidades estándar: x_su = (${fmt(x)} − ${mx}) / ${sx} = ${zx}. y_su predicha = r × x_su = ${r} × ${zx} = ${fmt(r * zx)}. En unidades originales: ${my} + ${fmt(r * zx)} × ${sy} = ${fmt(pred)}. La predicción está más cerca del promedio que x (regresión a la media).`)};
}},
{id:'g-slope', t:['regression'], d:2, make() {
  const r = R.pick([0.3, 0.5, 0.6, 0.8, -0.4]); const sx = R.pick([2, 4, 5, 10]); const sy = R.pick([6, 8, 10, 15, 20]);
  const mx = R.pick([10, 20, 30]); const my = R.pick([50, 100, 120]);
  const slope = r * sy / sx; const icpt = my - slope * mx;
  const given = S2(`r = ${r}, SD of x = ${sx}, SD of y = ${sy}, mean of x = ${mx}, mean of y = ${my}.`, `r = ${r}, DE de x = ${sx}, DE de y = ${sy}, media de x = ${mx}, media de y = ${my}.`);
  if (R.pick(['slope', 'intercept']) === 'slope') {
    const m = numMC(slope, [r * sx / sy, r, sy / sx, r * sy], v => fmt(v, 3));
    return {k:'mc', ...m, q: given + S2(' What is the slope of the regression line in original units?', ' ¿Cuál es la pendiente de la recta de regresión en unidades originales?'),
      e: L3(`slope = r × SD(y) / SD(x) = ${r} × ${sy} / ${sx} = ${fmt(slope, 3)}。平均数不影响斜率。`, `slope = r × SD(y) / SD(x) = ${r} × ${sy} / ${sx} = ${fmt(slope, 3)}. The means do not affect the slope.`, `pendiente = r × DE(y) / DE(x) = ${r} × ${sy} / ${sx} = ${fmt(slope, 3)}. Las medias no afectan la pendiente.`)};
  }
  const m = numMC(icpt, [my - r * mx, my + slope * mx, mx - slope * my, my - (r * sx / sy) * mx], v => fmt(v, 2));
  return {k:'mc', ...m, q: given + S2(' What is the intercept of the regression line in original units?', ' ¿Cuál es el intercepto de la recta de regresión en unidades originales?'),
    e: L3(`slope = ${r} × ${sy}/${sx} = ${fmt(slope, 3)}；intercept = mean(y) − slope × mean(x) = ${my} − ${fmt(slope, 3)} × ${mx} = ${fmt(icpt)}。`,
      `slope = ${r} × ${sy}/${sx} = ${fmt(slope, 3)}; intercept = mean(y) − slope × mean(x) = ${my} − ${fmt(slope, 3)} × ${mx} = ${fmt(icpt)}.`,
      `pendiente = ${r} × ${sy}/${sx} = ${fmt(slope, 3)}; intercepto = media(y) − pendiente × media(x) = ${my} − ${fmt(slope, 3)} × ${mx} = ${fmt(icpt)}.`)};
}},
{id:'g-residsd', t:['residuals'], d:2, make() {
  const [r, s] = R.pick([[0.6, 0.8], [0.8, 0.6], [0.28, 0.96], [-0.6, 0.8], [-0.8, 0.6], [0.96, 0.28]]); const sy = R.pick([5, 10, 15, 20, 25]);
  const ans = s * sy, fit = Math.abs(r) * sy;
  const pre = S2(`The correlation between x and y is ${r} and the SD of y is ${sy}.`, `La correlación entre x e y es ${r} y la DE de y es ${sy}.`);
  if (R.pick(['resid', 'fitted']) === 'resid') {
    const m = numMC(ans, [fit, (1 - r * r) * sy, sy, (1 - Math.abs(r)) * sy], v => fmt(v, 2));
    return {k:'mc', ...m, q: pre + S2(' What is the SD of the residuals from the regression line?', ' ¿Cuál es la DE de los residuos de la recta de regresión?'),
      e: L3(`SD of residuals = √(1 − r²) × SD(y) = √(1 − ${fmt(r * r, 4)}) × ${sy} = ${s} × ${sy} = ${fmt(ans)}。`, `SD of residuals = √(1 − r²) × SD(y) = √(1 − ${fmt(r * r, 4)}) × ${sy} = ${s} × ${sy} = ${fmt(ans)}.`, `DE de los residuos = √(1 − r²) × DE(y) = √(1 − ${fmt(r * r, 4)}) × ${sy} = ${s} × ${sy} = ${fmt(ans)}.`)};
  }
  const m = numMC(fit, [ans, r * r * sy, sy, -fit], v => fmt(v, 2));
  return {k:'mc', ...m, q: pre + S2(' What is the SD of the fitted (predicted) values from the regression line?', ' ¿Cuál es la DE de los valores ajustados (predichos) de la recta de regresión?'),
    e: L3(`SD of fitted values = |r| × SD(y) = ${Math.abs(r)} × ${sy} = ${fmt(fit)}。（SD 不会是负数，所以要取绝对值。）`, `SD of fitted values = |r| × SD(y) = ${Math.abs(r)} × ${sy} = ${fmt(fit)}. An SD is never negative, so use |r|.`, `DE de los valores ajustados = |r| × DE(y) = ${Math.abs(r)} × ${sy} = ${fmt(fit)}. Una DE nunca es negativa, por eso se usa |r|.`)};
}},
{id:'g-tvd', t:['models'], d:2, make() {
  const parts = () => { const a = R.int(2, 12), b = R.int(2, 20 - a - 2); return [a, b, 20 - a - b].map(v => v * 0.05); };
  let p = parts(), q = parts(); while (p.join() === q.join()) q = parts();
  const tvd = p.reduce((s, v, i) => s + Math.abs(v - q[i]), 0) / 2, sum = tvd * 2;
  const m = numMC(tvd, [sum, sum / 3, Math.max(...p.map((v, i) => Math.abs(v - q[i]))), p.reduce((s, v, i) => s + (v - q[i]), 0)], v => fmt(v, 3));
  const show = arr => arr.map(v => fmt(v, 2)).join(', '); const diffs = p.map((v, i) => fmt(Math.abs(v - q[i]), 2)).join(' + ');
  return {k:'mc', ...m, q: S2(`Two categorical distributions over the same three categories are (${show(p)}) and (${show(q)}). What is the total variation distance (TVD) between them?`, `Dos distribuciones categóricas sobre las mismas tres categorías son (${show(p)}) y (${show(q)}). ¿Cuál es la distancia de variación total (TVD) entre ellas?`),
    e: L3(`TVD = ½ × Σ|差|。各项差的绝对值：${diffs} = ${fmt(sum, 3)}，乘 ½ 得 ${fmt(tvd, 3)}。不带绝对值求和永远是 0。`, `TVD = ½ × Σ|differences|. Absolute differences: ${diffs} = ${fmt(sum, 3)}; half of that is ${fmt(tvd, 3)}. Without absolute values the sum is always 0.`, `TVD = ½ × Σ|diferencias|. Diferencias absolutas: ${diffs} = ${fmt(sum, 3)}; la mitad es ${fmt(tvd, 3)}. Sin valor absoluto la suma siempre es 0.`)};
}},
{id:'g-atleast', t:['probability'], d:2, make() {
  const p = R.pick([0.1, 0.2, 0.25, 0.3, 0.05]); const n = R.pick([3, 4, 5, 6]);
  const ans = 1 - Math.pow(1 - p, n);
  const m = numMC(ans, [n * p, Math.pow(p, n), 1 - Math.pow(p, n), Math.pow(1 - p, n)], v => fmt(v, 4));
  return {k:'mc', ...m, q: S2(`Each day, independently, the chance that a bus is late is ${p}. What is the chance the bus is late on at least one of ${n} days?`, `Cada día, de forma independiente, la probabilidad de que un autobús llegue tarde es ${p}. ¿Cuál es la probabilidad de que llegue tarde al menos uno de ${n} días?`),
    e: L3(`1 − P(一次都不迟到) = 1 − (1 − ${p})^${n} = 1 − ${fmt(Math.pow(1 - p, n), 4)} = ${fmt(ans, 4)}。直接写 ${n} × ${p} 是错的：这些事件不互斥。`,
      `1 − P(never late) = 1 − (1 − ${p})^${n} = 1 − ${fmt(Math.pow(1 - p, n), 4)} = ${fmt(ans, 4)}. ${n} × ${p} is wrong because the events are not mutually exclusive.`,
      `1 − P(nunca tarde) = 1 − (1 − ${p})^${n} = 1 − ${fmt(Math.pow(1 - p, n), 4)} = ${fmt(ans, 4)}. ${n} × ${p} es incorrecto porque los eventos no son mutuamente excluyentes.`)};
}},
{id:'g-bayes', t:['bayes'], d:3, make() {
  const prior = R.pick([0.01, 0.02, 0.05, 0.1]); const sens = R.pick([0.9, 0.95, 0.99]); const fpr = R.pick([0.05, 0.1, 0.2]);
  const num = prior * sens, den = num + (1 - prior) * fpr, post = num / den;
  const m = numMC(post, [sens, 1 - fpr, num, prior], v => fmt(v, 3));
  return {k:'mc', ...m,
    q: S2(`${pct(prior, 0)} of laptops in a batch are defective. A diagnostic flags ${pct(sens, 0)} of defective laptops and ${pct(fpr, 0)} of working laptops. A randomly chosen laptop is flagged. What is the chance it is defective?`,
      `El ${pct(prior, 0)} de las laptops de un lote están defectuosas. Un diagnóstico marca el ${pct(sens, 0)} de las defectuosas y el ${pct(fpr, 0)} de las que funcionan. Una laptop elegida al azar sale marcada. ¿Cuál es la probabilidad de que esté defectuosa?`),
    e: L3(`树形图：缺陷且被标记 = ${prior} × ${sens} = ${fmt(num, 4)}；正常但被标记 = ${fmt(1 - prior, 2)} × ${fpr} = ${fmt((1 - prior) * fpr, 4)}。posterior = ${fmt(num, 4)} / ${fmt(den, 4)} ≈ ${fmt(post, 3)}。先验很小时，阳性里很多是假阳性（base rate）。`,
      `Tree diagram: defective and flagged = ${prior} × ${sens} = ${fmt(num, 4)}; working but flagged = ${fmt(1 - prior, 2)} × ${fpr} = ${fmt((1 - prior) * fpr, 4)}. Posterior = ${fmt(num, 4)} / ${fmt(den, 4)} ≈ ${fmt(post, 3)}. When the prior is small, many flags are false positives (base rate).`,
      `Diagrama de árbol: defectuosa y marcada = ${prior} × ${sens} = ${fmt(num, 4)}; funciona pero marcada = ${fmt(1 - prior, 2)} × ${fpr} = ${fmt((1 - prior) * fpr, 4)}. Posterior = ${fmt(num, 4)} / ${fmt(den, 4)} ≈ ${fmt(post, 3)}. Con un prior pequeño, muchas marcas son falsos positivos (tasa base).`)};
}},
{id:'g-pval', t:['hyptest'], d:2, make() {
  const sims = 10000; const k = R.pick([12, 30, 80, 150, 240, 420, 700, 1100]); const p = k / sims; const cut = R.pick([0.05, 0.01]);
  const rej = p < cut, P = fmt(p, 4), C = cut * 100;
  const opts = LANG === 'es' ? [`p ≈ ${P}; rechazar la hipótesis nula al umbral de ${C}%`, `p ≈ ${P}; no rechazar la hipótesis nula al umbral de ${C}%`, `p ≈ ${fmt(1 - p, 4)}; rechazar la hipótesis nula al umbral de ${C}%`, `p ≈ ${P}; aceptar la hipótesis nula`]
    : [`p ≈ ${P}; reject the null hypothesis at the ${C}% cutoff`, `p ≈ ${P}; fail to reject the null hypothesis at the ${C}% cutoff`, `p ≈ ${fmt(1 - p, 4)}; reject the null hypothesis at the ${C}% cutoff`, `p ≈ ${P}; accept the null hypothesis`];
  return {k:'mc', c:opts, a: rej ? 0 : 1, fixed:true,
    q: S2(`Under the null hypothesis, a test statistic was simulated 10,000 times. ${k} of the simulated values were greater than or equal to the observed statistic, and large values favor the alternative. Which is correct?`,
      `Bajo la hipótesis nula, un estadístico de prueba se simuló 10,000 veces. ${k} de los valores simulados fueron mayores o iguales que el observado, y los valores grandes favorecen la alternativa. ¿Qué es correcto?`),
    e: L3(`p 值 = ${k} / ${sims} = ${P}。${rej ? `${P} < ${cut} → reject the null，数据更支持备择。` : `${P} ≥ ${cut} → fail to reject the null，数据与零假设一致。`} 永远不说 “accept the null”。`,
      `p-value = ${k} / ${sims} = ${P}. ${rej ? `${P} < ${cut}, so reject the null; the data favor the alternative.` : `${P} ≥ ${cut}, so fail to reject the null; the data are consistent with the null.`} Never say "accept the null".`,
      `valor p = ${k} / ${sims} = ${P}. ${rej ? `${P} < ${cut}: se rechaza la nula; los datos favorecen la alternativa.` : `${P} ≥ ${cut}: no se rechaza la nula; los datos son consistentes con la nula.`} Nunca se dice "aceptar la nula".`)};
}},
{id:'g-citest', t:['ci','hyptest'], d:2, make() {
  const lo = R.int(20, 60); const hi = lo + R.int(3, 10); const level = R.pick([95, 99]);
  const inside = R.rand() < 0.5; const v = inside ? R.int(lo + 1, hi - 1) : R.pick([lo - R.int(1, 4), hi + R.int(1, 4)]);
  const cut = 100 - level;
  const c = LANG === 'es' ? [`Rechazar la nula al umbral de ${cut}%`, `No rechazar la nula al umbral de ${cut}%`, `Aceptar la nula al umbral de ${cut}%`, 'Un IC no sirve para probar una hipótesis']
    : [`Reject the null at the ${cut}% cutoff`, `Fail to reject the null at the ${cut}% cutoff`, `Accept the null at the ${cut}% cutoff`, 'A CI cannot be used to test a hypothesis'];
  return {k:'mc', c, a: inside ? 1 : 0, fixed:true,
    q: S2(`A ${level}% bootstrap confidence interval for a population mean is (${lo}, ${hi}). Null: the population mean is ${v}. Alternative: it is not ${v}. What is the conclusion?`,
      `Un intervalo de confianza bootstrap del ${level}% para la media poblacional es (${lo}, ${hi}). Nula: la media es ${v}. Alternativa: no es ${v}. ¿Cuál es la conclusión?`),
    e: L3(`${level}% 置信区间对应 ${cut}% 的 p-value cutoff（双侧）。${v} ${inside ? '在' : '不在'}区间 (${lo}, ${hi}) 里 → ${inside ? 'fail to reject the null' : 'reject the null'}。`,
      `A ${level}% CI matches a ${cut}% p-value cutoff (two-sided). ${v} is ${inside ? 'inside' : 'outside'} (${lo}, ${hi}), so ${inside ? 'fail to reject' : 'reject'} the null.`,
      `Un IC del ${level}% corresponde a un umbral de ${cut}% (bilateral). ${v} está ${inside ? 'dentro de' : 'fuera de'} (${lo}, ${hi}), así que ${inside ? 'no se rechaza' : 'se rechaza'} la nula.`)};
}},
{id:'g-knn', t:['classification'], d:1, make() {
  const labels = Array.from({length: 9}, () => R.pick(['Spam', 'Ham']));
  const k = R.pick([1, 3, 5, 7, 9]);
  const top = labels.slice(0, k); const s = top.filter(x => x === 'Spam').length;
  const pred = s > k - s ? 'Spam' : 'Ham';
  return {k:'mc', c:['Spam', 'Ham'], a: pred === 'Spam' ? 0 : 1, fixed:true,
    q: S2(`The 9 training emails closest to a new email, from nearest to farthest, are labeled: ${labels.join(', ')}. What does a ${k}-nearest-neighbor classifier predict?`, `Los 9 correos de entrenamiento más cercanos a uno nuevo, del más cercano al más lejano, tienen etiquetas: ${labels.join(', ')}. ¿Qué predice un clasificador de ${k} vecinos más cercanos?`),
    e: L3(`取最近的 ${k} 个：${top.join(', ')}。Spam ${s} 票，Ham ${k - s} 票 → 预测 ${pred}。`, `Take the nearest ${k}: ${top.join(', ')}. Spam has ${s} votes and Ham has ${k - s}, so the prediction is ${pred}.`, `Se toman los ${k} más cercanos: ${top.join(', ')}. Spam tiene ${s} votos y Ham ${k - s}, así que la predicción es ${pred}.`)};
}},
{id:'g-normalpct', t:['normal'], d:2, make() {
  const mean = R.pick([100, 500, 70]); const sd = R.pick([10, 15, 100, 5]);
  const cases = [
    {lab: S2(`above ${mean + 2 * sd}`, `por encima de ${mean + 2 * sd}`), v:0.025, e: L3('±2 SD 内约 95%，剩下 5% 平分到两边，上面约 2.5%。', 'About 95% is within ±2 SDs; the other 5% splits evenly, so about 2.5% is above.', 'Cerca del 95% está a ±2 DE; el 5% restante se reparte en dos colas, así que arriba queda cerca del 2.5%.')},
    {lab: S2(`below ${mean - sd}`, `por debajo de ${mean - sd}`), v:0.16, e: L3('±1 SD 内约 68%，剩下 32% 平分，下面约 16%。', 'About 68% is within ±1 SD; the other 32% splits evenly, so about 16% is below.', 'Cerca del 68% está a ±1 DE; el 32% restante se reparte, así que abajo queda cerca del 16%.')},
    {lab: S2(`between ${mean - sd} and ${mean + 2 * sd}`, `entre ${mean - sd} y ${mean + 2 * sd}`), v:0.815, e: L3('平均到 −1 SD 约 34%，平均到 +2 SD 约 47.5%，合计约 81.5%。', 'From −1 SD to the mean is about 34%, and from the mean to +2 SDs about 47.5%; together about 81.5%.', 'De −1 DE a la media hay cerca del 34%, y de la media a +2 DE cerca del 47.5%; en total cerca del 81.5%.')},
    {lab: S2(`above ${mean}`, `por encima de ${mean}`), v:0.5, e: L3('正态分布对称，平均数以上约 50%。', 'The normal curve is symmetric, so about 50% is above the mean.', 'La curva normal es simétrica, así que cerca del 50% está por encima de la media.')},
  ];
  const c = R.pick(cases);
  const m = numMC(c.v, [0.05, 0.32, 0.68, 0.95, 0.025, 0.16, 0.815, 0.5].filter(x => x !== c.v), v => pct(v, 1));
  return {k:'mc', ...m, q: S2(`Scores are roughly normally distributed with mean ${mean} and SD ${sd}. About what percent of scores are ${c.lab}?`, `Los puntajes siguen aproximadamente una distribución normal con media ${mean} y DE ${sd}. ¿Qué porcentaje aproximado de puntajes está ${c.lab}?`),
    e: L3('标准化后用 68–95–99.7 规则。', 'Convert to standard units and use the 68–95–99.7 rule. ', 'Pasa a unidades estándar y usa la regla 68–95–99.7. ') + c.e};
}},
];
