// SVG 스테이지: 월드↔화면 변환, 격자/좌표축, 이동·확대, 점 끌기, 렌더 루프를 담당한다.
// 각 도구는 draw(d) 로 마크업만 돌려주고, drag(key, p) 로 상태만 바꾸면 된다.
import { Draw } from './draw.js';

const niceStep = t => { const p = Math.pow(10, Math.floor(Math.log10(t))); for (const m of [1, 2, 5, 10]) if (p * m >= t) return p * m; return p * 10; };
export const trimNum = v => String(+v.toFixed(6)).replace('-', '−');

export class Stage {
  /**
   * @param {SVGSVGElement} svg
   * @param {object} o
   *  bounds(): 월드 점 배열 (전체 보기 범위)
   *  draw(d): SVG 마크업 문자열
   *  drag(key, p): 점 key가 월드 좌표 p로 끌렸을 때
   *  after(): 렌더 직후 (패널 갱신)
   *  onGrab(key): 끌기 시작
   *  yUp(기본 true), lockAspect(기본 true), grid(기본 true)
   *  axes: null | { xStep, xFmt, yStep, yFmt }
   */
  constructor(svg, o) {
    this.svg = svg;
    this.o = Object.assign({ yUp: true, lockAspect: true, grid: true, axes: null, pad: 56 }, o);
    this.v = { sx: 60, sy: 60, ox: 0, oy: 0 };
    this.fitted = false; this.active = null; this.drag = null; this.raf = 0;
    this.d = new Draw(this);
    this._bind();
    new ResizeObserver(() => this.request()).observe(svg);
    this.request();
  }
  get w() { return this.svg.clientWidth; }
  get h() { return this.svg.clientHeight; }
  toS(p) { return { x: p.x * this.v.sx + this.v.ox, y: (this.o.yUp ? -p.y : p.y) * this.v.sy + this.v.oy }; }
  toW(q) { return { x: (q.x - this.v.ox) / this.v.sx, y: (this.o.yUp ? -1 : 1) * (q.y - this.v.oy) / this.v.sy }; }
  visible() {
    const a = this.toW({ x: 0, y: 0 }), b = this.toW({ x: this.w, y: this.h });
    return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y) };
  }
  fit() {
    const w = this.w, h = this.h;
    if (!w || !h) return;
    const ps = this.o.bounds().filter(p => p && isFinite(p.x) && isFinite(p.y));
    if (!ps.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of ps) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    const pad = Math.min(this.o.pad, Math.min(w, h) * 0.14);
    const bw = Math.max(x1 - x0, 1e-3), bh = Math.max(y1 - y0, 1e-3);
    let sx = (w - 2 * pad) / bw, sy = (h - 2 * pad) / bh;
    if (this.o.lockAspect) sx = sy = Math.min(sx, sy);
    this.v.sx = sx; this.v.sy = sy;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    this.v.ox = w / 2 - cx * sx;
    this.v.oy = h / 2 - (this.o.yUp ? -cy : cy) * sy;
  }
  refit() { this.fit(); this.request(); }
  zoomAt(m, f) {
    const wp = this.toW(m);
    this.v.sx *= f; this.v.sy *= f;
    this.v.ox = m.x - wp.x * this.v.sx;
    this.v.oy = m.y - (this.o.yUp ? -wp.y : wp.y) * this.v.sy;
    this.request();
  }
  request() { if (!this.raf) this.raf = requestAnimationFrame(() => { this.raf = 0; this.render(); }); }
  render() {
    if (!this.w || !this.h) return;
    if (!this.fitted) { this.fit(); this.fitted = true; }
    this.svg.innerHTML = this._grid() + this.o.draw(this.d);
    this.o.after?.();
  }
  _grid() {
    const w = this.w, h = this.h, vis = this.visible(), ax = this.o.axes;
    let sx = ax?.xStep || niceStep(55 / this.v.sx); while (sx * this.v.sx < 42) sx *= 2;
    let sy = ax?.yStep || niceStep(55 / this.v.sy); while (sy * this.v.sy < 34) sy *= 2;
    let g = '', t = '';
    const xs = [], ys = [];
    for (let x = Math.ceil(vis.x0 / sx) * sx; x <= vis.x1; x += sx) xs.push(x);
    for (let y = Math.ceil(vis.y0 / sy) * sy; y <= vis.y1; y += sy) ys.push(y);
    if (this.o.grid) {
      for (const x of xs) g += `M${this.toS({ x, y: 0 }).x.toFixed(1)} 0V${h}`;
      for (const y of ys) g += `M0 ${this.toS({ x: 0, y }).y.toFixed(1)}H${w}`;
    }
    let s = `<path class="grid" d="${g}"/>`;
    if (ax) {
      const o = this.toS({ x: 0, y: 0 });
      let a = '';
      if (o.y >= 0 && o.y <= h) a += `M0 ${o.y.toFixed(1)}H${w}`;
      if (o.x >= 0 && o.x <= w) a += `M${o.x.toFixed(1)} 0V${h}`;
      s += `<path class="axis" d="${a}"/>`;
      const ly = Math.max(12, Math.min(h - 10, o.y + 15)), lx = Math.max(30, Math.min(w - 4, o.x - 7));
      for (const x of xs) {
        if (Math.abs(x) < sx * 1e-6) continue;
        const txt = (ax.xFmt || trimNum)(x);
        if (txt) t += `<text class="tick" x="${this.toS({ x, y: 0 }).x.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${txt}</text>`;
      }
      for (const y of ys) {
        if (Math.abs(y) < sy * 1e-6) continue;
        const txt = (ax.yFmt || trimNum)(y);
        if (txt) t += `<text class="tick" x="${lx.toFixed(1)}" y="${this.toS({ x: 0, y }).y.toFixed(1)}" text-anchor="end" dominant-baseline="middle">${txt}</text>`;
      }
      if (o.x > 0 && o.x < w && o.y > 0 && o.y < h) t += `<text class="tick" x="${(o.x - 8).toFixed(1)}" y="${(o.y + 14).toFixed(1)}" text-anchor="end">O</text>`;
    }
    return s + t;
  }
  _bind() {
    const svg = this.svg;
    const m = e => { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    svg.addEventListener('pointerdown', e => {
      if (this.drag) return;
      const pm = m(e), t = e.target.closest?.('[data-h]');
      if (t) {
        const pw = this.toW(pm), off = t.dataset.x !== undefined ? { x: +t.dataset.x - pw.x, y: +t.dataset.y - pw.y } : { x: 0, y: 0 };
        this.drag = { id: e.pointerId, key: t.dataset.h, off };
        this.active = t.dataset.h;
        this.o.onGrab?.(t.dataset.h);
      } else {
        this.drag = { id: e.pointerId, pan: true, sx: pm.x, sy: pm.y, ox: this.v.ox, oy: this.v.oy };
      }
      svg.setPointerCapture(e.pointerId);
      svg.classList.add('dragging');
      e.preventDefault();
      this.request();
    });
    svg.addEventListener('pointermove', e => {
      const dr = this.drag;
      if (!dr || e.pointerId !== dr.id) return;
      const pm = m(e);
      if (dr.pan) { this.v.ox = dr.ox + pm.x - dr.sx; this.v.oy = dr.oy + pm.y - dr.sy; }
      else { const pw = this.toW(pm); this.o.drag?.(dr.key, { x: pw.x + dr.off.x, y: pw.y + dr.off.y }); }
      this.request();
    });
    const end = e => {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      this.drag = null; this.active = null;
      svg.classList.remove('dragging');
      this.o.onRelease?.();
      this.request();
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', e => { e.preventDefault(); this.zoomAt(m(e), Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
    svg.parentElement.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => {
      const z = b.dataset.zoom;
      if (z === 'fit') this.refit();
      else this.zoomAt({ x: this.w / 2, y: this.h / 2 }, z === 'in' ? 1.25 : 0.8);
    }));
  }
}
