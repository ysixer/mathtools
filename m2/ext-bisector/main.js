import { Stage } from '/shared/stage.js';
import { V, isDegenerate } from '/shared/geometry.js';
import { $, num, deg, setText, setHTML, status, bar, show, onToggle, onClick, mountNav } from '/shared/ui.js';

mountNav();
const DEF = { A: { x: -1.2, y: 0.7 }, B: { x: -1.5, y: -0.8 }, C: { x: 1.5, y: -0.8 } };
let P = structuredClone(DEF), opt = { int: false, proof: false }, g = {};

function compute() {
  const { A, B, C } = P;
  const ab = V.dist(A, B), ac = V.dist(A, C), bc = V.dist(B, C);
  const uAB = V.norm(V.sub(B, A)), uAC = V.norm(V.sub(C, A));
  const bad = isDegenerate(A, B, C);
  const e = V.sub(uAB, uAC), en = V.norm(e), bcv = V.sub(C, B);
  const parallel = Math.abs(V.cross(en, V.norm(bcv))) < 1e-4;
  let D = null, t = 0;
  if (!bad && !parallel) { t = V.cross(V.sub(B, A), bcv) / V.cross(e, bcv); D = V.add(A, V.mul(e, t)); }
  const Di = bad ? null : V.add(B, V.mul(bcv, ab / (ab + ac)));
  let F = null; const dF = V.cross(en, uAB);
  if (!bad && Math.abs(dF) > 1e-9) F = V.add(C, V.mul(en, V.cross(V.sub(A, C), uAB) / dF));
  const angA = Math.acos(Math.max(-1, Math.min(1, V.dot(uAB, uAC))));
  return { ab, ac, bc, uAB, uAC, en, t, D, Di, F, angA, bad, parallel, db: D ? V.dist(D, B) : Infinity, dc: D ? V.dist(D, C) : Infinity };
}

