import { Stage } from '/shared/stage.js';
import { V, TAU, D2R, mod, snap } from '/shared/geometry.js';
import { $, num, deg, setText, status, bar, onToggle, onClick, mountNav } from '/shared/ui.js';

mountNav();
const O = { x: 0, y: 0 };
let r = 2, tA = 0, x = 110 * D2R, snapOn = true;   // x: 중심각 (A에서 반시계로 B까지)

const stage = new Stage($('#cv'), {
  bounds: () => [{ x: -r, y: -r }, { x: r, y: r }],
  drag: (k, p) => {
    if (k === 'R') { const l = Math.max(0.4, V.len(p)); r = snapOn ? Math.round(l * 10) / 10 : l; return; }
    let t = V.ang(p);
    if (k === 'A') { tA = snapOn ? snap(t, 5 * D2R) : t; return; }
    let nx = mod(t - tA);
    if (snapOn) nx = snap(nx, 5 * D2R);
    if (nx < 1e-6) nx = x > Math.PI ? TAU : 0.0001;
    x = nx;
  },
  draw: d => {
    const A = V.mul(V.dir(tA), r), B = V.mul(V.dir(tA + x), r);
    let s = d.sectorW(O, r, tA, x, 'fl-q');
    s += d.ring('R', O, r) + d.circle(O, r, 'ln');
    s += d.arcW(O, r, tA, x, 'ln-b thick');
    s += d.line(O, A) + d.line(O, B);
    s += d.sectorPx(O, 30, tA, x, 'wd-acc');
    s += d.labelAt(O, tA + x / 2, deg(x, 0), 'val t-acc', 48);
    s += d.labelAt(O, tA + x / 2, 'l = ' + num(r * x), 'note t-b', r * stage.v.sx + 28);
    s += d.dot(O, 4, 'pt-ink') + d.labelAt(O, tA + x / 2 + Math.PI, 'O', 'lbl', 16);
    s += d.handle('A', A, { label: 'A', dirS: { x: Math.cos(tA), y: -Math.sin(tA) } });
    s += d.handle('B', B, { label: 'B', dirS: { x: Math.cos(tA + x), y: -Math.sin(tA + x) } });
    return s;
  },
  after: () => {
    const f = x / TAU;
    setText('vX', deg(x)); setText('vR', num(r));
    setText('vL', num(r * x)); setText('vS', num(r * r * x / 2)); setText('vHalf', num(0.5 * r * (r * x)));
    for (const i of [1, 2, 3]) { bar('b' + i, f); setText('p' + i, (f * 100).toFixed(1) + '%'); }
    status('status', 'ok', `중심각이 원 전체의 ${(f * 100).toFixed(1)}%이면 호의 길이와 넓이도 각각 원 전체의 ${(f * 100).toFixed(1)}%예요.`);
  },
});

snapOn = onToggle('tSnap', v => { snapOn = v; });
for (const a of [60, 90, 180, 270]) onClick('a' + a, () => { x = a * D2R; stage.request(); });
