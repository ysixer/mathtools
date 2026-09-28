import { Stage } from '/shared/stage.js';
import { V, project, clamp, isDegenerate, snap } from '/shared/geometry.js';
import { $, num, setText, setHTML, status, bar, onToggle, onClick, mountNav } from '/shared/ui.js';

mountNav();
const DEF = { A: { x: -0.6, y: 1.8 }, B: { x: -2.2, y: -1.2 }, C: { x: 2, y: -1.2 } };
let P = structuredClone(DEF), t = 0.4, snapOn = true, g = {};

const stage = new Stage($('#cv'), {
  bounds: () => [P.A, P.B, P.C],
  drag: (k, p) => {
    if (k === 'D') { const tt = clamp(project(p, P.A, P.B).t, 0.03, 0.97); t = snapOn ? clamp(snap(tt, 0.05), 0.05, 0.95) : tt; }
    else P[k] = p;
  },
  draw: d => {
    const { A, B, C } = P, D = V.lerp(A, B, t), E = V.lerp(A, C, t);
    const mid = Math.abs(t - 0.5) < 0.004;
    g = { D, E, mid, bad: isDegenerate(A, B, C) };
    let s = d.poly([A, D, E], 'fl-b') + d.poly([D, B, C, E], 'fl-ink');
    s += d.line(A, D, 'ln-b') + d.line(A, E, 'ln-b') + d.line(D, B, 'ln-c') + d.line(E, C, 'ln-c');
    s += d.line(B, C) + d.line(D, E, 'ln-acc');
    if (mid) s += d.ticks(A, D, 1, 'ln-b') + d.ticks(D, B, 1, 'ln-c') + d.ticks(A, E, 2, 'ln-b') + d.ticks(E, C, 2, 'ln-c');
    const G = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
    s += d.dot(E, 5, 'pt-acc') + d.label(E, mid ? 'N' : 'E', 'lbl t-acc', G, 20);
    for (const k of ['A', 'B', 'C']) s += d.handle(k, P[k], { label: k, away: G });
    s += d.handle('D', D, { label: mid ? 'M' : 'D', lcls: 't-acc', cls: 'pt-acc', away: G, r: 6.5 });
    return s;
  },
  after: () => {
    const { A, B, C } = P, { D, E } = g;
    const ad = V.dist(A, D), db = V.dist(D, B), ae = V.dist(A, E), ec = V.dist(E, C);
    setText('vAD', num(ad)); setText('vDB', num(db)); setText('vAE', num(ae)); setText('vEC', num(ec));
    setHTML('r1', `${num(ad / db, 3)}`); setHTML('r2', `${num(ae / ec, 3)}`);
    setText('vT', num(t, 3)); setText('vDE', num(V.dist(D, E) / V.dist(B, C), 3));
    bar('b1a', t); bar('b1b', 1 - t); bar('b2a', t); bar('b2b', 1 - t);
    setText('p1', `${(t * 100).toFixed(1)}% : ${((1 - t) * 100).toFixed(1)}%`); setText('p2', `${(t * 100).toFixed(1)}% : ${((1 - t) * 100).toFixed(1)}%`);
    if (g.bad) status('status', 'warn', '세 점이 거의 한 직선 위에 있어요.');
    else if (g.mid) status('status', 'ok', `중점연결정리: M, N이 두 변의 중점이면 MN ∥ BC이고 MN = ½BC = ${num(V.dist(B, C) / 2)}입니다.`);
    else status('status', 'ok', `DE ∥ BC이므로 AD : DB = AE : EC = ${num(t, 2)} : ${num(1 - t, 2)}, DE는 BC의 ${num(t, 2)}배예요.`);
  },
});

snapOn = onToggle('tSnap', v => { snapOn = v; });
onClick('half', () => { t = 0.5; stage.request(); });
onClick('third', () => { t = 1 / 3; stage.request(); });
onClick('reset', () => { P = structuredClone(DEF); t = 0.4; stage.refit(); });
