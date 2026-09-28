import { Stage } from '/shared/stage.js';
import { V, D2R, R2D, clamp } from '/shared/geometry.js';
import { $, num, deg, setText, status, onToggle, onClick, mountNav } from '/shared/ui.js';

mountNav();
const A = { x: 0, y: 0 };
let B = { x: 2.4, y: 1.4 }, unit = true, snapOn = false, g = {};
const EXACT = { 30: ['1/2', '√3/2', '√3/3'], 45: ['√2/2', '√2/2', '1'], 60: ['√3/2', '1/2', '√3'] };

const stage = new Stage($('#cv'), {
  axes: null,
  bounds: () => [A, B, { x: B.x, y: 0 }, ...(unit ? [{ x: 1.1, y: 1.1 }] : [])],
  drag: (k, p) => {
    let q = { x: clamp(p.x, 0.05, 50), y: clamp(p.y, 0.05, 50) };
    if (snapOn) q = { x: Math.max(0.1, Math.round(q.x * 10) / 10), y: Math.max(0.1, Math.round(q.y * 10) / 10) };
    B = q;
  },
  draw: d => {
    const C = { x: B.x, y: 0 }, th = Math.atan2(B.y, B.x);
    g = { C, th };
    let s = d.poly([A, B, C], 'fl-ink');
    if (unit) {
      const Pu = V.dir(th), Cu = { x: Math.cos(th), y: 0 };
      s += d.arcW(A, 1, 0, Math.PI / 2, 'ln-muted dash');
      s += d.line(A, Cu, 'ln-c thick') + d.line(Cu, Pu, 'ln-b thick');
      if (th < 80 * D2R) {
        const T = { x: 1, y: Math.tan(th) };
        s += d.line({ x: 1, y: 0 }, T, 'ln-q thick') + d.line(A, T, 'ln-muted dots') + d.dot(T, 4, 'pt-q');
        s += d.text(T, `tan = ${num(Math.tan(th), 3)}`, 'note t-q', 44, 0);
      }
      s += d.dot(Pu, 4, 'pt-ink');
      s += d.text(V.mid(Cu, Pu), `sin = ${num(Math.sin(th), 3)}`, 'note t-b', 44, 0);
      s += d.text(V.mid(A, Cu), `cos = ${num(Math.cos(th), 3)}`, 'note t-c', 0, 14);
    }
    s += d.line(A, C, 'ln-c') + d.line(C, B, 'ln-b') + d.line(A, B, 'ln-acc');
    s += d.right(C, A, B, 11);
    s += d.angle(A, C, B, 28, 'wd-ink', { label: deg(th), gap: 20 });
    const G = V.mul(V.add(V.add(A, B), C), 1 / 3);
    s += d.label(V.mid(A, B), num(V.dist(A, B)), 'val t-acc', G, 18);
    s += d.label(V.mid(C, B), num(B.y), 'val t-b', G, 26);
    s += d.label(V.mid(A, C), num(B.x), 'val t-c', G, 16);
    s += d.dot(A, 5, 'pt-ink') + d.label(A, 'A', 'lbl', G, 18) + d.dot(C, 4, 'pt-ink') + d.label(C, 'C', 'lbl', G, 18);
    s += d.handle('B', B, { label: 'B', away: G });
    return s;
  },
  after: () => {
    const th = g.th, ab = V.dist(A, B);
    setText('vA', deg(th)); setText('vAB', num(ab)); setText('vBC', num(B.y)); setText('vAC', num(B.x));
    setText('vSin', `${num(B.y)} / ${num(ab)} = ${num(Math.sin(th), 4)}`);
    setText('vCos', `${num(B.x)} / ${num(ab)} = ${num(Math.cos(th), 4)}`);
    setText('vTan', `${num(B.y)} / ${num(B.x)} = ${num(Math.tan(th), 4)}`);
    setText('vId', num(Math.sin(th) ** 2 + Math.cos(th) ** 2, 4));
    const dg = Math.round(th * R2D);
    if (EXACT[dg] && Math.abs(th * R2D - dg) < 0.3) status('status', 'info', `${dg}°예요: sin = ${EXACT[dg][0]}, cos = ${EXACT[dg][1]}, tan = ${EXACT[dg][2]}`);
    else status('status', 'ok', '점 B를 원점 쪽으로 곧게 당기거나 밀어 보세요. 각이 같으면 크기가 바뀌어도 비는 그대로예요.');
  },
});

unit = onToggle('tUnit', v => { unit = v; stage.refit(); });
snapOn = onToggle('tSnap', v => { snapOn = v; });
for (const a of [30, 45, 60]) onClick('d' + a, () => { B = V.mul(V.dir(a * D2R), V.len(B)); stage.request(); });
onClick('twice', () => { B = V.mul(B, 2); stage.refit(); });
onClick('half', () => { B = V.mul(B, 0.5); stage.refit(); });
