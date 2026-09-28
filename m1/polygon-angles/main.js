import { Stage } from '/shared/stage.js';
import { V, TAU, mod, polyArea, segmentsCross } from '/shared/geometry.js';
import { $, deg, setText, status, onToggle, onSlider, onClick, mountNav } from '/shared/ui.js';

mountNav();
const R = 2;
let n = 5, pts = [], opt = { fan: true, ang: true, ext: false }, g = {};
const regular = () => { pts = Array.from({ length: n }, (_, i) => V.mul(V.dir(Math.PI / 2 + i * TAU / n), R)); };
regular();

function analyse() {
  const area = polyArea(pts), orient = area >= 0 ? 1 : -1;
  const turn = pts.map((v, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const e1 = V.sub(v, a), e2 = V.sub(b, v);
    return Math.atan2(V.cross(e1, e2), V.dot(e1, e2));
  });
  const interior = turn.map(t => Math.PI - orient * t);
  let simple = Math.abs(area) > 1e-3;
  for (let i = 0; i < n && simple; i++) for (let j = i + 1; j < n; j++) {
    if (j - i <= 1 || (i === 0 && j === n - 1)) continue;
    if (segmentsCross(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) { simple = false; break; }
  }
  const convex = simple && turn.every(t => orient * t > 0);
  return { orient, turn, interior, simple, convex, sum: interior.reduce((a, b) => a + b, 0), extSum: turn.reduce((a, b) => a + b, 0) * orient };
}

const stage = new Stage($('#cv'), {
  bounds: () => [...pts, { x: -R, y: -R }, { x: R, y: R }],
  drag: (k, p) => { pts[+k.slice(1)] = p; },
  draw: d => {
    g = analyse();
    let s = d.poly(pts, 'fl-ink');
    if (opt.fan && g.convex) {
      for (let i = 1; i < n - 1; i++) s += d.poly([pts[0], pts[i], pts[i + 1]], i % 2 ? 'fl-b' : 'fl-c');
      for (let i = 2; i < n - 1; i++) s += d.line(pts[0], pts[i], 'ln-muted dash');
    }
    if (opt.ang && g.simple) {
      pts.forEach((v, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
        const aP = V.ang(V.sub(a, v)), aN = V.ang(V.sub(b, v));
        const [a0, len] = g.orient > 0 ? [aN, mod(aP - aN)] : [aP, mod(aN - aP)];
        s += d.sectorPx(v, 22, a0, len, len > Math.PI ? 'wd-acc' : 'wd-ink');
        s += d.labelAt(v, a0 + len / 2, deg(len, 0), 'val' + (len > Math.PI ? ' t-acc' : ''), 42);
      });
    }
    if (opt.ext && g.simple) {
      pts.forEach((v, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
        const e1 = V.sub(v, a), e2 = V.sub(b, v), t = g.turn[i];
        s += d.ray(v, e1, 'ln-q thin dots');
        s += t >= 0 ? d.sectorPx(v, 30, V.ang(e1), t, 'wd-q') : d.sectorPx(v, 30, V.ang(e2), -t, 'wd-acc');
      });
    }
    s += d.poly(pts, 'ln');
    const c = V.mul(pts.reduce((acc, p) => V.add(acc, p), { x: 0, y: 0 }), 1 / n);
    pts.forEach((p, i) => { s += d.handle('v' + i, p, { label: i === 0 && opt.fan ? 'P' : '', away: c, r: 6.5 }); });
    return s;
  },
  after: () => {
    setText('vTri', n - 2 + '개');
    setText('vFormula', (180 * (n - 2)) + '°');
    setText('vSum', g.simple ? deg(g.sum) : '–');
    setText('vRegular', deg((n - 2) * Math.PI / n));
    setText('vExt', g.simple ? deg(g.extSum) : '–');
    if (!g.simple) status('status', 'warn', '변끼리 교차하면 다각형이 아니에요. 꼭짓점을 풀어 주세요.');
    else if (!g.convex) status('status', 'info', `오목다각형이에요. 180°보다 큰 내각(분홍)까지 더하면 합은 여전히 ${180 * (n - 2)}°입니다.`);
    else status('status', 'ok', `${n}각형 = 삼각형 ${n - 2}개 → 180° × ${n - 2} = ${180 * (n - 2)}°. 모양을 바꿔도 합은 그대로예요.`);
  },
});

onSlider('n', v => { n = v; regular(); stage.request(); });
opt.fan = onToggle('tFan', v => { opt.fan = v; stage.request(); });
opt.ang = onToggle('tAng', v => { opt.ang = v; stage.request(); });
opt.ext = onToggle('tExt', v => { opt.ext = v; stage.request(); });
onClick('regular', () => { regular(); stage.refit(); });
onClick('rand', () => {
  for (let k = 0; k < 100; k++) {
    const old = pts;
    pts = Array.from({ length: n }, (_, i) => V.mul(V.dir(Math.PI / 2 + i * TAU / n + (Math.random() - 0.5) * 0.5), R * (0.7 + Math.random() * 0.45)));
    if (analyse().convex) break;
    pts = old;
  }
  stage.request();
});
