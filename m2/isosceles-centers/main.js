import { Stage } from '/shared/stage.js';
import { V, angleAt, isDegenerate, circumcenter, incenter, project, intersect, area2, D2R, R2D } from '/shared/geometry.js';
import { $, num, deg, setText, status, show, onSeg, onClick, mountNav } from '/shared/ui.js';

mountNav();
const DEF = { A: { x: -0.5, y: 1.6 }, B: { x: -1.8, y: -1 }, C: { x: 1.7, y: -1 } };
let P = structuredClone(DEF), mode = 'circ', g = {};
const KEYS = ['A', 'B', 'C'];
const opp = k => KEYS.filter(x => x !== k);

function compute() {
  const { A, B, C } = P;
  const bad = isDegenerate(A, B, C);
  const ang = { A: angleAt(A, B, C), B: angleAt(B, C, A), C: angleAt(C, A, B) };
  const side = { AB: V.dist(A, B), BC: V.dist(B, C), CA: V.dist(C, A) };
  // 이등변: 꼭짓점 k에서 만나는 두 변의 길이가 같은가
  let iso = null;
  for (const k of KEYS) { const [u, w] = opp(k); const l1 = V.dist(P[k], P[u]), l2 = V.dist(P[k], P[w]); if (Math.abs(l1 - l2) / Math.max(l1, l2) < 0.004) iso = k; }
  return { bad, ang, side, iso, cc: bad ? null : circumcenter(A, B, C), ic: bad ? null : incenter(A, B, C) };
}

