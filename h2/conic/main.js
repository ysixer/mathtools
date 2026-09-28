import { Stage } from '/shared/stage.js';
import { V, TAU, clamp } from '/shared/geometry.js';
import { $, num, coef, setText, setHTML, status, onSeg, onClick, loop, mountNav } from '/shared/ui.js';

mountNav();
const DEF = { ellipse: { a: 2.5, c: 1.5, t: 1.1 }, hyper: { a: 1.5, c: 2.5, u: 0.7, s: 1 }, parab: { p: 1, y: 2 } };
let kind = 'ellipse', st = structuredClone(DEF), g = {};

function point() {
  if (kind === 'ellipse') { const { a, c, t } = st.ellipse, b = Math.sqrt(a * a - c * c); return { x: a * Math.cos(t), y: b * Math.sin(t) }; }
  if (kind === 'hyper') { const { a, c, u, s } = st.hyper, b = Math.sqrt(c * c - a * a); return { x: s * a * Math.cosh(u), y: b * Math.sinh(u) }; }
  const { p, y } = st.parab; return { x: y * y / (4 * p), y };
}

const stage = new Stage($('#cv'), {
  axes: {},
  bounds: () => {
    if (kind === 'ellipse') { const { a } = st.ellipse; return [{ x: -a - 0.6, y: -a * 0.8 }, { x: a + 0.6, y: a * 0.8 }]; }
    if (kind === 'hyper') { const { c } = st.hyper; return [{ x: -c - 2, y: -3 }, { x: c + 2, y: 3 }]; }
    return [{ x: -st.parab.p - 1, y: -4 }, { x: 4.5, y: 4 }];
  },
  onGrab: () => anim.stop(),
  drag: (k, p) => {
    if (kind === 'ellipse') {
      const e = st.ellipse;
      if (k === 'F') e.c = clamp(Math.abs(p.x), 0, e.a - 0.1);
      else if (k === 'V') e.a = Math.max(e.c + 0.1, Math.abs(p.x), 0.3);
      else { const b = Math.sqrt(e.a * e.a - e.c * e.c); e.t = Math.atan2(p.y / b, p.x / e.a); }
    } else if (kind === 'hyper') {
      const h = st.hyper;
      if (k === 'F') h.c = Math.max(h.a + 0.1, Math.abs(p.x));
      else if (k === 'V') h.a = clamp(Math.abs(p.x), 0.2, h.c - 0.1);
      else { const b = Math.sqrt(h.c * h.c - h.a * h.a); h.s = p.x < 0 ? -1 : 1; h.u = clamp(Math.asinh(p.y / b), -3, 3); }
    } else {
      if (k === 'F') st.parab.p = Math.max(0.2, p.x);
      else st.parab.y = clamp(p.y, -6, 6);
    }
  },
  draw: d => {
    const P = point();
    let s = '';
    if (kind === 'ellipse') {
      const { a, c } = st.ellipse, b = Math.sqrt(a * a - c * c), F1 = { x: -c, y: 0 }, F2 = { x: c, y: 0 };
      s += d.curve(Array.from({ length: 241 }, (_, i) => ({ x: a * Math.cos(i * TAU / 240), y: b * Math.sin(i * TAU / 240) })), 'ln');
      g = { F1, F2, d1: V.dist(P, F1), d2: V.dist(P, F2), a, b, c };
      s += d.line(P, F1, 'ln-b') + d.line(P, F2, 'ln-c');
      s += d.dot({ x: 0, y: b }, 3.5, 'pt-ink') + d.text({ x: 0, y: b }, `b = ${num(b)}`, 'note', 0, -12);
      s += d.handle('V', { x: a, y: 0 }, { cls: 'pt', r: 5.5, label: `a = ${num(a)}`, lcls: 'val', dirS: { x: 0.5, y: 0.9 }, dist: 22 });
    } else if (kind === 'hyper') {
      const { a, c } = st.hyper, b = Math.sqrt(c * c - a * a), F1 = { x: -c, y: 0 }, F2 = { x: c, y: 0 };
      s += d.infLine({ x: 0, y: 0 }, { x: a, y: b }, 'ln-muted dash') + d.infLine({ x: 0, y: 0 }, { x: a, y: -b }, 'ln-muted dash');
      for (const sg of [1, -1]) s += d.curve(Array.from({ length: 201 }, (_, i) => { const u = -3.2 + 6.4 * i / 200; return { x: sg * a * Math.cosh(u), y: b * Math.sinh(u) }; }), 'ln');
      g = { F1, F2, d1: V.dist(P, F1), d2: V.dist(P, F2), a, b, c };
      s += d.line(P, F1, 'ln-b') + d.line(P, F2, 'ln-c');
      s += d.handle('V', { x: a, y: 0 }, { cls: 'pt', r: 5.5, label: `a = ${num(a)}`, lcls: 'val', dirS: { x: -0.4, y: 0.9 }, dist: 22 });
    } else {
      const { p } = st.parab, F2 = { x: p, y: 0 }, H = { x: -p, y: P.y };
      s += d.line({ x: -p, y: -50 }, { x: -p, y: 50 }, 'ln-muted dash') + d.text({ x: -p, y: 0 }, `x = −${coef(p)}`, 'note', -34, -12);
      s += d.curve(Array.from({ length: 241 }, (_, i) => { const y = -8 + 16 * i / 240; return { x: y * y / (4 * p), y }; }), 'ln');
      s += d.line(P, F2, 'ln-b') + d.line(P, H, 'ln-c') + d.right(H, P, { x: -p, y: P.y + 1 }, 9, 'ln-c') + d.dot(H, 4.5, 'pt-c') + d.label(H, 'H', 'lbl t-c', P, 16);
      g = { F2, H, d1: V.dist(P, F2), d2: V.dist(P, H), p };
    }
    if (g.F1) s += d.dot(g.F1, 5.5, 'pt-b') + d.text(g.F1, 'F′', 'lbl t-b', 0, 20);
    s += d.handle('F', g.F2, { cls: kind === 'parab' ? 'pt-b' : 'pt-c', label: 'F', lcls: kind === 'parab' ? 't-b' : 't-c', dirS: { x: 0, y: 1 } });
    s += d.handle('P', P, { cls: 'pt-acc', label: 'P', lcls: 't-acc', dirS: { x: 0.6, y: -0.8 } });
    return s;
  },
  after: () => {
    const lab = (k, v) => setHTML(k, v);
    if (kind === 'ellipse') {
      const { a, b, c, d1, d2 } = g;
      setHTML('def', '<span class="m cb">PF′</span> + <span class="m cc">PF</span> = 2<span class="m ca">a</span> (일정)');
      setText('stmt', '두 초점에서의 거리의 합이 일정한 점의 자취가 타원입니다. 핀 두 개에 끈을 걸고 연필로 그리는 방법과 같아요.');
      setText('vEq', `x²/${coef(a * a)} + y²/${coef(b * b)} = 1`); lab('kC', '<span class="m">b</span>² = <span class="m">a</span>² − <span class="m">c</span>²'); setText('vC', `${coef(b * b)} = ${coef(a * a)} − ${coef(c * c)}`);
      lab('k1', '<span class="m">PF′</span>'); setText('v1', num(d1, 3)); lab('k2', '<span class="m">PF</span>'); setText('v2', num(d2, 3));
      lab('k3', '<span class="m">PF′</span> + <span class="m">PF</span>'); setText('v3', `${num(d1 + d2, 3)} = 2 × ${num(a)}`);
      status('status', c < 0.05 ? 'info' : 'ok', c < 0.05 ? '두 초점이 겹치면 타원은 원이 돼요.' : `P가 어디에 있든 두 거리의 합은 ${num(2 * a, 3)}로 일정합니다.`);
      setText('help', '점 F를 끌면 초점 사이 거리가, 오른쪽 꼭짓점을 끌면 장축의 길이 2a가 바뀝니다. 초점을 중심으로 모을수록 원에 가까워져요.');
    } else if (kind === 'hyper') {
      const { a, b, c, d1, d2 } = g;
      setHTML('def', '|<span class="m cb">PF′</span> − <span class="m cc">PF</span>| = 2<span class="m ca">a</span> (일정)');
      setText('stmt', '두 초점에서의 거리의 차가 일정한 점의 자취가 쌍곡선입니다. 점선은 곡선이 한없이 다가가는 점근선이에요.');
      setText('vEq', `x²/${coef(a * a)} − y²/${coef(b * b)} = 1`); lab('kC', '<span class="m">b</span>² = <span class="m">c</span>² − <span class="m">a</span>²'); setText('vC', `${coef(b * b)} = ${coef(c * c)} − ${coef(a * a)}`);
      lab('k1', '<span class="m">PF′</span>'); setText('v1', num(d1, 3)); lab('k2', '<span class="m">PF</span>'); setText('v2', num(d2, 3));
      lab('k3', '|<span class="m">PF′</span> − <span class="m">PF</span>|'); setText('v3', `${num(Math.abs(d1 - d2), 3)} = 2 × ${num(a)}`);
      status('status', 'ok', `P를 다른 가지로 옮겨도 두 거리의 차는 ${num(2 * a, 3)}로 일정합니다. 점근선: y = ±${num(b / a, 3)}x`);
      setText('help', '점 P를 왼쪽 가지로 끌어 보세요. 점 F를 끌면 초점이, 꼭짓점을 끌면 a가 바뀝니다.');
    } else {
      const { p, d1, d2 } = g;
      setHTML('def', '<span class="m cb">PF</span> = <span class="m cc">PH</span> (초점까지 = 준선까지)');
      setText('stmt', '한 점(초점)과 한 직선(준선)에서 같은 거리에 있는 점의 자취가 포물선입니다.');
      setText('vEq', `y² = ${coef(4 * p)}x`); lab('kC', '초점, 준선'); setText('vC', `F(${coef(p)}, 0), x = −${coef(p)}`);
      lab('k1', '<span class="m">PF</span>'); setText('v1', num(d1, 3)); lab('k2', '<span class="m">PH</span> (준선까지)'); setText('v2', num(d2, 3));
      lab('k3', '<span class="m">PF</span> − <span class="m">PH</span>'); setText('v3', num(d1 - d2, 4));
      status('status', 'ok', '포물선 위의 모든 점은 초점과 준선에서 같은 거리에 있어요. 초점을 멀리 옮기면 포물선이 넓어집니다.');
      setText('help', '점 F를 끌면 초점과 준선이 함께 움직입니다. P를 곡선을 따라 끌어 두 거리를 비교해 보세요.');
    }
  },
});

let ph = 0;
const anim = loop(dt => {
  ph += dt / 1000;
  if (kind === 'ellipse') st.ellipse.t = (st.ellipse.t + dt * 0.0012) % TAU;
  else if (kind === 'hyper') { st.hyper.u = 2 * Math.sin(ph); if (Math.abs(Math.sin(ph)) < 0.02 && Math.cos(ph) > 0) st.hyper.s *= -1; }
  else st.parab.y = 4 * Math.sin(ph);
  stage.render();
}, 'play', ['▶ P 움직이기', '❚❚ 멈추기']);
onSeg('kind', v => { kind = v; stage.refit(); });
onClick('reset', () => { anim.stop(); st = structuredClone(DEF); stage.refit(); });
