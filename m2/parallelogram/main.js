import { Stage } from '/shared/stage.js';
import { V, angleAt, segmentsCross, R2D } from '/shared/geometry.js';
import { $, num, deg, setText, status, check, onToggle, onClick, mountNav } from '/shared/ui.js';

mountNav();
let P = { A: { x: -2, y: -1 }, B: { x: 1.4, y: -1.1 }, C: { x: 2.3, y: 1.2 }, D: { x: -1.4, y: 1 } };
let keep = false, g = {};

const TOL = 0.012;
const par = (a, b, c, d) => Math.abs(V.cross(V.norm(V.sub(b, a)), V.norm(V.sub(d, c)))) < TOL;
const eq = (x, y) => Math.abs(x - y) / Math.max(x, y) < TOL;
function compute() {
  const { A, B, C, D } = P;
  const simple = !segmentsCross(A, B, C, D) && !segmentsCross(B, C, D, A);
  const L = { AB: V.dist(A, B), DC: V.dist(D, C), AD: V.dist(A, D), BC: V.dist(B, C) };
  const ang = { A: angleAt(A, D, B), B: angleAt(B, A, C), C: angleAt(C, B, D), D: angleAt(D, C, A) };
  const m1 = V.mid(A, C), m2 = V.mid(B, D), diag = (V.dist(A, C) + V.dist(B, D)) / 2;
  const p1 = par(A, B, D, C), p2 = par(A, D, B, C);
  const k = [p1 && p2, eq(L.AB, L.DC) && eq(L.AD, L.BC), Math.abs(ang.A - ang.C) * R2D < 0.7 && Math.abs(ang.B - ang.D) * R2D < 0.7,
    V.dist(m1, m2) / diag < TOL, p1 && eq(L.AB, L.DC)].map(v => simple && v);
  const right = Object.values(ang).every(a => Math.abs(a * R2D - 90) < 0.7);
  const rhomb = eq(L.AB, L.BC) && eq(L.BC, L.DC) && eq(L.DC, L.AD);
  return { simple, L, ang, m1, m2, k, right, rhomb, md: V.dist(m1, m2) };
}

const stage = new Stage($('#cv'), {
  bounds: () => Object.values(P),
  drag: (k, p) => {
    P[k] = p;
    if (!keep) return;
    if (k === 'D') P.C = V.add(P.D, V.sub(P.B, P.A)); else P.D = V.add(P.A, V.sub(P.C, P.B));
  },
  draw: d => {
    g = compute();
    const { A, B, C, D } = P;
    let s = d.poly([A, B, C, D], 'fl-ink');
    s += d.line(A, C, 'ln-muted dash') + d.line(B, D, 'ln-muted dash');
    if (g.simple) {
      const o = { A: [D, B], B: [A, C], C: [B, D], D: [C, A] };
      for (const k of 'ABCD') s += d.angle(P[k], o[k][0], o[k][1], 22, k === 'A' || k === 'C' ? 'wd-acc' : 'wd-q', { label: deg(g.ang[k], 0), lcls: k === 'A' || k === 'C' ? 't-acc' : 't-q', right: true, rcls: k === 'A' || k === 'C' ? 'ln-acc' : 'ln-q' });
    }
    s += d.line(A, B, 'ln-b') + d.line(D, C, 'ln-b') + d.line(A, D, 'ln-c') + d.line(B, C, 'ln-c');
    if (g.k[1]) s += d.ticks(A, B, 1, 'ln-b') + d.ticks(D, C, 1, 'ln-b') + d.ticks(A, D, 2, 'ln-c') + d.ticks(B, C, 2, 'ln-c');
    s += d.dot(g.m1, 4.5, 'pt-acc') + d.dot(g.m2, 4.5, 'pt-q');
    const c = V.mul(V.add(V.add(A, B), V.add(C, D)), 0.25);
    for (const k of 'ABCD') s += d.handle(k, P[k], { label: k, away: c });
    return s;
  },
  after: () => {
    g.k.forEach((v, i) => check('k' + (i + 1), v));
    setText('vAB', `${num(g.L.AB)}, ${num(g.L.DC)}`); setText('vAD', `${num(g.L.AD)}, ${num(g.L.BC)}`);
    setText('vAC', `${deg(g.ang.A)}, ${deg(g.ang.C)}`); setText('vBD', `${deg(g.ang.B)}, ${deg(g.ang.D)}`);
    setText('vM', num(g.md));
    const all = g.k.every(Boolean), n = g.k.filter(Boolean).length;
    if (!g.simple) status('status', 'warn', '변이 서로 교차해서 사각형이 아니에요. 꼭짓점 순서를 풀어 주세요.');
    else if (all) status('status', 'ok', g.right && g.rhomb ? '정사각형이에요. 평행사변형이면서 직사각형이자 마름모입니다.'
      : g.right ? '직사각형이에요. 평행사변형의 특별한 경우입니다.' : g.rhomb ? '마름모예요. 평행사변형의 특별한 경우입니다.' : '평행사변형이에요. 다섯 조건이 모두 성립합니다.');
    else if (n === 0) status('status', 'info', '평행사변형이 아니에요. 다섯 조건이 모두 깨져 있습니다.');
    else status('status', 'info', `${n}개 조건이 성립해요. 하나가 더 맞춰지는 순간 전부 켜지는지 지켜보세요.`);
  },
});

keep = onToggle('tKeep', v => { keep = v; if (v) { P.D = V.add(P.A, V.sub(P.C, P.B)); stage.request(); } });
onClick('make', () => { P.D = V.add(P.A, V.sub(P.C, P.B)); stage.refit(); });
onClick('rect', () => {
  const u = V.sub(P.B, P.A), n = V.norm(V.perp(u)), side = Math.sign(V.dot(V.sub(P.C, P.B), n)) || 1;
  P.C = V.add(P.B, V.mul(n, side * (V.dist(P.B, P.C) || 2))); P.D = V.add(P.A, V.sub(P.C, P.B)); stage.refit();
});
onClick('rhom', () => {
  P.C = V.add(P.B, V.mul(V.norm(V.sub(P.C, P.B)), V.dist(P.A, P.B))); P.D = V.add(P.A, V.sub(P.C, P.B)); stage.refit();
});
onClick('rand', () => {
  for (let i = 0; i < 100; i++) {
    const q = [0, 1, 2, 3].map(j => V.mul(V.dir(j * Math.PI / 2 + Math.PI * 1.25 + (Math.random() - 0.5) * 0.9), 1.6 + Math.random() * 1.2));
    P = { A: q[0], B: q[1], C: q[2], D: q[3] };
    if (compute().simple) break;
  }
  stage.refit();
});
