import { Stage } from '/shared/stage.js';
import { V, angleAt, circumcenter, project, isDegenerate, R2D } from '/shared/geometry.js';
import { $, num, deg, setText, setHTML, status, show, onSeg, onToggle, onClick, mountNav } from '/shared/ui.js';

mountNav();
const DEF = { A: { x: -0.8, y: 1.5 }, B: { x: -2, y: -1 }, C: { x: 2, y: -1 } };
let P = structuredClone(DEF), mode = 'sine', proof = false, g = {};

function compute() {
  const { A, B, C } = P;
  const a = V.dist(B, C), b = V.dist(C, A), c = V.dist(A, B);
  const ang = { A: angleAt(A, B, C), B: angleAt(B, C, A), C: angleAt(C, A, B) };
  return { a, b, c, ang, bad: isDegenerate(A, B, C), cc: circumcenter(A, B, C) };
}

const stage = new Stage($('#cv'), {
  bounds: () => { const c = compute(); const ps = [P.A, P.B, P.C]; if (mode === 'sine' && c.cc && c.cc.r < 10) ps.push(V.sub(c.cc.c, { x: c.cc.r, y: c.cc.r }), V.add(c.cc.c, { x: c.cc.r, y: c.cc.r })); return ps; },
  drag: (k, p) => { P[k] = p; },
  draw: d => {
    g = compute();
    const { A, B, C } = P;
    let s = d.poly([A, B, C], 'fl-ink');
    if (!g.bad) {
      if (mode === 'sine') {
        const O = g.cc.c;
        s += d.circle(O, g.cc.r, 'ln-b') + d.dot(O, 4.5, 'pt-b') + d.text(O, 'O', 'lbl t-b', 12, -12);
        if (proof) {
          const A2 = V.sub(V.mul(O, 2), B);
          s += d.line(B, A2, 'ln-proof dash') + d.line(A2, C, 'ln-proof dash') + d.right(C, B, A2, 10, 'ln-proof');
          s += d.angle(A2, B, C, 26, 'wd-proof') + d.dot(A2, 5, 'pt-proof') + d.label(A2, 'A′', 'lbl t-proof', O, 18);
          g.A2 = A2;
        }
      } else {
        const H = project(C, A, B).pt;
        g.H = H;
        s += d.infLine(A, V.sub(B, A), 'ln-muted dots');
        s += d.line(A, H, 'ln-c thick') + d.line(C, H, 'ln-q dash') + d.right(H, C, B, 10, 'ln-q');
        s += d.dot(H, 4.5, 'pt-q') + d.label(H, 'H', 'lbl t-q', C, 18);
        if (proof) s += d.line(H, B, 'ln-proof thick');
      }
      s += d.angle(A, B, C, 28, 'wd-acc', { label: deg(g.ang.A, 1), lcls: 't-acc' });
      s += d.angle(B, C, A, 22, 'wd-ink', { label: deg(g.ang.B, 0), lcls: 't-muted' }) + d.angle(C, A, B, 22, 'wd-ink', { label: deg(g.ang.C, 0), lcls: 't-muted' });
    }
    s += d.line(A, B) + d.line(B, C, 'ln-acc') + d.line(C, A);
    const G = V.mul(V.add(V.add(A, B), C), 1 / 3);
    s += d.label(V.mid(B, C), 'a', 'lbl t-acc', G, 16) + d.label(V.mid(C, A), 'b', 'lbl', G, 16) + d.label(V.mid(A, B), 'c', 'lbl', G, 16);
    for (const k of ['A', 'B', 'C']) s += d.handle(k, P[k], { label: k, away: G });
    return s;
  },
  after: () => {
    const sine = mode === 'sine';
    show('secSine', sine); show('secCos', !sine);
    setHTML('law', sine ? '<span class="m">a</span>/sin <span class="m">A</span> = <span class="m">b</span>/sin <span class="m">B</span> = <span class="m">c</span>/sin <span class="m">C</span> = 2<span class="m cb">R</span>'
      : '<span class="m ca">a</span>² = <span class="m">b</span>² + <span class="m">c</span>² − 2<span class="m">bc</span> cos <span class="m ca">A</span>');
    setText('stmt', sine ? '각 변의 길이를 마주 보는 각의 사인값으로 나누면 모두 외접원의 지름과 같아요.' : '두 변과 그 끼인각을 알면 나머지 한 변을 구할 수 있어요. ∠A = 90°이면 피타고라스 정리가 됩니다.');
    if (g.bad) { status('status', 'warn', '세 점이 거의 한 직선 위에 있어요.'); return; }
    const { a, b, c, ang } = g;
    setText('vAng', `${deg(ang.A)}, ${deg(ang.B)}, ${deg(ang.C)}`); setText('vSide', `${num(a)}, ${num(b)}, ${num(c)}`);
    show('proofInfo', proof);
    if (sine) {
      setText('s1', num(a / Math.sin(ang.A), 4)); setText('s2', num(b / Math.sin(ang.B), 4)); setText('s3', num(c / Math.sin(ang.C), 4)); setText('s4', num(2 * g.cc.r, 4));
      status('status', 'ok', `세 비가 모두 외접원의 지름 ${num(2 * g.cc.r, 3)}와 같아요.`);
      if (proof) setText('proofInfo', `BA′는 지름이라 ∠BCA′ = 90°, ∠A′ = ${ang.A * R2D > 90 ? '180° − ∠A' : '∠A'} (같은 호의 원주각). 그래서 a = 2R sin A예요.`);
    } else {
      const cosA = (b * b + c * c - a * a) / (2 * b * c);
      setText('c1', num(a * a, 4)); setText('c2', num(b * b + c * c - 2 * b * c * Math.cos(ang.A), 4));
      setText('c3', num(cosA, 4)); setText('c4', num(b * Math.cos(ang.A))); setText('c5', num(b * Math.sin(ang.A)));
      const A90 = Math.abs(ang.A * R2D - 90) < 0.3;
      status('status', A90 ? 'info' : 'ok', A90 ? 'cos 90° = 0이라 a² = b² + c², 피타고라스 정리와 같아졌어요.'
        : ang.A * R2D > 90 ? 'A가 둔각이면 cos A < 0이라 H가 변 AB의 연장선 위로 나가고, a²이 b² + c²보다 커져요.'
        : '두 식의 값이 항상 같아요. A가 예각이면 cos A > 0이라 a² < b² + c²입니다.');
      if (proof && g.H) setText('proofInfo', `직각삼각형 CHB에서 a² = CH² + HB² = (b sin A)² + (c − b cos A)². 전개하면 b² + c² − 2bc cos A가 됩니다. (HB = ${num(V.dist(g.H, P.B))})`);
    }
  },
});

mode = onSeg('mode', v => { mode = v; stage.refit(); });
proof = onToggle('tProof', v => { proof = v; stage.request(); });
onClick('obt', () => { P.A = V.add(V.lerp(P.B, P.C, 0.35), V.mul(V.norm(V.perp(V.sub(P.C, P.B))), V.dist(P.B, P.C) * 0.22)); stage.refit(); });
onClick('reset', () => { P = structuredClone(DEF); stage.refit(); });
