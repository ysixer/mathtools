import { Stage } from '/shared/stage.js';
import { V, area2, isDegenerate, snap } from '/shared/geometry.js';
import { $, num, setText, status, onToggle, onClick, mountNav } from '/shared/ui.js';

mountNav();
const DEF = { A: { x: -0.5, y: 2 }, B: { x: -2.5, y: -1 }, C: { x: 2.5, y: -1 } };
let P = structuredClone(DEF), six = true, axes = false, g = {};

const stage = new Stage($('#cv'), {
  bounds: () => [P.A, P.B, P.C],
  drag: (k, p) => { P[k] = axes ? V.snap(p, 0.5) : p; },
  draw: d => {
    const { A, B, C } = P;
    const D = V.mid(B, C), E = V.mid(C, A), F = V.mid(A, B);
    const G = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
    const tri = [[A, F], [F, B], [B, D], [D, C], [C, E], [E, A]];
    g = { D, E, F, G, bad: isDegenerate(A, B, C), areas: tri.map(([p, q]) => Math.abs(area2(p, q, G)) / 2), S: Math.abs(area2(A, B, C)) / 2 };
    let s = six ? tri.map(([p, q], i) => d.poly([p, q, G], i % 2 ? 'fl-c' : 'fl-b')).join('') : d.poly([A, B, C], 'fl-ink');
    if (six && !g.bad) tri.forEach(([p, q], i) => { s += d.text({ x: (p.x + q.x + G.x) / 3, y: (p.y + q.y + G.y) / 3 }, num(g.areas[i]), 'note'); });
    for (const [v, m] of [[A, D], [B, E], [C, F]]) s += d.line(v, G, 'ln-acc') + d.line(G, m, 'ln-q');
    s += d.line(A, B) + d.line(B, C) + d.line(C, A);
    s += d.ticks(B, D, 1) + d.ticks(D, C, 1) + d.ticks(C, E, 2) + d.ticks(E, A, 2) + d.ticks(A, F, 3) + d.ticks(F, B, 3);
    for (const [m, n, o] of [[D, 'D', A], [E, 'E', B], [F, 'F', C]]) s += d.dot(m, 4.5, 'pt-q') + d.label(m, n, 'lbl t-q', o, 18);
    s += d.dot(G, 6, 'pt-ink') + d.text(G, 'G', 'lbl', 14, -14);
    for (const k of ['A', 'B', 'C']) s += d.handle(k, P[k], { label: k, away: G });
    return s;
  },
  after: () => {
    const { A, B, C } = P, { D, E, F, G } = g;
    const r = (v, m) => `${num(V.dist(v, G))} : ${num(V.dist(G, m))} = ${num(V.dist(v, G) / V.dist(G, m), 3)}`;
    setText('r1', r(A, D)); setText('r2', r(B, E)); setText('r3', r(C, F));
    setText('vS', num(g.S)); setText('vS6', num(g.S / 6));
    setText('v6', `${num(Math.min(...g.areas))} ~ ${num(Math.max(...g.areas))}`);
    setText('vG', `(${num(G.x)}, ${num(G.y)})`);
    if (g.bad) status('status', 'warn', '세 점이 거의 한 직선 위에 있어요.');
    else status('status', 'ok', `세 중선이 모두 2 : 1로 나뉘고, 여섯 삼각형의 넓이가 모두 ${num(g.S / 6)}로 같습니다.`);
  },
});

stage.o.axes = null;
six = onToggle('tSix', v => { six = v; stage.request(); });
onToggle('tAxes', v => { axes = v; stage.o.axes = v ? {} : null; if (v) for (const k of ['A', 'B', 'C']) P[k] = V.snap(P[k], 0.5); stage.request(); });
onClick('reset', () => { P = structuredClone(DEF); stage.refit(); });
onClick('rand', () => {
  const r = () => V.snap({ x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 4.5 }, 0.5);
  for (let i = 0; i < 200; i++) { const c = { A: r(), B: r(), C: r() }; if (!isDegenerate(c.A, c.B, c.C) && Math.abs(area2(c.A, c.B, c.C)) > 6) { P = c; break; } }
  stage.refit();
});
