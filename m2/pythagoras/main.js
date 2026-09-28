import { Stage } from '/shared/stage.js';
import { V, angleAt, project, R2D } from '/shared/geometry.js';
import { $, num, deg, setText, status, bar, show, onToggle, onClick, mountNav } from '/shared/ui.js';

mountNav();
let C = { x: 0, y: 0 }, A = { x: 0, y: 2 }, a = -1.5, Bfree = null, lock = true, euclid = false, g = {};
const legDir = () => V.perp(V.norm(V.sub(A, C)));
const getB = () => lock ? V.add(C, V.mul(legDir(), a)) : Bfree;
/** 선분 PQ 위, 점 R 반대쪽에 세운 정사각형 */
function square(Pp, Q, R) {
  let n = V.perp(V.norm(V.sub(Q, Pp))); if (V.dot(n, V.sub(R, Pp)) > 0) n = V.neg(n);
  const L = V.dist(Pp, Q);
  return { pts: [Pp, Q, V.add(Q, V.mul(n, L)), V.add(Pp, V.mul(n, L))], n, L };
}
const center = q => V.mul(q.pts.reduce((s, p) => V.add(s, p), { x: 0, y: 0 }), 0.25);

const stage = new Stage($('#cv'), {
  bounds: () => { const B = getB(); return [square(B, C, A), square(C, A, B), square(A, B, C)].flatMap(q => q.pts); },
  drag: (k, p) => {
    if (k === 'C') { const dlt = V.sub(p, C); C = p; A = V.add(A, dlt); if (Bfree) Bfree = V.add(Bfree, dlt); }
    else if (k === 'A') { if (V.dist(p, C) > 0.3) A = p; }
    else if (lock) { const v = V.dot(V.sub(p, C), legDir()); a = Math.abs(v) < 0.3 ? Math.sign(v || 1) * 0.3 : v; }
    else Bfree = p;
  },
  draw: d => {
    const B = getB();
    const sa = square(B, C, A), sb = square(C, A, B), sc = square(A, B, C);
    g = { B, av: V.dist(B, C), bv: V.dist(C, A), cv: V.dist(A, B), angC: angleAt(C, A, B) };
    g.right = Math.abs(g.angC * R2D - 90) < 0.05;
    let s = d.poly(sa.pts, 'fl-b') + d.poly(sb.pts, 'fl-c');
    if (euclid && g.right) {
      const H = project(C, A, B).pt, H2 = V.add(H, V.mul(sc.n, sc.L));
      s += d.poly([H, B, sc.pts[2], H2], 'fl-b') + d.poly([A, H, H2, sc.pts[3]], 'fl-c');
      s += d.line(C, H2, 'ln-proof dash') + d.right(H, C, B, 9, 'ln-proof');
      g.H = H;
    } else s += d.poly(sc.pts, 'fl-acc');
    s += d.poly(sa.pts, 'ln-b thin') + d.poly(sb.pts, 'ln-c thin') + d.poly(sc.pts, 'ln-acc thin');
    s += d.poly([A, B, C], 'fl-ink') + d.line(A, B) + d.line(B, C) + d.line(C, A);
    s += d.angle(C, A, B, 20, 'wd-ink', { right: true, rcls: 'ln' });
    s += d.text(center(sa), `a² = ${num(g.av ** 2)}`, 'val t-b') + d.text(center(sb), `b² = ${num(g.bv ** 2)}`, 'val t-c');
    s += d.text(center(sc), `c² = ${num(g.cv ** 2)}`, 'val t-acc');
    const G = V.mul(V.add(V.add(A, B), C), 1 / 3);
    s += d.label(V.mid(B, C), 'a', 'lbl t-b', center(sa), 16) + d.label(V.mid(C, A), 'b', 'lbl t-c', center(sb), 16) + d.label(V.mid(A, B), 'c', 'lbl t-acc', center(sc), 16);
    s += d.handle('C', C, { label: 'C', away: G }) + d.handle('A', A, { label: 'A', away: G }) + d.handle('B', B, { label: 'B', away: G });
    return s;
  },
  after: () => {
    const a2 = g.av ** 2, b2 = g.bv ** 2, c2 = g.cv ** 2, mx = Math.max(a2 + b2, c2);
    setText('va', num(g.av)); setText('vb', num(g.bv)); setText('vc', num(g.cv));
    setText('vSum', num(a2 + b2)); setText('vC2', num(c2)); setText('vAng', deg(g.angC));
    bar('ba', a2 / mx); bar('bb', b2 / mx); bar('bc', c2 / mx);
    setText('pSum', `${num(a2)} + ${num(b2)}`); setText('pC', num(c2));
    if (g.right) status('status', 'ok', `∠C = 90°이므로 a² + b² = c² (${num(a2 + b2)} = ${num(c2)})가 성립합니다.`);
    else if (g.angC * R2D < 90) status('status', 'info', `∠C가 예각이면 a² + b² > c² 예요 (${num(a2 + b2)} > ${num(c2)}).`);
    else status('status', 'warn', `∠C가 둔각이면 a² + b² < c² 예요 (${num(a2 + b2)} < ${num(c2)}).`);
    show('euInfo', euclid);
    if (euclid) setText('euInfo', g.right && g.H ? `빗변 정사각형이 넓이 ${num(V.dist(g.H, g.B) * g.cv)} (= a²)와 ${num(V.dist(A, g.H) * g.cv)} (= b²)인 두 직사각형으로 나뉩니다.` : '∠C가 직각일 때만 이 분할이 성립해요.');
  },
});

const lockedB = () => V.add(C, V.mul(legDir(), a));
lock = onToggle('tRight', v => {
  if (v && Bfree) { const t = V.dot(V.sub(Bfree, C), legDir()); a = Math.abs(t) < 0.3 ? -1.5 : t; }
  if (!v) Bfree = lockedB();
  lock = v;
  stage.request();
});
euclid = onToggle('tEuclid', v => { euclid = v; stage.request(); });
const set = (x, y) => { C = { x: 0, y: 0 }; A = { x: 0, y }; a = -x; Bfree = lockedB(); stage.refit(); };
onClick('t345', () => set(3, 4));
onClick('t51213', () => set(5, 12));
onClick('reset', () => set(1.5, 2));
