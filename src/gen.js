// Randomized templates: every call produces new numbers, so the same topic never runs dry.
const R = {
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  shuffle: arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
};
const fmt = (x, d = 2) => { const v = Number(x.toFixed(d)); return String(v); };
const pct = (x, d = 1) => fmt(x * 100, d) + '%';
// Build a one-answer MC from a correct value and distractor values (deduped).
function numMC(correct, distractors, show = v => v) {
  const seen = new Set([show(correct)]); const opts = [show(correct)];
  for (const d of distractors) { const s = show(d); if (!seen.has(s) && opts.length < 5) { seen.add(s); opts.push(s); } }
  return { c: opts, a: 0 };
}

const GENS = [
{id:'g-hist', t:['hist'], d:2, make() {
  const w = R.pick([2, 5, 10]); const start = R.pick([0, 10, 20]);
  const h1 = R.pick([1, 2, 3, 4]) / (w === 10 ? 2 : 1), h2 = R.pick([1, 2, 3]) / (w === 10 ? 2 : 1);
  const w2 = w * 2;
  const p1 = h1 * w, p2 = h2 * w2, tot = p1 + p2;
  const unit = R.pick(['minutes', 'dollars', 'inches']);
  const m = numMC(tot, [h1 + h2, p1, p2, tot / 2, h1 * w2 + h2 * w], v => fmt(v, 1) + '%');
  return {k:'mc', ...m,
    q:`A histogram of a variable measured in ${unit} has a bin [${start}, ${start + w}) with height ${fmt(h1)} percent per ${unit.replace(/s$/, '')} and the next bin [${start + w}, ${start + w + w2}) with height ${fmt(h2)} percent per ${unit.replace(/s$/, '')}. What percent of the data are in [${start}, ${start + w + w2})?`,
    e:`面积 = 百分比。第一个 bin：${fmt(h1)} × ${w} = ${fmt(p1, 1)}%；第二个 bin 宽度是 ${w2}：${fmt(h2)} × ${w2} = ${fmt(p2, 1)}%。合计 ${fmt(tot, 1)}%。常见错误是把高度直接相加（${fmt(h1 + h2)}），或忘了两个 bin 宽度不同。`};
}},
{id:'g-hist-height', t:['hist'], d:1, make() {
  const n = R.pick([200, 400, 500]); const w = R.pick([4, 5, 10]); const cnt = R.pick([20, 40, 50, 80, 100]);
  const p = cnt / n * 100, h = p / w;
  const m = numMC(h, [p, cnt / w, h * 10, p * w], v => fmt(v, 2) + ' % per year');
  return {k:'mc', ...m,
    q:`${n} people's ages are shown in a density-scale histogram. ${cnt} of them are in the bin [30, ${30 + w}). What is the height of that bar?`,
    e:`占比 = ${cnt}/${n} = ${fmt(p, 2)}%。高度 = 占比 / 宽度 = ${fmt(p, 2)} / ${w} = ${fmt(h, 2)} % per year。`};
}},
{id:'g-cheb', t:['center'], d:2, make() {
  const z = R.pick([2, 2.5, 3, 4, 5]); const mean = R.pick([50, 60, 72, 100, 140]); const sd = R.pick([4, 5, 8, 10, 12]);
  const ans = 1 - 1 / (z * z);
  const normal = {2:0.95, 2.5:0.9876, 3:0.9973, 4:0.9999, 5:0.9999}[z];
  const m = numMC(ans, [1 / (z * z), 1 - 1 / z, normal, 0.68, 0.75 === ans ? 0.5 : 0.75], v => pct(v, 2));
  m.c.push('Not enough information');
  return {k:'mc', ...m,
    q:`A list of numbers has average ${mean} and SD ${sd}. Nothing is known about the shape of its distribution. What is the smallest possible percent of the numbers between ${fmt(mean - z * sd)} and ${fmt(mean + z * sd)}?`,
    e:`区间是平均 ± ${z} 个 SD（(${fmt(mean + z * sd)} − ${mean}) / ${sd} = ${z}）。分布形状未知 → Chebyshev：至少 1 − 1/${z}² = ${pct(ans, 2)}。正态分布的数字（如 95%）在这里不能用。`};
}},
{id:'g-su', t:['center'], d:1, make() {
  const mean = R.pick([60, 70, 75, 160, 20]); const sd = R.pick([4, 5, 8, 10]); const z = R.pick([-2, -1.5, -0.5, 0.5, 1.25, 1.5, 2.5]);
  const x = mean + z * sd;
  const m = numMC(z, [-z, z * sd, (x - mean), x / sd, z / 10], v => fmt(v, 2));
  return {k:'mc', ...m, q:`The average is ${mean} and the SD is ${sd}. What is ${fmt(x)} in standard units?`,
    e:`z = (${fmt(x)} − ${mean}) / ${sd} = ${fmt(z)}。`};
}},
{id:'g-sdmean', t:['normal'], d:2, make() {
  const sd = R.pick([12, 15, 20, 30, 40]); const n = R.pick([16, 25, 36, 64, 100, 144, 400]);
  const ans = sd / Math.sqrt(n);
  const m = numMC(ans, [sd / n, sd, sd * Math.sqrt(n), sd / Math.sqrt(n / 4)], v => fmt(v, 3));
  return {k:'mc', ...m, q:`A population has SD ${sd}. For random samples of size ${n} drawn with replacement, what is the SD of the sample average?`,
    e:`SD of sample average = 总体 SD / √n = ${sd} / √${n} = ${sd} / ${Math.sqrt(n)} = ${fmt(ans, 3)}。`};
}},
{id:'g-samplesize', t:['normal','ci'], d:3, make() {
  const w = R.pick([0.01, 0.02, 0.04, 0.05, 0.1]); const n = Math.pow(4 * 0.5 / w, 2);
  const m = numMC(n, [Math.pow(2 * 0.5 / w, 2), 4 * 0.5 / w, Math.pow(0.5 / w, 2), n * 4], v => Math.round(v).toLocaleString('en-US'));
  return {k:'mc', ...m,
    q:`A pollster wants a 95% confidence interval for the proportion of voters supporting a measure, with total WIDTH at most ${w}. Using the upper bound 0.5 for the SD of a 0/1 population, what is the smallest sample size that guarantees this?`,
    e:`95% CI 宽度 ≈ 4 × SD / √n ≤ ${w} → √n ≥ 4 × 0.5 / ${w} = ${fmt(4 * 0.5 / w)} → n ≥ ${Math.round(n).toLocaleString('en-US')}。注意是“总宽度”（两边各 2 个 SD），不是半宽。`};
}},
{id:'g-ciwidth', t:['ci','normal'], d:2, make() {
  const W = R.pick([2, 3, 4, 6, 8]); const k = R.pick([2, 3, 4]); const n = R.pick([50, 100, 200]);
  const ans = W / k;
  const m = numMC(ans, [W / (k * k), W * k, W, W / Math.sqrt(k)], v => fmt(v, 3));
  return {k:'mc', ...m,
    q:`A 95% CI for a population mean, built from a random sample of ${n}, has width ${W}. About how wide would the 95% CI be with a sample of ${n * k * k} from the same population?`,
    e:`宽度 ∝ 1/√n。样本量变成 ${k * k} 倍，√${k * k} = ${k}，宽度变成 1/${k}：${W} / ${k} = ${fmt(ans, 3)}。`};
}},
{id:'g-regpred', t:['regression'], d:2, make() {
  const r = R.pick([0.4, 0.5, 0.6, 0.75, -0.5, -0.6]); const mx = R.pick([60, 70, 100]); const sx = R.pick([5, 10, 20]);
  const my = R.pick([50, 80, 200]); const sy = R.pick([4, 8, 12, 30]); const zx = R.pick([-2, -1, 1, 1.5, 2]);
  const x = mx + zx * sx; const pred = my + r * zx * sy;
  const m = numMC(pred, [my + zx * sy, my + r * zx * sx, my - r * zx * sy, my + zx * sy / r], v => fmt(v, 2));
  return {k:'mc', ...m,
    q:`For a set of individuals, x has average ${mx} and SD ${sx}; y has average ${my} and SD ${sy}; r = ${r}. Using the regression line, what is the predicted y for an individual with x = ${fmt(x)}?`,
    e:`先转标准单位：x_su = (${fmt(x)} − ${mx}) / ${sx} = ${zx}。预测 y_su = r × x_su = ${r} × ${zx} = ${fmt(r * zx)}。换回原单位：${my} + ${fmt(r * zx)} × ${sy} = ${fmt(pred)}。注意预测值比 x 更靠近平均（regression to the mean）。`};
}},
{id:'g-slope', t:['regression'], d:2, make() {
  const r = R.pick([0.3, 0.5, 0.6, 0.8, -0.4]); const sx = R.pick([2, 4, 5, 10]); const sy = R.pick([6, 8, 10, 15, 20]);
  const mx = R.pick([10, 20, 30]); const my = R.pick([50, 100, 120]);
  const slope = r * sy / sx; const icpt = my - slope * mx;
  const ask = R.pick(['slope', 'intercept']);
  if (ask === 'slope') {
    const m = numMC(slope, [r * sx / sy, r, sy / sx, r * sy], v => fmt(v, 3));
    return {k:'mc', ...m, q:`r = ${r}, SD of x = ${sx}, SD of y = ${sy}, mean of x = ${mx}, mean of y = ${my}. What is the slope of the regression line in original units?`,
      e:`slope = r × SD(y) / SD(x) = ${r} × ${sy} / ${sx} = ${fmt(slope, 3)}。平均数不影响斜率。`};
  }
  const m = numMC(icpt, [my - r * mx, my + slope * mx, mx - slope * my, my - (r * sx / sy) * mx], v => fmt(v, 2));
  return {k:'mc', ...m, q:`r = ${r}, SD of x = ${sx}, SD of y = ${sy}, mean of x = ${mx}, mean of y = ${my}. What is the intercept of the regression line in original units?`,
    e:`slope = ${r} × ${sy}/${sx} = ${fmt(slope, 3)}；intercept = mean(y) − slope × mean(x) = ${my} − ${fmt(slope, 3)} × ${mx} = ${fmt(icpt)}。`};
}},
{id:'g-residsd', t:['residuals'], d:2, make() {
  const [r, s] = R.pick([[0.6, 0.8], [0.8, 0.6], [0.28, 0.96], [-0.6, 0.8], [-0.8, 0.6], [0.96, 0.28]]); const sy = R.pick([5, 10, 15, 20, 25]);
  const ans = s * sy; const fit = Math.abs(r) * sy;
  const ask = R.pick(['resid', 'fitted']);
  if (ask === 'resid') {
    const m = numMC(ans, [fit, (1 - r * r) * sy, sy, (1 - Math.abs(r)) * sy], v => fmt(v, 2));
    return {k:'mc', ...m, q:`The correlation between x and y is ${r} and the SD of y is ${sy}. What is the SD of the residuals from the regression line?`,
      e:`SD of residuals = √(1 − r²) × SD(y) = √(1 − ${fmt(r * r, 4)}) × ${sy} = ${s} × ${sy} = ${fmt(ans)}。`};
  }
  const m = numMC(fit, [ans, r * r * sy, sy, -fit], v => fmt(v, 2));
  return {k:'mc', ...m, q:`The correlation between x and y is ${r} and the SD of y is ${sy}. What is the SD of the fitted (predicted) values from the regression line?`,
    e:`SD of fitted values = |r| × SD(y) = ${Math.abs(r)} × ${sy} = ${fmt(fit)}。（SD 不会是负数，所以要取绝对值。）`};
}},
{id:'g-tvd', t:['models'], d:2, make() {
  const parts = () => { const a = R.int(2, 12), b = R.int(2, 20 - a - 2); return [a, b, 20 - a - b].map(v => v * 0.05); };
  let p = parts(), q = parts(); while (p.join() === q.join()) q = parts();
  const tvd = p.reduce((s, v, i) => s + Math.abs(v - q[i]), 0) / 2;
  const sum = tvd * 2;
  const m = numMC(tvd, [sum, sum / 3, Math.max(...p.map((v, i) => Math.abs(v - q[i]))), p.reduce((s, v, i) => s + (v - q[i]), 0)], v => fmt(v, 3));
  const show = arr => arr.map(v => fmt(v, 2)).join(', ');
  return {k:'mc', ...m, q:`Two categorical distributions over the same three categories are (${show(p)}) and (${show(q)}). What is the total variation distance (TVD) between them?`,
    e:`TVD = ½ × Σ|差|。各项差的绝对值：${p.map((v, i) => fmt(Math.abs(v - q[i]), 2)).join(' + ')} = ${fmt(sum, 3)}，乘 ½ 得 ${fmt(tvd, 3)}。不带绝对值求和永远是 0。`};
}},
{id:'g-atleast', t:['probability'], d:2, make() {
  const p = R.pick([0.1, 0.2, 0.25, 0.3, 0.05]); const n = R.pick([3, 4, 5, 6]);
  const ans = 1 - Math.pow(1 - p, n);
  const m = numMC(ans, [n * p, Math.pow(p, n), 1 - Math.pow(p, n), Math.pow(1 - p, n)], v => fmt(v, 4));
  return {k:'mc', ...m, q:`Each day, independently, the chance that a bus is late is ${p}. What is the chance the bus is late on at least one of ${n} days?`,
    e:`1 − P(一次都不迟到) = 1 − (1 − ${p})^${n} = 1 − ${fmt(Math.pow(1 - p, n), 4)} = ${fmt(ans, 4)}。直接写 ${n} × ${p} 是错的：这些事件不互斥。`};
}},
{id:'g-bayes', t:['bayes'], d:3, make() {
  const prior = R.pick([0.01, 0.02, 0.05, 0.1]); const sens = R.pick([0.9, 0.95, 0.99]); const fpr = R.pick([0.05, 0.1, 0.2]);
  const num = prior * sens, den = num + (1 - prior) * fpr, post = num / den;
  const m = numMC(post, [sens, 1 - fpr, num, prior], v => fmt(v, 3));
  return {k:'mc', ...m,
    q:`${pct(prior, 0)} of laptops in a batch are defective. A diagnostic flags ${pct(sens, 0)} of defective laptops and ${pct(fpr, 0)} of working laptops. A randomly chosen laptop is flagged. What is the chance it is defective?`,
    e:`树形图：缺陷且被标记 = ${prior} × ${sens} = ${fmt(num, 4)}；正常但被标记 = ${fmt(1 - prior, 2)} × ${fpr} = ${fmt((1 - prior) * fpr, 4)}。posterior = ${fmt(num, 4)} / ${fmt(den, 4)} ≈ ${fmt(post, 3)}。先验很小时，阳性里很多是假阳性（base rate）。`};
}},
{id:'g-pval', t:['hyptest'], d:2, make() {
  const sims = 10000; const k = R.pick([12, 30, 80, 150, 240, 420, 700, 1100]); const p = k / sims; const cut = R.pick([0.05, 0.01]);
  const rej = p < cut;
  const opts = [
    `p ≈ ${fmt(p, 4)}; reject the null hypothesis at the ${cut * 100}% cutoff`,
    `p ≈ ${fmt(p, 4)}; fail to reject the null hypothesis at the ${cut * 100}% cutoff`,
    `p ≈ ${fmt(1 - p, 4)}; reject the null hypothesis at the ${cut * 100}% cutoff`,
    `p ≈ ${fmt(p, 4)}; accept the null hypothesis`,
  ];
  return {k:'mc', c:opts, a: rej ? 0 : 1, fixed:true,
    q:`Under the null hypothesis, a test statistic was simulated ${sims.toLocaleString('en-US')} times. ${k} of the simulated values were greater than or equal to the observed statistic, and large values favor the alternative. Which is correct?`,
    e:`p 值 = ${k} / ${sims} = ${fmt(p, 4)}。${rej ? `${fmt(p, 4)} < ${cut} → reject the null，数据更支持备择。` : `${fmt(p, 4)} ≥ ${cut} → fail to reject the null，数据与零假设一致。`} 永远不说 “accept the null”。`};
}},
{id:'g-citest', t:['ci','hyptest'], d:2, make() {
  const lo = R.int(20, 60); const hi = lo + R.int(3, 10); const level = R.pick([95, 99]);
  const inside = Math.random() < 0.5; const v = inside ? R.int(lo + 1, hi - 1) : R.pick([lo - R.int(1, 4), hi + R.int(1, 4)]);
  const cut = 100 - level;
  return {k:'mc', c:[`Reject the null at the ${cut}% cutoff`, `Fail to reject the null at the ${cut}% cutoff`, `Accept the null at the ${cut}% cutoff`, 'A CI cannot be used to test a hypothesis'], a: inside ? 1 : 0, fixed:true,
    q:`A ${level}% bootstrap confidence interval for a population mean is (${lo}, ${hi}). Null: the population mean is ${v}. Alternative: it is not ${v}. What is the conclusion?`,
    e:`${level}% 置信区间对应 ${cut}% 的 p-value cutoff（双侧）。${v} ${inside ? '在' : '不在'}区间 (${lo}, ${hi}) 里 → ${inside ? 'fail to reject the null' : 'reject the null'}。`};
}},
{id:'g-knn', t:['classification'], d:1, make() {
  const labels = Array.from({length: 9}, () => R.pick(['Spam', 'Ham']));
  const k = R.pick([1, 3, 5, 7, 9]);
  const top = labels.slice(0, k); const s = top.filter(x => x === 'Spam').length;
  const pred = s > k - s ? 'Spam' : 'Ham';
  return {k:'mc', c:['Spam', 'Ham'], a: pred === 'Spam' ? 0 : 1, fixed:true,
    q:`The 9 training emails closest to a new email, from nearest to farthest, are labeled: ${labels.join(', ')}. What does a ${k}-nearest-neighbor classifier predict?`,
    e:`取最近的 ${k} 个：${top.join(', ')}。Spam ${s} 票，Ham ${k - s} 票 → 预测 ${pred}。`};
}},
{id:'g-normalpct', t:['normal'], d:2, make() {
  const mean = R.pick([100, 500, 70]); const sd = R.pick([10, 15, 100, 5]);
  const cases = [
    {lab:`above ${mean + 2 * sd}`, v:0.025, e:'±2 SD 内约 95%，剩下 5% 平分到两边，上面约 2.5%。'},
    {lab:`below ${mean - sd}`, v:0.16, e:'±1 SD 内约 68%，剩下 32% 平分，下面约 16%。'},
    {lab:`between ${mean - sd} and ${mean + 2 * sd}`, v:0.815, e:'平均到 −1 SD 约 34%，平均到 +2 SD 约 47.5%，合计约 81.5%。'},
    {lab:`above ${mean}`, v:0.5, e:'正态分布对称，平均数以上约 50%。'},
  ];
  const c = R.pick(cases);
  const m = numMC(c.v, [0.05, 0.32, 0.68, 0.95, 0.025, 0.16, 0.815, 0.5].filter(x => x !== c.v), v => pct(v, 1));
  return {k:'mc', ...m, q:`Scores are roughly normally distributed with mean ${mean} and SD ${sd}. About what percent of scores are ${c.lab}?`,
    e:`标准化后用 68–95–99.7 规则。${c.e}`};
}},
];
