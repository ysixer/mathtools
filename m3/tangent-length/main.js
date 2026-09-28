import { Stage } from '/shared/stage.js';
import { V } from '/shared/geometry.js';
import { $, num, deg, setText, status, show, onToggle, onClick, mountNav } from '/shared/ui.js';

mountNav();
const DEF = { O: { x: 0, y: 0 }, r: 1.5, P: { x: 3.4, y: 0.9 } };
let st = structuredClone(DEF), kite = true, proof = false, g = {};

function compute() {
  const { O, r, P } = st, dd = V.dist(O, P);
  if (dd <= r * (1 + 1e-4)) return { inside: dd < r * (1 - 1e-4), onCircle: Math.abs(dd - r) <= r * 1e-4, dd };
  const al = Math.acos(r / dd), th = V.ang(V.sub(P, O));
  return { dd, T1: V.add(O, V.mul(V.dir(th + al), r)), T2: V.add(O, V.mul(V.dir(th - al), r)), len: Math.sqrt(dd * dd - r * r), al };
}

const stage = new Stage($('#cv'), {
  bounds: () => [V.sub(st.O, { x: st.r, y: st.r }), V.add(st.O, { x: st.r, y: st.r }), st.P],
  drag: (k, p) => { if (k === 'R') st.r = Math.max(0.3, V.dist(p, st.O)); else st[k] = p; },
  draw: d => {
    g = compute();
    const { O, r, P } = st;
    let s = '';
    if (g.T1 && kite) s += d.poly([O, g.T1, P, g.T2], 'fl-q');
    s += d.ring('R', O, r) + d.circle(O, r, 'ln');
    if (g.T1) {
      const { T1, T2 } = g, ext = (T) => V.add(T, V.mul(V.norm(V.sub(T, P)), 0.6 * r));
      s += d.line(P, ext(T1), 'ln-acc') + d.line(P, ext(T2), 'ln-acc');
      s += d.line(O, T1, 'ln-b') + d.line(O, T2, 'ln-b') + d.line(O, P, 'ln-muted dash');
      s += d.right(T1, O, P, 10) + d.right(T2, O, P, 10);
      s += d.ticks(P, T1, 2, 'ln-acc') + d.ticks(P, T2, 2, 'ln-acc') + d.ticks(O, T1, 1, 'ln-b') + d.ticks(O, T2, 1, 'ln-b');
      s += d.angle(P, T1, T2, 26, 'wd-acc', { label: deg(2 * (Math.PI / 2 - g.al), 1), lcls: 't-acc' });
      s += d.angle(O, T1, T2, 22, 'wd-b', { label: deg(2 * g.al, 1), lcls: 't-b' });
      if (proof) s += d.mark(P, T1, O, 44, 1) + d.mark(P, O, T2, 44, 1) + d.mark(O, T1, P, 36, 2) + d.mark(O, P, T2, 36, 2);
      s += d.label(V.mid(P, T1), num(g.len), 'val t-acc', O, 16) + d.label(V.mid(P, T2), num(g.len), 'val t-acc', O, 16);
      s += d.dot(T1, 5, 'pt-ink') + d.label(T1, 'T₁', 'lbl', O, 18) + d.dot(T2, 5, 'pt-ink') + d.label(T2, 'T₂', 'lbl', O, 18);
    }
    s += d.handle('O', O, { cls: 'pt-b', r: 5, hit: 16, label: 'O', lcls: 't-b', away: P });
    s += d.handle('P', P, { cls: 'pt-acc', label: 'P', lcls: 't-acc', away: O });
    return s;
  },
  after: () => {
    show('proofInfo', proof);
    if (!g.T1) {
      for (const id of ['v1', 'v2', 'vPy', 'vSum']) setText(id, '–');
      setText('vOP', `${num(g.dd)}, ${num(st.r)}`);
      status('status', 'warn', g.onCircle ? 'P가 원 위에 있으면 접선은 하나뿐이고 접선의 길이는 0이에요.' : 'P가 원 안에 있으면 접선을 그을 수 없어요. 원 밖으로 옮겨 주세요.');
      return;
    }
    const a1 = V.dist(st.P, g.T1), a2 = V.dist(st.P, g.T2);
    setText('v1', num(a1, 3)); setText('v2', num(a2, 3)); setText('vPy', num(g.len, 3));
    setText('vOP', `${num(g.dd)}, ${num(st.r)}`);
    setText('vSum', `${deg(Math.PI - 2 * g.al)} + ${deg(2 * g.al)} = 180°`);
    status('status', 'ok', `두 접선의 길이가 모두 ${num(g.len, 3)}로 같아요. P를 멀리 옮길수록 두 접선 사이의 각은 작아집니다.`);
    if (proof) setText('proofInfo', `△OT₁P ≡ △OT₂P (RHS 합동): 빗변 OP = ${num(g.dd)}, 반지름 OT₁ = OT₂ = ${num(st.r)}. 그래서 OP는 ∠P와 ∠O를 각각 이등분해요.`);
  },
});

kite = onToggle('tKite', v => { kite = v; stage.request(); });
proof = onToggle('tProof', v => { proof = v; stage.request(); });
onClick('reset', () => { st = structuredClone(DEF); stage.refit(); });
