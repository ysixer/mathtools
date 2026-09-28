import { Stage } from '/shared/stage.js';
import { snap } from '/shared/geometry.js';
import { $, num, coef, setText, setHTML, status, check, onSlider, onClick, loop, mountNav } from '/shared/ui.js';

mountNav();
let a = 1, b = -2, c = -3, g = {};
const term = (k, pow, first) => {
  if (Math.abs(k) < 1e-9) return '';
  const sign = k < 0 ? (first ? '−' : ' − ') : (first ? '' : ' + ');
  const v = Math.abs(k), body = pow === 0 ? coef(v) : (Math.abs(v - 1) < 1e-9 ? '' : coef(v)) + (pow === 2 ? '<i>x</i>²' : '<i>x</i>');
  return sign + body;
};
const poly = () => { let s = term(a, 2, true); s += term(b, 1, !s); s += term(c, 0, !s); return s || '0'; };

const stage = new Stage($('#cv'), {
  axes: {},
  bounds: () => [{ x: -5, y: -5 }, { x: 5, y: 5 }],
  onGrab: () => anim.stop(),
  drag: (k, p) => {
    if (Math.abs(a) < 1e-9) return;
    const px = snap(p.x, 0.1), qy = snap(p.y, 0.1);
    b = +(-2 * a * px).toFixed(2); c = +(a * px * px + qy).toFixed(2);
    sb.set(b); sc.set(c);
  },
  draw: d => {
    const D = b * b - 4 * a * c, lin = Math.abs(a) < 1e-9;
    const p = lin ? NaN : -b / (2 * a), q = lin ? NaN : c - b * b / (4 * a);
    let roots = [];
    if (lin) { if (Math.abs(b) > 1e-9) roots = [-c / b]; }
    else if (Math.abs(D) < 1e-9) roots = [p];
    else if (D > 0) { const s = Math.sqrt(D); roots = [(-b - s) / (2 * a), (-b + s) / (2 * a)].sort((x, y) => x - y); }
    g = { D, lin, p, q, roots };
    let s = '';
    if (!lin) s += d.infLine({ x: p, y: 0 }, { x: 0, y: 1 }, 'ln-muted dash');
    s += d.fn(x => a * x * x + b * x + c, 'ln-b');
    s += d.dot({ x: 0, y: c }, 4.5, 'pt-ink') + d.text({ x: 0, y: c }, `(0, ${coef(c)})`, 'note', 34, 0);
    for (const r of roots) s += d.dot({ x: r, y: 0 }, 6, 'pt-acc') + d.text({ x: r, y: 0 }, `x = ${num(r)}`, 'val t-acc', 0, a > 0 ? 18 : -18);
    if (!lin) s += d.handle('V', { x: p, y: q }, { cls: 'pt-q', label: `(${num(p)}, ${num(q)})`, lcls: 't-q val', dirS: { x: 0, y: a > 0 ? 1 : -1 }, dist: 22 });
    return s;
  },
  after: () => {
    setHTML('eq', `<span class="m">y</span> = ${poly()}`);
    const { D, lin, p, q, roots } = g;
    if (lin) {
      setText('vStd', '–'); setText('vV', '–'); setText('vD', '–'); setText('vRoots', roots.length ? num(roots[0]) : '없음'); setText('vN', roots.length + '개');
      ['c1', 'c2', 'c3'].forEach(id => check(id, false));
      status('status', 'warn', 'a = 0이면 이차함수가 아니라 일차함수(직선)예요. 판별식을 쓸 수 없습니다.');
      return;
    }
    const sgn = Math.abs(D) < 1e-9 ? 0 : Math.sign(D);
    const inner = Math.abs(p) < 1e-9 ? 'x²' : `(x ${p > 0 ? '−' : '+'} ${coef(Math.abs(p))})²`;
    setText('vStd', `y = ${Math.abs(a - 1) < 1e-9 ? '' : Math.abs(a + 1) < 1e-9 ? '−' : coef(a)}${inner}${Math.abs(q) < 1e-9 ? '' : ` ${q > 0 ? '+' : '−'} ${coef(Math.abs(q))}`}`);
    setText('vV', `(${num(p)}, ${num(q)})`); setText('vD', num(D));
    setText('vRoots', sgn > 0 ? `${num(roots[0])}, ${num(roots[1])}` : sgn === 0 ? `${num(p)} (중근)` : `${num(p)} ± ${num(Math.sqrt(-D) / (2 * Math.abs(a)))}i`);
    setText('vN', (sgn > 0 ? 2 : sgn === 0 ? 1 : 0) + '개');
    check('c1', sgn > 0); check('c2', sgn === 0); check('c3', sgn < 0);
    status('status', sgn === 0 ? 'info' : 'ok', sgn > 0 ? `D = ${num(D)} > 0: 포물선이 x축을 두 번 가로지릅니다.` : sgn === 0 ? '꼭짓점이 정확히 x축 위에 있어요. D = 0, 중근입니다.' : `D = ${num(D)} < 0: 포물선이 x축과 만나지 않아요. 실근이 없습니다.`);
  },
});

const sa = onSlider('a', v => { a = v; stage.request(); }, v => coef(v));
const sb = onSlider('b', v => { b = v; stage.request(); }, v => coef(v));
const sc = onSlider('c', v => { c = v; stage.request(); }, v => coef(v));
const preset = (A, B, C) => { anim.stop(); a = A; b = B; c = C; sa.set(A); sb.set(B); sc.set(C); stage.request(); };
onClick('p2', () => preset(1, -2, -3)); onClick('p1', () => preset(1, -2, 1)); onClick('p0', () => preset(1, -2, 3));
let t = 0, base = null;
const anim = loop(dt => {
  if (base == null) base = c;
  t += dt / 1000; c = +(base + 3 * Math.sin(t * 1.4)).toFixed(2); sc.set(c); stage.render();
}, 'play', ['▶ 위아래로 움직이기', '❚❚ 멈추기']);
document.getElementById('play').addEventListener('click', () => { if (anim.running) { base = c; t = 0; } });
