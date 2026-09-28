import { Stage } from '/shared/stage.js';
import { V, angleAt, isDegenerate } from '/shared/geometry.js';
import { $, deg, setText, status, bar, show, onToggle, onClick, mountNav } from '/shared/ui.js';

mountNav();
const DEF = { A: { x: -0.4, y: 1.7 }, B: { x: -2, y: -1 }, C: { x: 1.2, y: -1 } };
let P = structuredClone(DEF), par = false, g = {};

const extPoint = () => V.add(P.C, V.mul(V.norm(V.sub(P.C, P.B)), Math.max(1.4, V.dist(P.B, P.C) * 0.6)));

const stage = new Stage($('#cv'), {
  bounds: () => [P.A, P.B, P.C, extPoint()],
  drag: (k, p) => { P[k] = p; },
  draw: d => {
    const { A, B, C } = P, D = extPoint();
    g = { bad: isDegenerate(A, B, C), a: angleAt(A, B, C), b: angleAt(B, C, A), c: angleAt(C, A, B) };
    let s = d.infLine(B, V.sub(C, B), 'ln-muted dots');
    s += d.line(C, D, 'ln dash');
    if (!g.bad) {
      s += d.angle(A, B, C, 30, 'wd-b', { label: deg(g.a, 0), lcls: 't-b' });
      s += d.angle(B, C, A, 30, 'wd-c', { label: deg(g.b, 0), lcls: 't-c' });
      if (par) {
        const E = V.add(C, V.mul(V.norm(V.sub(A, B)), Math.max(1.4, V.dist(A, B) * 0.7)));
        s += d.line(C, E, 'ln-proof dash');
        s += d.angle(C, A, E, 34, 'wd-b') + d.angle(C, E, D, 48, 'wd-c');
        s += d.dot(E, 4, 'pt-proof') + d.label(E, 'E', 'lbl t-proof', C, 16);
      } else {
        s += d.angle(C, A, D, 38, 'wd-acc', { label: deg(Math.PI - g.c, 0), lcls: 't-acc', gap: 20 });
      }
    }
    s += d.poly([A, B, C], 'fl-ink');
    s += d.line(A, B) + d.line(B, C) + d.line(C, A);
    s += d.dot(D, 4, 'pt-ink') + d.label(D, 'D', 'lbl', C, 16);
    const G = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
    for (const k of ['A', 'B', 'C']) s += d.handle(k, P[k], { label: k, away: G });
    return s;
  },
  after: () => {
    const ok = !g.bad, ext = Math.PI - g.c;
    setText('vA', ok ? deg(g.a) : '–'); setText('vB', ok ? deg(g.b) : '–');
    setText('vAB', ok ? deg(g.a + g.b) : '–'); setText('vExt', ok ? deg(ext) : '–');
    setText('vC', ok ? deg(g.c) : '–'); setText('vSum', ok ? deg(g.a + g.b + g.c) : '–');
    bar('bA', ok ? g.a / Math.PI : 0); bar('bB', ok ? g.b / Math.PI : 0); bar('bE', ok ? ext / Math.PI : 0);
    setText('bABt', ok ? deg(g.a + g.b) : '–'); setText('bEt', ok ? deg(ext) : '–');
    if (!ok) status('status', 'warn', '세 점이 거의 한 직선 위에 있어요. 꼭짓점을 떨어뜨려 주세요.');
    else status('status', 'ok', `외각 ${deg(ext)} = ${deg(g.a)} + ${deg(g.b)}. 삼각형 모양이 바뀌어도 항상 같습니다.`);
    show('parInfo', par);
    if (par && ok) setText('parInfo', `∠ACE = ${deg(g.a)} (엇각), ∠ECD = ${deg(g.b)} (동위각) — 외각이 두 조각으로 나뉩니다.`);
  },
});

par = onToggle('tPar', v => { par = v; stage.request(); });
onClick('reset', () => { P = structuredClone(DEF); stage.refit(); });
onClick('rand', () => {
  const r = () => ({ x: (Math.random() - 0.5) * 4.4, y: (Math.random() - 0.5) * 3.4 });
  for (let i = 0; i < 200; i++) {
    const c = { A: r(), B: r(), C: r() };
    if (!isDegenerate(c.A, c.B, c.C) && Math.min(V.dist(c.A, c.B), V.dist(c.B, c.C), V.dist(c.C, c.A)) > 1.4 &&
        Math.min(angleAt(c.A, c.B, c.C), angleAt(c.B, c.C, c.A), angleAt(c.C, c.A, c.B)) > 0.35) { P = c; break; }
  }
  stage.refit();
});
