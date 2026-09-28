// SVG 마크업 생성 도우미. 입력은 월드 좌표, 출력은 화면 좌표 문자열.
import { V, TAU, mod } from './geometry.js';

const r1 = n => Math.round(n * 10) / 10;
const P = s => `${r1(s.x)} ${r1(s.y)}`;

export class Draw {
  constructor(stage) { this.st = stage; }
  S(p) { return this.st.toS(p); }
  /** 월드 각도(반시계) → 화면 각도 */
  _w2s(a0, len) { return this.st.o.yUp ? [-(a0 + len), len] : [a0, len]; }

  lineS(p, q, cls) { return `<line x1="${r1(p.x)}" y1="${r1(p.y)}" x2="${r1(q.x)}" y2="${r1(q.y)}" class="${cls}"/>`; }
  line(a, b, cls = 'ln') { return this.lineS(this.S(a), this.S(b), cls); }
  infLine(p, dir, cls = 'ln') {
    const a = this.S(p), u = V.norm(V.sub(this.S(V.add(p, dir)), a));
    return this.lineS(V.add(a, V.mul(u, -8000)), V.add(a, V.mul(u, 8000)), cls);
  }
  ray(p, dir, cls = 'ln') {
    const a = this.S(p), u = V.norm(V.sub(this.S(V.add(p, dir)), a));
    return this.lineS(a, V.add(a, V.mul(u, 8000)), cls);
  }
  poly(pts, cls, close = true) {
    return `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + P(this.S(p))).join('')}${close ? 'Z' : ''}" class="${cls}"/>`;
  }
  /** 함수 그래프 y = f(x). 보이는 범위만 샘플링하고 발산 구간은 끊어 그린다. */
  fn(f, cls, { x0 = -Infinity, x1 = Infinity, n = 600 } = {}) {
    const vis = this.st.visible();
    const a = Math.max(x0, vis.x0), b = Math.min(x1, vis.x1);
    if (!(a < b)) return '';
    const pts = [];
    for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; pts.push({ x, y: f(x) }); }
    return this.curve(pts, cls);
  }
  /** 매개변수 곡선 등 점 배열을 끊김 처리하며 그린다 */
  curve(pts, cls) {
    const vis = this.st.visible(), span = vis.y1 - vis.y0;
    let d = '', pen = false;
    for (const p of pts) {
      if (!isFinite(p.y) || !isFinite(p.x) || p.y > vis.y1 + span * 2 || p.y < vis.y0 - span * 2) { pen = false; continue; }
      d += (pen ? 'L' : 'M') + P(this.S(p)); pen = true;
    }
    return d ? `<path d="${d}" class="${cls}"/>` : '';
  }
  circle(c, r, cls = 'ln') { const s = this.S(c); return `<circle cx="${r1(s.x)}" cy="${r1(s.y)}" r="${r1(r * this.st.v.sx)}" class="${cls}"/>`; }
  /** 원 테두리를 끌기 위한 투명한 두꺼운 링 */
  ring(key, c, r) { const s = this.S(c); return `<circle data-h="${key}" cx="${r1(s.x)}" cy="${r1(s.y)}" r="${r1(r * this.st.v.sx)}" class="ring"/>`; }
  dot(p, r = 4.5, cls = 'pt-ink') { const s = this.S(p); return `<circle cx="${r1(s.x)}" cy="${r1(s.y)}" r="${r}" class="${cls}"/>`; }
  textS(s, txt, cls, anchor = 'middle') {
    return `<text x="${r1(s.x)}" y="${r1(s.y)}" class="${cls}" text-anchor="${anchor}" dominant-baseline="middle">${txt}</text>`;
  }
  text(p, txt, cls, dx = 0, dy = 0) { const s = this.S(p); return this.textS({ x: s.x + dx, y: s.y + dy }, txt, cls); }
  /** away 점의 반대 방향으로 dist(px)만큼 떨어뜨린 라벨 */
  label(p, txt, cls, away, dist = 20) {
    const s = this.S(p); let u = V.norm(V.sub(s, this.S(away)));
    if (!isFinite(u.x) || (u.x === 0 && u.y === 0)) u = { x: 0, y: -1 };
    return this.textS(V.add(s, V.mul(u, dist)), txt, cls);
  }
  /** 월드 각도 t 방향으로 dist(px) 떨어뜨린 라벨 */
  labelAt(p, t, txt, cls, dist = 20) {
    const s = this.S(p), u = this.st.o.yUp ? { x: Math.cos(t), y: -Math.sin(t) } : V.dir(t);
    return this.textS(V.add(s, V.mul(u, dist)), txt, cls);
  }
  arcPathS(c, r, t0, len) {
    const p1 = V.add(c, V.mul(V.dir(t0), r)), p2 = V.add(c, V.mul(V.dir(t0 + len), r));
    return `M${P(p1)}A${r1(r)} ${r1(r)} 0 ${len > Math.PI ? 1 : 0} 1 ${P(p2)}`;
  }
  sectorS(c, r, t0, len, cls) {
    if (len >= TAU - 1e-6) return `<circle cx="${r1(c.x)}" cy="${r1(c.y)}" r="${r1(r)}" class="${cls}"/>`;
    if (len <= 1e-6) return '';
    return `<path d="M${P(c)}L${this.arcPathS(c, r, t0, len).slice(1)}Z" class="${cls}"/>`;
  }
  /** 월드 반지름 r의 원호 (a0에서 반시계로 len) */
  arcW(c, r, a0, len, cls) { const [t, l] = this._w2s(a0, len); return `<path d="${this.arcPathS(this.S(c), r * this.st.v.sx, t, l)}" class="${cls}"/>`; }
  sectorW(c, r, a0, len, cls) { const [t, l] = this._w2s(a0, len); return this.sectorS(this.S(c), r * this.st.v.sx, t, l, cls); }
  /** 화면 반지름(px) 고정 부채꼴, 각도는 월드 기준 */
  sectorPx(c, rpx, a0, len, cls) { const [t, l] = this._w2s(a0, len); return this.sectorS(this.S(c), rpx, t, l, cls); }

  /** 꼭짓점 v의 ∠avb (작은 쪽) 부채꼴. opt: label, lcls, right(직각 표시), gap */
  angle(v, a, b, r, cls, o = {}) {
    const vs = this.S(v), u1 = V.sub(this.S(a), vs), u2 = V.sub(this.S(b), vs);
    let t0 = Math.atan2(u1.y, u1.x), len = mod(Math.atan2(u2.y, u2.x) - t0);
    if (len > Math.PI) { t0 += len; len = TAU - len; }
    let s = (o.right && Math.abs(len - Math.PI / 2) < 0.006) ? this.right(v, a, b, 12, o.rcls || 'ln') : this.sectorS(vs, r, t0, len, cls);
    if (o.label != null) s += this.textS(V.add(vs, V.mul(V.dir(t0 + len / 2), r + (o.gap ?? 17))), o.label, 'val ' + (o.lcls || ''));
    return s;
  }
  /** 채우지 않은 각 표시(호 + 눈금). 같은 크기의 각을 나타낼 때 사용 */
  mark(v, a, b, r, ticks = 1, cls = 'ln-proof') {
    const vs = this.S(v), u1 = V.sub(this.S(a), vs), u2 = V.sub(this.S(b), vs);
    let t0 = Math.atan2(u1.y, u1.x), len = mod(Math.atan2(u2.y, u2.x) - t0);
    if (len > Math.PI) { t0 += len; len = TAU - len; }
    if (len < 0.01) return '';
    let s = `<path d="${this.arcPathS(vs, r, t0, len)}" class="${cls} nofill"/>`;
    const mid = t0 + len / 2;
    for (let i = 0; i < ticks; i++) {
      const u = V.dir(mid + (i - (ticks - 1) / 2) * Math.min(0.14, len / 4));
      s += this.lineS(V.add(vs, V.mul(u, r - 5)), V.add(vs, V.mul(u, r + 5)), cls);
    }
    return s;
  }
  right(v, a, b, size = 12, cls = 'ln') {
    const vs = this.S(v), u1 = V.norm(V.sub(this.S(a), vs)), u2 = V.norm(V.sub(this.S(b), vs));
    const p1 = V.add(vs, V.mul(u1, size)), p3 = V.add(vs, V.mul(u2, size)), p2 = V.add(p1, V.mul(u2, size));
    return `<path d="M${P(p1)}L${P(p2)}L${P(p3)}" class="${cls} nofill"/>`;
  }
  /** 선분 가운데에 길이가 같음을 나타내는 눈금 */
  ticks(a, b, n = 1, cls = 'ln') {
    const p = this.S(a), q = this.S(b), m = V.mid(p, q), d = V.norm(V.sub(q, p)), nn = V.perp(d);
    let s = '';
    for (let i = 0; i < n; i++) {
      const c = V.add(m, V.mul(d, (i - (n - 1) / 2) * 5));
      s += this.lineS(V.add(c, V.mul(nn, -6)), V.add(c, V.mul(nn, 6)), cls);
    }
    return s;
  }
  /** 끌 수 있는 점. o: cls, label, lcls, away(라벨을 피할 월드 점) | dirS(화면 방향), dist, r */
  handle(key, p, o = {}) {
    const s = this.S(p), act = this.st.active === key, r = (o.r || 7) + (act ? 1.5 : 0);
    let out = `<circle data-h="${key}" data-x="${p.x}" data-y="${p.y}" cx="${r1(s.x)}" cy="${r1(s.y)}" r="${o.hit || 22}" class="hit"/>` +
      `<circle cx="${r1(s.x)}" cy="${r1(s.y)}" r="${r}" class="${o.cls || 'pt'}${act ? ' on' : ''}"/>`;
    if (o.label) {
      let u = o.dirS || (o.away ? V.norm(V.sub(s, this.S(o.away))) : { x: 0.7, y: -0.7 });
      if (!isFinite(u.x)) u = { x: 0, y: -1 };
      out += this.textS(V.add(s, V.mul(u, o.dist || 21)), o.label, 'lbl ' + (o.lcls || ''));
    }
    return out;
  }
}
