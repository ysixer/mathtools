import { Stage } from '/shared/stage.js';
import { V, TAU, mod, clamp } from '/shared/geometry.js';
import { $, num, deg, coef, setText, status, show, onToggle, onSlider, onClick, loop, mountNav } from '/shared/ui.js';

mountNav();
const O = { x: -1.8, y: 0 };
let th = Math.PI / 3, opt = { sin: true, cos: false, tan: false, tr: false }, A = 1.5, B = 2;
const piFmt = v => {
  if (v < -1e-9) return '';
  const k = Math.round(v / (Math.PI / 2));
  return ['0', 'π/2', 'π', '3π/2', '2π', '5π/2', '3π', '7π/2', '4π'][k] ?? `${k}π/2`;
};
const radTxt = t => { const k = t / Math.PI; return Math.abs(k) < 1e-9 ? '0' : `${coef(k, 3)}π`; };

const stage = new Stage($('#cv'), {
  axes: { xStep: Math.PI / 2, xFmt: piFmt },
  bounds: () => [{ x: O.x - 1.1, y: -1.6 }, { x: TAU + 0.3, y: 1.6 }],
  onGrab: () => anim.stop(),
  drag: (k, p) => { th = k === 'P' ? mod(V.ang(V.sub(p, O))) : clamp(p.x, 0, TAU); },
  draw: d => {
    const P = V.add(O, V.dir(th)), cs = Math.cos(th), sn = Math.sin(th), tn = Math.tan(th);
    const Cx = { x: O.x + cs, y: 0 };
    let s = d.circle(O, 1, 'ln-muted') + d.line({ x: O.x - 1.25, y: 0 }, { x: O.x + 1.25, y: 0 }, 'ln-muted thin') + d.line({ x: O.x, y: -1.25 }, { x: O.x, y: 1.25 }, 'ln-muted thin');
    s += d.sectorPx(O, 20, 0, th, 'wd-ink') + d.line(O, P);
    s += d.line({ x: th, y: -1.6 }, { x: th, y: 1.6 }, 'ln-muted dots');
    if (opt.tr) s += d.fn(x => A * Math.sin(B * x), 'ln-proof dash', { x0: 0, x1: TAU });
    if (opt.tan) {
      for (const x of [Math.PI / 2, 3 * Math.PI / 2]) s += d.line({ x, y: -3.5 }, { x, y: 3.5 }, 'ln-q thin dash faint');
      s += d.fn(Math.tan, 'ln-q', { x0: 0, x1: TAU, n: 1200 });
      if (Math.abs(Math.cos(th)) > 0.08) {
        const T = { x: O.x + 1, y: tn };
        s += d.line({ x: O.x + 1, y: 0 }, T, 'ln-q thick') + d.line(O, T, 'ln-muted dots') + d.dot(T, 4, 'pt-q');
        if (Math.abs(tn) < 3.5) s += d.dot({ x: th, y: tn }, 5, 'pt-q');
      }
    }
    if (opt.cos) {
      s += d.fn(Math.cos, 'ln-c', { x0: 0, x1: TAU });
      s += d.line(O, Cx, 'ln-c thick') + d.dot({ x: th, y: cs }, 6, 'pt-c');
    }
    if (opt.sin) {
      s += d.fn(Math.sin, 'ln-b', { x0: 0, x1: TAU });
      s += d.line(Cx, P, 'ln-b thick') + d.line(P, { x: th, y: sn }, 'ln-b thin dots');
    }
    const gy = opt.sin ? sn : opt.cos ? cs : 0;
    s += d.handle('G', { x: th, y: gy }, { cls: opt.sin ? 'pt-b' : opt.cos ? 'pt-c' : 'pt', r: 6.5 });
    s += d.handle('P', P, { cls: 'pt-acc', label: 'P', lcls: 't-acc', away: O });
    return s;
  },
  after: () => {
    setText('vT', `${deg(th)} = ${radTxt(th)}`);
    setText('vS', num(Math.sin(th), 4)); setText('vC', num(Math.cos(th), 4));
    setText('vTan', Math.abs(Math.cos(th)) < 1e-6 ? '정의되지 않음' : num(Math.tan(th), 4));
    show('secTr', opt.tr);
    if (opt.tr) setText('trInfo', `최댓값 ${coef(A)}, 최솟값 −${coef(A)}, 주기 2π/${coef(B)} = ${radTxt(TAU / B)}. B가 커질수록 그래프가 좁아져요.`);
    const sgn = v => Math.abs(v) < 1e-9 ? '= 0' : v > 0 ? '> 0' : '< 0';
    const onAxis = Math.abs(Math.sin(th)) < 1e-9 || Math.abs(Math.cos(th)) < 1e-9;
    const q = Math.floor(mod(th) / (Math.PI / 2)) + 1;
    status('status', 'ok', `${onAxis ? 'P는 좌표축 위에 있어요.' : `P는 제${q}사분면에 있어요.`} sin θ ${sgn(Math.sin(th))}, cos θ ${sgn(Math.cos(th))}. 2π마다 같은 값이 반복되는 것이 주기예요.`);
  },
});

const anim = loop(dt => { th = mod(th + dt * 0.0011); stage.render(); }, 'play', ['▶ 회전', '❚❚ 멈추기']);
opt.sin = onToggle('tSin', v => { opt.sin = v; stage.request(); });
opt.cos = onToggle('tCos', v => { opt.cos = v; stage.request(); });
opt.tan = onToggle('tTan', v => { opt.tan = v; stage.request(); });
opt.tr = onToggle('tTr', v => { opt.tr = v; stage.request(); });
onSlider('amp', v => { A = v; stage.request(); }, v => coef(v));
onSlider('frq', v => { B = v; stage.request(); }, v => coef(v));
for (const [id, t] of [['d30', Math.PI / 6], ['d90', Math.PI / 2], ['d180', Math.PI], ['d270', 1.5 * Math.PI]]) onClick(id, () => { anim.stop(); th = t; stage.request(); });
