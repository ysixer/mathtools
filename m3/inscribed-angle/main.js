import { Stage } from '/shared/stage.js';
import { V, TAU, D2R, mod, angleAt } from '/shared/geometry.js';
import { $, num, deg, setText, status, bar, show, onToggle, onClick, loop, mountNav } from '/shared/ui.js';

mountNav();
const DEF = { O: { x: 0, y: 0 }, r: 1.5, tA: 200 * D2R, tB: 340 * D2R, tP: 115 * D2R, tQ: 55 * D2R };
let st = structuredClone(DEF), opt = { q: true, proof: false }, g = {};
const on = t => V.add(st.O, V.mul(V.dir(t), st.r));
const near = (t, u) => Math.min(mod(t - u), mod(u - t)) < 0.02;

function compute() {
  const A = on(st.tA), B = on(st.tB), Pp = on(st.tP), Q = on(st.tQ);
  const d = mod(st.tB - st.tA), onAB = t => mod(t - st.tA) < d, pSide = onAB(st.tP);
  return {
    A, B, P: Pp, Q, d, pSide, arc: pSide ? { start: st.tB, len: TAU - d } : { start: st.tA, len: d },
    angP: angleAt(Pp, A, B), angQ: angleAt(Q, A, B),
    pBad: near(st.tP, st.tA) || near(st.tP, st.tB), qBad: near(st.tQ, st.tA) || near(st.tQ, st.tB), abBad: near(st.tA, st.tB),
    qSame: onAB(st.tQ) === pSide, thales: Math.abs(d - Math.PI) < 0.004,
  };
}

