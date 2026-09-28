// 패널 UI 도우미: 값 표시, 상태 문구, 막대, 토글·슬라이더·버튼 바인딩, 애니메이션 루프, 이전/다음 도구 이동.
import { R2D, clamp } from './geometry.js';
import { GRADES } from './tools.js';

export const $ = s => document.querySelector(s);
export const byId = id => document.getElementById(id);

/** 숫자 표시 (음수 기호는 수학 기호 −) */
export function num(n, d = 2) {
  if (n === Infinity) return '∞';
  if (n === -Infinity) return '−∞';
  if (!isFinite(n)) return '–';
  const s = Math.abs(n) >= 1e5 ? n.toExponential(2) : n.toFixed(d);
  return s.replace('-', '−');
}
/** 불필요한 0을 뺀 계수 표시 (1.50 → 1.5) */
export const coef = (n, d = 2) => num(+n.toFixed(d), d).replace(/\.?0+$/, '') || '0';
export const deg = (r, d = 1) => isFinite(r) ? (r * R2D).toFixed(d) + '°' : '–';

export function setText(id, t) { const e = byId(id); if (e) e.textContent = t; }
export function setHTML(id, t) { const e = byId(id); if (e) e.innerHTML = t; }
export function show(id, on) { const e = byId(id); if (e) e.hidden = !on; }
/** kind: 'ok' | 'warn' | 'info' */
export function status(id, kind, text) { const e = byId(id); if (!e) return; e.className = 'status ' + (kind || ''); e.textContent = text; }
export function bar(id, frac) { const e = byId(id); if (e) e.style.width = (clamp(isFinite(frac) ? frac : 0, 0, 1) * 100) + '%'; }
/** 조건 체크 목록 항목 */
export function check(id, ok) { const e = byId(id); if (e) { e.classList.toggle('yes', !!ok); e.classList.toggle('no', !ok); } }

export function onToggle(id, cb) {
  const e = byId(id);
  e.addEventListener('change', () => cb(e.checked));
  return e.checked;
}
export function onClick(id, cb) { byId(id).addEventListener('click', cb); }
/** <input type=range id> 와 <output id="{id}-out"> 연결 */
export function onSlider(id, cb, fmt = v => v) {
  const e = byId(id), out = byId(id + '-out');
  const upd = () => { const v = parseFloat(e.value); if (out) out.textContent = fmt(v); cb(v); };
  e.addEventListener('input', upd);
  const v0 = parseFloat(e.value); if (out) out.textContent = fmt(v0);
  return { get value() { return parseFloat(e.value); }, set(v) { e.value = v; if (out) out.textContent = fmt(parseFloat(e.value)); } };
}
/** name이 같은 라디오 버튼 묶음 */
export function onSeg(name, cb) {
  const els = [...document.querySelectorAll(`input[name="${name}"]`)];
  els.forEach(e => e.addEventListener('change', () => e.checked && cb(e.value)));
  return els.find(e => e.checked)?.value;
}
export function setSeg(name, value) { const e = document.querySelector(`input[name="${name}"][value="${value}"]`); if (e) e.checked = true; }

/** requestAnimationFrame 루프. step(dtMs)가 false를 돌려주면 멈춘다. button이 있으면 라벨을 바꾼다. */
export function loop(step, buttonId, labels = ['▶ 재생', '❚❚ 멈추기']) {
  let id = 0, last = null, running = false;
  const btn = buttonId ? byId(buttonId) : null;
  const paint = () => { if (btn) btn.textContent = running ? labels[1] : labels[0]; };
  const frame = ts => {
    const dt = last == null ? 0 : Math.min(50, ts - last); last = ts;
    if (step(dt) === false) { api.stop(); return; }
    if (running) id = requestAnimationFrame(frame);
  };
  const api = {
    get running() { return running; },
    start() { if (running) return; running = true; last = null; id = requestAnimationFrame(frame); paint(); },
    stop() { running = false; cancelAnimationFrame(id); paint(); },
    toggle() { running ? api.stop() : api.start(); },
  };
  if (btn) { btn.addEventListener('click', api.toggle); paint(); }
  return api;
}

/** 머리글의 이전/다음 도구 링크 */
export function mountNav() {
  const list = GRADES.flatMap(g => g.tools.map(t => ({ ...t, url: `/${g.id}/${t.slug}/`, grade: g.short })));
  const here = location.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/');
  const i = list.findIndex(t => t.url === here);
  const nav = byId('pager');
  if (i < 0 || !nav) return;
  const a = (t, cls, arrowFirst) => t ? `<a class="${cls}" href="${t.url}">${arrowFirst ? '← ' : ''}<span>${t.grade} · ${t.title}</span>${arrowFirst ? '' : ' →'}</a>` : '<span></span>';
  nav.innerHTML = a(list[i - 1], 'prev', true) + a(list[i + 1], 'next', false);
}
