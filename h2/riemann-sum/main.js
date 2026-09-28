import { Stage } from '/shared/stage.js';
import { snap } from '/shared/geometry.js';
import { $, num, setText, status, onSeg, onSlider, onToggle, onClick, loop, mountNav } from '/shared/ui.js';

mountNav();
const FN = [
  { f: x => x * x, F: x => x ** 3 / 3 },
  { f: x => x ** 3 / 4 - x + 1, F: x => x ** 4 / 16 - x * x / 2 + x },
  { f: x => x * x - 2, F: x => x ** 3 / 3 - 2 * x },
];
let fi = 0, a = 0, b = 2, n = 6, rule = 'left', area = true;
const off = { left: 0, right: 1, mid: 0.5 };
const sum = k => { const { f } = FN[fi], dx = (b - a) / k; let s = 0; for (let i = 0; i < k; i++) s += f(a + (i + off[rule]) * dx) * dx; return s; };

const stage = new Stage($('#cv'), {
  axes: {},
  lockAspect: false,
  bounds: () => {
    const { f } = FN[fi]; let lo = 0, hi = 0;
    for (let i = 0; i <= 60; i++) { const y = f(a - 0.5 + (b - a + 1) * i / 60); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    return [{ x: Math.min(a, 0) - 0.5, y: lo - 0.3 }, { x: Math.max(b, 0) + 0.5, y: hi + 0.3 }];
  },
  onGrab: () => anim.stop(),
  drag: (k, p) => {
    const x = snap(p.x, 0.1);
    if (k === 'a') a = Math.min(x, b - 0.1); else b = Math.max(x, a + 0.1);
  },
  draw: d => {
    const { f } = FN[fi], dx = (b - a) / n;
    let s = '';
    if (area) {
      const pts = [{ x: a, y: 0 }]; for (let i = 0; i <= 120; i++) { const x = a + (b - a) * i / 120; pts.push({ x, y: f(x) }); } pts.push({ x: b, y: 0 });
      s += d.poly(pts, 'fl-q');
    }
    for (let i = 0; i < n; i++) {
      const x0 = a + i * dx, h = f(x0 + off[rule] * dx), cls = h >= 0 ? 'b' : 'acc';
      const r = [{ x: x0, y: 0 }, { x: x0 + dx, y: 0 }, { x: x0 + dx, y: h }, { x: x0, y: h }];
      s += d.poly(r, 'fl-' + cls) + (n <= 80 ? d.poly(r, `ln-${cls} thin`) : '');
      if (n <= 24) s += d.dot({ x: x0 + off[rule] * dx, y: h }, 3, 'pt-ink');
    }
    s += d.fn(f, 'ln');
    s += d.handle('a', { x: a, y: 0 }, { cls: 'pt-acc', label: 'a', lcls: 't-acc', dirS: { x: 0, y: 1 } });
    s += d.handle('b', { x: b, y: 0 }, { cls: 'pt-acc', label: 'b', lcls: 't-acc', dirS: { x: 0, y: 1 } });
    return s;
  },
  after: () => {
    const { F } = FN[fi], I = F(b) - F(a), Sn = sum(n), e1 = Math.abs(Sn - I), e2 = Math.abs(sum(2 * n) - I);
    setText('vAB', `[${num(a, 1)}, ${num(b, 1)}]`); setText('vSn', num(Sn, 5)); setText('vI', num(I, 5)); setText('vErr', num(e1, 5));
    setText('vRatio', e1 < 1e-10 ? '–' : `× ${num(e2 / e1, 3)}`);
    status('status', e1 < 1e-3 ? 'info' : 'ok', e1 < 1e-3 ? `n = ${n}에서 오차가 0.001보다 작아졌어요. 직사각형이 곡선 아래 영역을 거의 빈틈없이 채웁니다.`
      : `n = ${n}일 때 오차 ${num(e1, 4)}. n을 키울수록 S_n이 ${num(I, 4)}에 다가갑니다.`);
  },
});

const sn = onSlider('n', v => { n = v; stage.request(); }, v => String(v));
let acc = 0;
const anim = loop(dt => { acc += dt; if (acc < 90) return; acc = 0; n = n >= 200 ? 1 : Math.min(200, n < 20 ? n + 1 : Math.round(n * 1.12)); sn.set(n); stage.render(); }, 'play', ['▶ n 키우기', '❚❚ 멈추기']);
onSeg('fn', v => { fi = +v; stage.refit(); });
onSeg('rule', v => { rule = v; stage.request(); });
area = onToggle('tArea', v => { area = v; stage.request(); });
onClick('reset', () => { anim.stop(); a = 0; b = 2; n = 6; sn.set(6); stage.refit(); });