const stage = new Stage($('#cv'), {
  bounds: () => {
    const c = compute(), ps = [P.A, P.B, P.C], size = Math.max(c.ab, c.ac, c.bc);
    if (c.D && V.dist(c.D, P.A) < size * 25) ps.push(c.D);
    return ps;
  },
  drag: (k, p) => { P[k] = p; },
  draw: d => {
    g = compute();
    const { A, B, C } = P;
    let s = d.infLine(B, V.sub(C, B), 'ln-muted dots');
    if (!g.bad) {
      const side = g.t >= 0 || !g.D;
      const r1 = side ? g.uAB : V.neg(g.uAB), eb = side ? g.en : V.neg(g.en), r2 = side ? V.neg(g.uAC) : g.uAC;
      const L = Math.max(g.ab, g.ac) * 0.5;
      s += d.line(A, V.add(A, V.mul(r2, L)), 'ln-muted dash');
      if (!side) s += d.line(A, V.add(A, V.mul(r1, L)), 'ln-muted dash');
      s += d.infLine(A, g.en, 'ln-acc thin faint');
      if (g.D) {
        s += d.line(A, g.D, 'ln-acc');
        s += d.line(g.D, V.dist(g.D, B) < V.dist(g.D, C) ? B : C, 'ln dash');
      }
      s += d.angle(A, V.add(A, r1), V.add(A, eb), 38, 'wd-acc') + d.angle(A, V.add(A, eb), V.add(A, r2), 38, 'wd-acc');
      s += d.mark(A, V.add(A, r1), V.add(A, eb), 38, 1, 'ln-acc') + d.mark(A, V.add(A, eb), V.add(A, r2), 38, 1, 'ln-acc');
      if (opt.int && g.Di) s += d.line(A, g.Di, 'ln-q dash');
      if (opt.proof && g.F && g.D) s += d.line(C, g.F, 'ln-proof dash') + d.line(A, g.F, 'ln-proof dash') + d.ticks(A, g.F, 2, 'ln-proof') + d.ticks(A, C, 2, 'ln-proof');
    }
    s += d.line(B, C) + d.line(A, B, 'ln-b') + d.line(A, C, 'ln-c');
    if (g.D) {
      // 대변 아래쪽에 DB, DC 길이 막대
      const Bs = d.S(B), Cs = d.S(C), Ds = d.S(g.D), As = d.S(A);
      let n = V.perp(V.norm(V.sub(Cs, Bs))); if (V.dot(n, V.sub(As, Bs)) > 0) n = V.neg(n);
      const barS = (p, q, off, cls) => {
        const a = V.add(p, V.mul(n, off)), b = V.add(q, V.mul(n, off));
        return d.lineS(a, b, cls) + d.lineS(V.add(a, V.mul(n, -5)), V.add(a, V.mul(n, 5)), cls) + d.lineS(V.add(b, V.mul(n, -5)), V.add(b, V.mul(n, 5)), cls);
      };
      s += barS(Ds, Bs, 16, 'ln-b') + barS(Ds, Cs, 34, 'ln-c');
      s += d.textS(V.add(V.mid(Ds, Bs), V.mul(n, 6)), 'DB ' + num(g.db), 'note t-b');
      s += d.textS(V.add(V.mid(Ds, Cs), V.mul(n, 46)), 'DC ' + num(g.dc), 'note t-c');
      s += d.dot(g.D, 6, 'pt-acc') + d.textS(V.add(Ds, V.mul(n, -20)), 'D', 'lbl t-acc');
    }
    if (opt.int && g.Di) s += d.dot(g.Di, 5, 'pt-q') + d.label(g.Di, 'D′', 'lbl t-q', A, 18);
    if (opt.proof && g.F && g.D) s += d.dot(g.F, 5, 'pt-proof') + d.label(g.F, 'F', 'lbl t-proof', C, 18);
    const inner = V.norm(V.add(g.uAB, g.uAC));
    s += d.handle('A', A, { label: 'A', away: V.add(A, inner) });
    s += d.handle('B', B, { label: 'B', away: V.mid(A, C) });
    s += d.handle('C', C, { label: 'C', away: V.mid(A, B) });
    return s;
  },
  after: () => {
    setText('vAB', num(g.ab)); setText('vAC', num(g.ac));
    setText('vDB', g.D ? num(g.db) : '∞'); setText('vDC', g.D ? num(g.dc) : '∞');
    const rS = g.ab / g.ac, rD = g.D ? g.db / g.dc : NaN;
    setHTML('rS', `<span class="m">AB</span>/<span class="m">AC</span> = ${num(rS, 4)}`);
    setHTML('rD', `<span class="m">DB</span>/<span class="m">DC</span> = ${num(rD, 4)}`);
    const pS = g.ab / (g.ab + g.ac); bar('bS1', pS); bar('bS2', 1 - pS); setText('pS', `${(pS * 100).toFixed(1)}% : ${((1 - pS) * 100).toFixed(1)}%`);
    if (g.D) { const pD = g.db / (g.db + g.dc); bar('bD1', pD); bar('bD2', 1 - pD); setText('pD', `${(pD * 100).toFixed(1)}% : ${((1 - pD) * 100).toFixed(1)}%`); }
    else { bar('bD1', 0.5); bar('bD2', 0.5); setText('pD', '정의되지 않음'); }
    if (g.bad) status('status', 'warn', '세 점이 거의 한 직선 위에 있어 삼각형이 되지 않습니다.');
    else if (!g.D) status('status', 'warn', 'AB = AC라서 외각의 이등분선이 BC와 평행합니다. 교점 D가 없어요.');
    else {
      const s = stage.toS(g.D), off = s.x < 0 || s.y < 0 || s.x > stage.w || s.y > stage.h;
      status('status', 'ok', `두 비가 일치합니다 (차이 ${Math.abs(rS - rD) < 1e-12 ? '< 1e-12' : Math.abs(rS - rD).toExponential(1)}). D는 더 짧은 변 쪽(${g.ab < g.ac ? 'B' : 'C'} 쪽) 바깥에 생겨요.${off ? ' D가 화면 밖에 있으니 "전체 보기"를 눌러 보세요.' : ''}`);
    }
    setText('aA', g.bad ? '–' : deg(g.angA)); setText('aE', g.bad ? '–' : deg(Math.PI - g.angA));
    setText('aH', g.bad ? '–' : `${deg((Math.PI - g.angA) / 2)} = ${deg((Math.PI - g.angA) / 2)}`);
    show('intInfo', opt.int); show('proofInfo', opt.proof);
    if (opt.int && g.Di) setText('intInfo', `D′B/D′C = ${num(V.dist(g.Di, P.B) / V.dist(g.Di, P.C), 4)} — 내분점 D′와 외분점 D가 BC를 같은 비로 나눕니다(조화분할).`);
    if (opt.proof) setText('proofInfo', g.F && g.D ? `AF = ${num(V.dist(P.A, g.F))}, AC = ${num(g.ac)} — 두 길이가 같습니다.` : '점 D가 있을 때만 보조선을 그릴 수 있어요.');
  },
});

opt.int = onToggle('tInt', v => { opt.int = v; stage.request(); });
opt.proof = onToggle('tProof', v => { opt.proof = v; stage.refit(); });
onClick('reset', () => { P = structuredClone(DEF); stage.refit(); });
onClick('rand', () => {
  const r = () => ({ x: (Math.random() - 0.5) * 3.6, y: (Math.random() - 0.5) * 2.6 });
  for (let i = 0; i < 300; i++) {
    const c = { A: r(), B: r(), C: r() };
    const ab = V.dist(c.A, c.B), ac = V.dist(c.A, c.C), q = Math.min(ab, ac) / Math.max(ab, ac);
    if (!isDegenerate(c.A, c.B, c.C) && Math.min(ab, ac, V.dist(c.B, c.C)) > 0.7 && q > 0.3 && q < 0.8) { P = c; break; }
  }
  stage.refit();
});