const stage = new Stage($('#cv'), {
  bounds: () => [{ x: st.O.x - st.r, y: st.O.y - st.r }, { x: st.O.x + st.r, y: st.O.y + st.r }],
  onGrab: k => { if (k === 'P') anim.stop(); },
  drag: (k, p) => {
    if (k === 'O') st.O = p;
    else if (k === 'R') st.r = Math.max(0.3, V.dist(p, st.O));
    else st['t' + k] = V.ang(V.sub(p, st.O));
  },
  draw: d => {
    g = compute();
    const { O } = st, { A, B, P: Pp, Q } = g;
    let s = d.ring('R', O, st.r) + d.circle(O, st.r, 'ln');
    if (!g.abBad) {
      const am = g.arc.start + g.arc.len / 2, rr = Math.max(16, Math.min(46, st.r * stage.v.sx * 0.3));
      s += d.arcW(O, st.r, g.arc.start, g.arc.len, 'ln-b thick');
      s += d.labelAt(O, am, '호 AB', 'note t-b', st.r * stage.v.sx + 22);
      s += d.line(A, B, 'ln-muted dash');
      s += d.sectorPx(O, rr, g.arc.start, g.arc.len, 'wd-b') + d.line(O, A, 'ln-b') + d.line(O, B, 'ln-b');
      s += d.labelAt(O, am, deg(g.arc.len), 'val t-b', rr + 20);
      if (opt.q && !g.qBad) {
        const rq = Math.max(14, Math.min(30, Math.min(V.dist(Q, A), V.dist(Q, B)) * stage.v.sx * 0.3));
        s += d.line(Q, A, 'ln-q') + d.line(Q, B, 'ln-q') + d.angle(Q, A, B, rq, 'wd-q', { label: deg(g.angQ), lcls: 't-q', gap: 22 });
      }
      if (opt.proof && !g.pBad) {
        const Pp2 = on(st.tP + Math.PI);
        s += d.line(Pp, Pp2, 'ln-proof dash');
        s += d.ticks(O, A, 1, 'ln-proof') + d.ticks(O, B, 1, 'ln-proof') + d.ticks(O, Pp, 1, 'ln-proof');
        s += d.mark(Pp, A, O, 24, 1) + d.mark(A, Pp, O, 24, 1) + d.mark(Pp, B, O, 32, 2) + d.mark(B, Pp, O, 24, 2);
        s += d.dot(Pp2, 4.5, 'pt-proof') + d.labelAt(Pp2, st.tP + Math.PI, 'P′', 'lbl t-proof', 20);
      }
      if (!g.pBad) {
        const rp = Math.max(16, Math.min(36, Math.min(V.dist(Pp, A), V.dist(Pp, B)) * stage.v.sx * 0.3));
        s += d.line(Pp, A, 'ln-acc') + d.line(Pp, B, 'ln-acc') + d.angle(Pp, A, B, rp, 'wd-acc', { label: deg(g.angP), lcls: 't-acc', gap: 24 });
      }
    }
    s += d.handle('O', O, { cls: 'pt-b', r: 5, hit: 16 }) + d.labelAt(O, g.arc.start + g.arc.len / 2 + Math.PI, 'O', 'lbl t-b', 16);
    const h = (k, p, t, cls, lcls) => d.handle(k, p, { label: k, cls, lcls, dirS: { x: Math.cos(t), y: -Math.sin(t) } });
    if (opt.q) s += h('Q', Q, st.tQ, 'pt-q', 't-q');
    s += h('A', A, st.tA, 'pt', '') + h('B', B, st.tB, 'pt', '') + h('P', Pp, st.tP, 'pt-acc', 't-acc');
    return s;
  },
  after: () => {
    const ok = !g.pBad && !g.abBad;
    setText('vP', ok ? deg(g.angP) : '–'); setText('vO', g.abBad ? '–' : deg(g.arc.len));
    setText('vR', ok ? num(g.arc.len / g.angP, 4) : '–'); setText('vL', g.abBad ? '–' : num(st.r * g.arc.len));
    bar('bP', ok ? g.angP / TAU : 0); bar('bO', g.abBad ? 0 : g.arc.len / TAU);
    setText('bPt', ok ? deg(g.angP) : '–'); setText('bOt', g.abBad ? '–' : deg(g.arc.len));
    if (g.abBad) status('status', 'warn', 'A와 B가 겹쳐 호가 사라졌어요.');
    else if (g.pBad) status('status', 'warn', 'P가 A 또는 B와 겹쳐 각이 정의되지 않아요.');
    else if (g.thales) status('status', 'info', 'AB가 지름이에요. 중심각이 180°라서 원주각은 P가 어디 있든 항상 90°입니다.');
    else status('status', 'ok', `P가 파란 호 반대쪽 호 위에 있는 한 ∠APB는 ${deg(g.angP)}로 일정합니다. 중심각 ${deg(g.arc.len)}의 정확히 절반이에요.`);
    show('qInfo', opt.q);
    if (opt.q) setText('qInfo', g.qBad || !ok ? 'Q 또는 P가 A, B와 겹쳐 비교할 수 없어요.'
      : g.qSame ? `∠AQB = ${deg(g.angQ)} — P와 같은 쪽 호라서 ∠APB와 같습니다.`
      : `∠AQB = ${deg(g.angQ)} — P의 반대쪽 호라서 ∠APB + ∠AQB = ${deg(g.angP + g.angQ)}. 원에 내접하는 사각형의 대각의 합이에요.`);
    show('proofInfo', opt.proof);
    if (opt.proof && ok) {
      const u1 = V.sub(g.A, g.P), u2 = V.sub(g.B, g.P), uo = V.sub(st.O, g.P);
      const c1 = V.cross(u1, uo), c2 = V.cross(uo, u2), c = V.cross(u1, u2), eps = 0.012 * V.len(uo) * Math.max(V.len(u1), V.len(u2));
      const a1 = angleAt(g.P, g.A, st.O), a2 = angleAt(g.P, g.B, st.O);
      setText('proofInfo', Math.abs(c1) < eps || Math.abs(c2) < eps ? '지금은 O가 ∠APB의 변 위에 있어요. 식 하나로 ∠AOB = 2∠APB가 됩니다.'
        : Math.sign(c1) === Math.sign(c) && Math.sign(c2) === Math.sign(c) ? `지금은 O가 ∠APB 안쪽에 있어요: ∠OPA + ∠OPB = ${deg(a1)} + ${deg(a2)} = ${deg(a1 + a2)}`
        : `지금은 O가 ∠APB 바깥쪽에 있어요: |∠OPA − ∠OPB| = ${deg(Math.abs(a1 - a2))}`);
    }
  },
});

let dir = 1;
const anim = loop(dt => {
  const d = mod(st.tB - st.tA), pSide = mod(st.tP - st.tA) < d;
  const start = pSide ? st.tA : st.tB, len = pSide ? d : TAU - d;
  if (len < 0.2) return;
  let u = mod(st.tP - start) / len + dir * dt / 3500;
  if (u > 0.94) { u = 0.94; dir = -1; } if (u < 0.06) { u = 0.06; dir = 1; }
  st.tP = start + u * len; stage.render();
}, 'play', ['▶ P 움직이기', '❚❚ 멈추기']);

opt.q = onToggle('tQ', v => { opt.q = v; stage.request(); });
opt.proof = onToggle('tProof', v => { opt.proof = v; stage.request(); });
onClick('reset', () => { anim.stop(); st = structuredClone(DEF); stage.refit(); });
onClick('thales', () => { st.tB = st.tA + Math.PI; if (near(st.tP, st.tA) || near(st.tP, st.tB)) st.tP = st.tA + Math.PI / 2; stage.request(); });
onClick('rand', () => {
  anim.stop();
  const far = (a, l) => l.every(b => Math.min(mod(a - b), mod(b - a)) > 0.45);
  for (let i = 0; i < 300; i++) {
    const t = [0, 0, 0, 0].map(() => Math.random() * TAU);
    if (far(t[0], t.slice(1)) && far(t[1], t.slice(2)) && far(t[2], [t[3]])) { [st.tA, st.tB, st.tP, st.tQ] = t; break; }
  }
  stage.request();
});
