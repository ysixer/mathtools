import { Stage } from '/shared/stage.js';
import { clamp } from '/shared/geometry.js';
import { $, num, setText, status, onSeg, onToggle, onClick, loop, mountNav } from '/shared/ui.js';

mountNav();
const FN = [
  { f: x => x * x - 1, df: x => 2 * x },
  { f: x => x ** 3 - 3 * x, df: x => 3 * x * x - 3 },
  { f: x => -x * x + 2 * x + 2, df: x => -2 * x + 2 },
];
let fi = 0, a = 1, h = 1.2, tan = true, der = false;

const stage = new Stage($('#cv'), {
  axes: {},
  bounds: () => [{ x: -3, y: -3.5 }, { x: 3, y: 4 }],
  onGrab: () => anim.stop(),
  drag: (k, p) => {
    if (k === 'P') a = clamp(p.x, -4, 4);
    else { const nh = p.x - a; h = Math.abs(nh) < 0.02 ? (nh < 0 ? -0.02 : 0.02) : nh; }
  },
  draw: d => {
    const { f, df } = FN[fi], P = { x: a, y: f(a) }, Q = { x: a + h, y: f(a + h) }, R = { x: a + h, y: f(a) };
    const m = (Q.y - P.y) / h;
    let s = '';
    if (der) s += d.fn(df, 'ln-q dash') + d.dot({ x: a, y: df(a) }, 5.5, 'pt-q') + d.text({ x: a, y: df(a) }, `f′(a) = ${num(df(a))}`, 'note t-q', 0, 18);
    s += d.fn(f, 'ln');
    s += d.infLine(P, { x: 1, y: m }, 'ln-c');
    if (tan) s += d.infLine(P, { x: 1, y: df(a) }, 'ln-acc');
    s += d.line(P, R, 'ln-c dash thin') + d.line(R, Q, 'ln-c dash thin');
    if (Math.abs(h) * stage.v.sx > 30) s += d.text({ x: a + h / 2, y: P.y }, 'Δx', 'note t-c', 0, Q.y >= P.y ? 12 : -12);
    if (Math.abs(Q.y - P.y) * stage.v.sy > 24) s += d.text({ x: a + h, y: (P.y + Q.y) / 2 }, 'Δy', 'note t-c', h > 0 ? 18 : -18, 0);
    s += d.handle('Q', Q, { cls: 'pt-c', label: 'Q', lcls: 't-c', dirS: { x: h > 0 ? 0.7 : -0.7, y: -0.7 } });
    s += d.handle('P', P, { cls: 'pt-acc', label: 'P', lcls: 't-acc', dirS: { x: h > 0 ? -0.7 : 0.7, y: -0.7 } });
    return s;
  },
  after: () => {
    const { f, df } = FN[fi], dy = f(a + h) - f(a), avg = dy / h, dv = df(a);
    setText('vA', num(a, 3)); setText('vH', num(h, 4)); setText('vDy', num(dy, 4));
    setText('vAvg', num(avg, 4)); setText('vDer', num(dv, 4)); setText('vDiff', num(Math.abs(avg - dv), 4));
    status('status', Math.abs(h) < 0.01 ? 'info' : 'ok', Math.abs(h) < 0.01
      ? `h가 거의 0이라 할선과 접선이 겹쳤어요. 평균변화율 → f′(${num(a)}) = ${num(dv, 3)}`
      : `h = ${num(h, 3)}일 때 할선의 기울기는 ${num(avg, 3)}. h를 줄이면 ${num(dv, 3)}에 다가갑니다.`);
  },
});

const anim = loop(dt => { h *= Math.exp(-dt / 700); if (Math.abs(h) < 0.001) { h = Math.sign(h) * 0.001; stage.render(); return false; } stage.render(); }, 'shrink', ['Q를 P로 (h → 0)', '❚❚ 멈추기']);
onSeg('fn', v => { fi = +v; stage.request(); });
tan = onToggle('tTan', v => { tan = v; stage.request(); });
der = onToggle('tDer', v => { der = v; stage.request(); });
onClick('open', () => { anim.stop(); h = 1.2; stage.request(); });