const stage = new Stage($('#cv'), {
  bounds: () => { const c = compute(); const ps = [P.A, P.B, P.C]; if (mode === 'circ' && c.cc && c.cc.r < 12) ps.push({ x: c.cc.c.x - c.cc.r, y: c.cc.c.y - c.cc.r }, { x: c.cc.c.x + c.cc.r, y: c.cc.c.y + c.cc.r }); return ps; },
  drag: (k, p) => { P[k] = p; },
  draw: d => {
    g = compute();
    const { A, B, C } = P;
    let s = d.poly([A, B, C], 'fl-ink');
    if (!g.bad) {
      if (mode === 'circ') {
        const O = g.cc.c;
        s += d.circle(O, g.cc.r, 'ln-b');
        [['A', 'B', 1], ['B', 'C', 2], ['C', 'A', 3]].forEach(([u, w, n]) => {
          const M = V.mid(P[u], P[w]), dir = V.perp(V.sub(P[w], P[u]));
          s += d.infLine(M, dir, 'ln-proof thin dash');
          s += d.right(M, P[w], V.add(M, dir), 9, 'ln-proof');
          s += d.ticks(P[u], M, n, 'ln-proof') + d.ticks(M, P[w], n, 'ln-proof');
        });
        for (const k of KEYS) s += d.line(O, P[k], 'ln-b thin dash');
        s += d.dot(O, 5, 'pt-b') + d.text(O, 'O', 'lbl t-b', 14, -14);
      } else {
        const I = g.ic.c;
        s += d.circle(I, g.ic.r, 'ln-c');
        KEYS.forEach((k, i) => {
          const [u, w] = opp(k), X = P[k];
          const foot = intersect(X, V.sub(I, X), P[u], V.sub(P[w], P[u]));
          if (foot) s += d.line(X, foot, 'ln-proof thin dash');
          s += d.mark(X, P[u], I, 28, i + 1) + d.mark(X, I, P[w], 28, i + 1);
          const F = project(I, P[u], P[w]).pt;
          s += d.line(I, F, 'ln-c thin') + d.right(F, I, P[u], 8, 'ln-c');
        });
        s += d.dot(I, 5, 'pt-c') + d.text(I, 'I', 'lbl t-c', 12, -14);
      }
      if (g.iso) {
        const [u, w] = opp(g.iso), M = V.mid(P[u], P[w]);
        s += d.line(P[g.iso], M, 'ln-acc dash') + d.right(M, P[g.iso], P[w], 10, 'ln-acc');
        s += d.angle(P[u], P[w], P[g.iso], 24, 'wd-acc') + d.angle(P[w], P[g.iso], P[u], 24, 'wd-acc');
        s += d.ticks(P[g.iso], P[u], 2, 'ln-acc') + d.ticks(P[g.iso], P[w], 2, 'ln-acc');
      }
    }
    s += d.line(A, B) + d.line(B, C) + d.line(C, A);
    const G = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
    for (const k of KEYS) s += d.handle(k, P[k], { label: k, away: G });
    return s;
  },
  after: () => {
    show('secCirc', mode === 'circ'); show('secInc', mode === 'inc');
    setText('stmt', mode === 'circ'
      ? '세 변의 수직이등분선은 한 점 O(외심)에서 만나고, O에서 세 꼭짓점까지의 거리는 모두 같습니다.'
      : '세 내각의 이등분선은 한 점 I(내심)에서 만나고, I에서 세 변까지의 거리는 모두 같습니다.');
    if (g.bad) { status('status', 'warn', '세 점이 거의 한 직선 위에 있어요. 꼭짓점을 떨어뜨려 주세요.'); show('isoInfo', false); return; }
    const { A, B, C } = P;
    setText('vAng', `${deg(g.ang.A, 0)}, ${deg(g.ang.B, 0)}, ${deg(g.ang.C, 0)}`);
    setText('vSides', `${num(g.side.AB)}, ${num(g.side.BC)}, ${num(g.side.CA)}`);
    if (mode === 'circ') {
      const O = g.cc.c;
      setText('vOA', num(V.dist(O, A))); setText('vOB', num(V.dist(O, B))); setText('vOC', num(V.dist(O, C))); setText('vR', num(g.cc.r));
      const mx = Math.max(g.ang.A, g.ang.B, g.ang.C) * R2D;
      if (Math.abs(mx - 90) < 0.6) status('status', 'info', '직각삼각형이에요. 외심이 빗변의 중점에 놓입니다.');
      else if (mx < 90) status('status', 'ok', '예각삼각형이라 외심이 삼각형 안에 있어요.');
      else status('status', 'warn', '둔각삼각형이라 외심이 삼각형 밖으로 나갔어요. 그래도 세 꼭짓점까지의 거리는 같습니다.');
    } else {
      const I = g.ic.c, S = Math.abs(area2(A, B, C)) / 2, per = g.side.AB + g.side.BC + g.side.CA;
      const dist = (u, w) => V.dist(I, project(I, P[u], P[w]).pt);
      setText('vI1', num(dist('B', 'C'))); setText('vI2', num(dist('C', 'A'))); setText('vI3', num(dist('A', 'B'))); setText('vr', num(g.ic.r));
      setText('vS', num(S)); setText('vS2', num(0.5 * g.ic.r * per));
      status('status', 'ok', '내심은 삼각형 모양과 관계없이 항상 삼각형 안에 있어요.');
    }
    show('isoInfo', !!g.iso);
    if (g.iso) { const [u, w] = opp(g.iso); setText('isoInfo', `이등변삼각형이에요 (${g.iso}${u} = ${g.iso}${w}). 두 밑각 ∠${u} = ∠${w}이고, 꼭지각의 이등분선이 밑변을 수직이등분하며 외심·내심이 모두 그 위에 있습니다.`); }
  },
});

mode = onSeg('mode', v => { mode = v; stage.refit(); });
const height = () => { const n = V.norm(V.perp(V.sub(P.C, P.B))); return { n, h: V.dot(V.sub(P.A, P.B), n) }; };
onClick('iso', () => { const { n, h } = height(); P.A = V.add(V.mid(P.B, P.C), V.mul(n, h)); stage.refit(); });
onClick('rt', () => { const { n, h } = height(); const u = V.norm(V.sub(P.B, P.C)); P.A = V.add(P.C, V.mul(V.perp(u), Math.sign(V.dot(V.perp(u), n)) * Math.abs(h) || 2)); stage.refit(); });
onClick('obt', () => { const { n, h } = height(); P.A = V.add(V.lerp(P.B, P.C, -0.35), V.mul(n, Math.abs(h) * 0.55 || 1)); stage.refit(); });
onClick('reset', () => { P = structuredClone(DEF); stage.refit(); });
