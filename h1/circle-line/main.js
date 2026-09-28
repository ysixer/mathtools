import { Stage } from '/shared/stage.js';
import { V, project } from '/shared/geometry.js';
import { $, num, coef, setText, status, check, onToggle, onClick, mountNav } from '/shared/ui.js';

mountNav();
const DEF = { C: { x: 1, y: 1 }, r: 2, P: { x: -3, y: -1 }, Q: { x: 3, y: 2 } };
let st = structuredClone(DEF), snapOn = true, g = {};

const sq = (name, v) => Math.abs(v) < 1e-9 ? `${name}²` : `(${name} ${v > 0 ? '−' : '+'} ${coef(Math.abs(v))})²`;
function lineInfo() {
  const { P, Q } = st, a = Q.y - P.y, b = P.x - Q.x, c = -(a * P.x + b * P.y);
  const { x: p, y: q } = st.C, r = st.r;
  if (Math.abs(b) < 1e-9) return { vertical: true, x0: P.x, eq: `x = ${coef(P.x)}`, disc: r * r - (P.x - p) ** 2 };
  const m = -a / b, k = -c / b;
  const mt = Math.abs(m) < 1e-9 ? '' : Math.abs(m - 1) < 1e-9 ? 'x' : Math.abs(m + 1) < 1e-9 ? '−x' : `${coef(m)}x`;
  const kt = Math.abs(k) < 1e-9 ? (mt ? '' : '0') : mt ? ` ${k > 0 ? '+' : '−'} ${coef(Math.abs(k))}` : coef(k);
  const B = m * (k - q) - p, A = 1 + m * m, Cc = p * p + (k - q) ** 2 - r * r;
  return { m, k, eq: `y = ${mt}${kt}`, disc: B * B - A * Cc };
}

const stage = new Stage($('#cv'), {
  axes: {},
  bounds: () => [{ x: -5, y: -4 }, { x: 5, y: 5 }],
  drag: (k, p) => {
    const s = v => snapOn ? V.snap(v, 0.5) : v;
    if (k === 'R') { const l = Math.max(0.5, V.dist(p, st.C)); st.r = snapOn ? Math.round(l * 2) / 2 : l; return; }
    const q = s(p);
    if (k === 'P' && V.dist(q, st.Q) < 0.2) return;
    if (k === 'Q' && V.dist(q, st.P) < 0.2) return;
    st[k] = q;
  },
  draw: d => {
    const { C, r, P, Q } = st, H = project(C, P, Q).pt, dd = V.dist(C, H);
    const eps = 1e-6 * Math.max(1, r);
    const pts = dd < r - eps ? (() => { const u = V.norm(V.sub(Q, P)), h = Math.sqrt(r * r - dd * dd); return [V.add(H, V.mul(u, -h)), V.add(H, V.mul(u, h))]; })()
      : Math.abs(dd - r) <= eps ? [H] : [];
    g = { H, dd, pts, info: lineInfo() };
    let s = d.ring('R', C, r) + d.circle(C, r, 'ln-b');
    s += d.infLine(P, V.sub(Q, P), 'ln-acc');
    if (dd > 1e-6) s += d.line(C, H, 'ln-q dash') + d.right(H, C, Q, 10, 'ln-q') + d.label(V.mid(C, H), `d = ${num(dd)}`, 'val t-q', V.add(V.mid(C, H), V.perp(V.sub(H, C))), 18);
    for (const x of pts) s += d.dot(x, 6, 'pt-ink') + d.text(x, `(${num(x.x)}, ${num(x.y)})`, 'note', 0, -18);
    s += d.handle('C', C, { cls: 'pt-b', label: 'C', lcls: 't-b', dirS: { x: -0.7, y: -0.7 } });
    s += d.handle('P', P, { cls: 'pt-acc', label: 'P', lcls: 't-acc' }) + d.handle('Q', Q, { cls: 'pt-acc', label: 'Q', lcls: 't-acc' });
    return s;
  },
  after: () => {
    const { C, r } = st, disc = g.info.disc, eps = 1e-6 * Math.max(1, r * r);
    const sgn = Math.abs(disc) < eps ? 0 : Math.sign(disc);
    setText('eqC', `${sq('x', C.x)} + ${sq('y', C.y)} = ${coef(r * r)}`);
    setText('eqL', g.info.eq);
    setText('vD', num(g.dd, 3)); setText('vR', num(r, 3)); setText('vDisc', num(disc, 3)); setText('vN', g.pts.length + '개');
    check('c1', sgn > 0); check('c2', sgn === 0); check('c3', sgn < 0);
    const rel = g.pts.length === 2 ? 'd < r이고 D > 0이라 두 점에서 만나요.' : g.pts.length === 1 ? 'd = r이고 D = 0이라 한 점에서 접해요.' : 'd > r이고 D < 0이라 만나지 않아요.';
    status('status', g.pts.length === 1 ? 'info' : 'ok', rel + (g.info.vertical ? ' (세로 직선은 x = 상수를 대입해 판별식을 구했어요.)' : ''));
  },
});

snapOn = onToggle('tSnap', v => { snapOn = v; });
onClick('tangent', () => {
  const { C, P, Q } = st, H = project(C, P, Q).pt;
  let n = V.sub(H, C); n = V.len(n) < 1e-9 ? V.norm(V.perp(V.sub(Q, P))) : V.norm(n);
  const shift = V.sub(V.add(C, V.mul(n, st.r)), H);
  st.P = V.add(P, shift); st.Q = V.add(Q, shift); stage.request();
});
onClick('reset', () => { st = structuredClone(DEF); stage.refit(); });
