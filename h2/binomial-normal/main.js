import { Stage } from '/shared/stage.js';
import { $, num, setText, status, onSlider, onToggle, onClick, loop, mountNav } from '/shared/ui.js';

mountNav();
const LF = [0]; for (let i = 1; i <= 200; i++) LF[i] = LF[i - 1] + Math.log(i);
let n = 10, p = 0.3, norm = true, sig = true, g = {};
const pmf = k => Math.exp(LF[n] - LF[k] - LF[n - k] + k * Math.log(p) + (n - k) * Math.log(1 - p));
const pdf = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));

const stage = new Stage($('#cv'), {
  axes: {},
  lockAspect: false,
  pad: 40,
  bounds: () => { let mx = 0; for (let k = 0; k <= n; k++) mx = Math.max(mx, pmf(k)); return [{ x: -1, y: -mx * 0.04 }, { x: n + 1, y: mx * 1.12 }]; },
  draw: d => {
    const m = n * p, sd = Math.sqrt(n * p * (1 - p));
    let s = '', diff = 0;
    for (let k = 0; k <= n; k++) {
      const y = pmf(k), w = 0.42;
      s += d.poly([{ x: k - w, y: 0 }, { x: k + w, y: 0 }, { x: k + w, y }, { x: k - w, y }], 'fl-b') + (n <= 60 ? d.poly([{ x: k - w, y: 0 }, { x: k + w, y: 0 }, { x: k + w, y }, { x: k - w, y }], 'ln-b thin') : '');
      if (sd > 0) diff = Math.max(diff, Math.abs(y - pdf(k, m, sd)));
    }
    if (sig && sd > 0) {
      const top = stage.visible().y1;
      s += d.line({ x: m, y: 0 }, { x: m, y: top }, 'ln-q dash');
      s += d.line({ x: m - sd, y: 0 }, { x: m - sd, y: top }, 'ln-q thin dots') + d.line({ x: m + sd, y: 0 }, { x: m + sd, y: top }, 'ln-q thin dots');
      s += d.text({ x: m, y: top }, 'np', 'note t-q', 0, 14) + d.text({ x: m - sd, y: top }, '−σ', 'note t-q', 0, 14) + d.text({ x: m + sd, y: top }, '+σ', 'note t-q', 0, 14);
    }
    if (norm && sd > 0) s += d.fn(x => pdf(x, m, sd), 'ln-acc');
    g = { m, sd, diff };
    return s;
  },
  after: () => {
    const { m, sd, diff } = g, q = 1 - p;
    setText('vM', num(m, 2)); setText('vV', num(n * p * q, 3)); setText('vS', num(sd, 3));
    setText('vNp', `${num(n * p, 1)}, ${num(n * q, 1)}`); setText('vDiff', num(diff, 4));
    const good = n * p >= 5 && n * q >= 5;
    status('status', good ? 'ok' : 'info', good ? `np, nq가 모두 5 이상이라 정규분포 N(${num(m, 1)}, ${num(sd, 2)}²)로 잘 근사돼요.` : 'np 또는 nq가 5보다 작아요. 분포가 한쪽으로 치우쳐 정규분포와 차이가 커요. n을 키워 보세요.');
  },
});

const sn = onSlider('n', v => { n = v; stage.refit(); }, v => String(v));
onSlider('p', v => { p = v; stage.refit(); }, v => v.toFixed(2));
norm = onToggle('tNorm', v => { norm = v; stage.request(); });
sig = onToggle('tSig', v => { sig = v; stage.request(); });
let acc = 0;
const anim = loop(dt => { acc += dt; if (acc < 110) return; acc = 0; n = n >= 100 ? 1 : n + 1; sn.set(n); stage.fit(); stage.render(); }, 'play', ['▶ n 키우기', '❚❚ 멈추기']);
onClick('reset', () => { anim.stop(); n = 10; p = 0.3; sn.set(10); document.getElementById('p').value = 0.3; document.getElementById('p-out').textContent = '0.30'; stage.refit(); });
