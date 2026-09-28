// 순수 기하 계산 모듈 — DOM에 의존하지 않으므로 단위 테스트가 가능하다.
export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;
export const mod = a => ((a % TAU) + TAU) % TAU;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const snap = (x, step) => Math.round(x / step) * step;

export const V = {
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  mul: (a, k) => ({ x: a.x * k, y: a.y * k }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  cross: (a, b) => a.x * b.y - a.y * b.x,
  len: a => Math.hypot(a.x, a.y),
  norm: a => { const l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; },
  dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  perp: a => ({ x: -a.y, y: a.x }),
  neg: a => ({ x: -a.x, y: -a.y }),
  dir: t => ({ x: Math.cos(t), y: Math.sin(t) }),
  ang: a => Math.atan2(a.y, a.x),
  lerp: (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),
  mid: (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
  snap: (p, s) => ({ x: snap(p.x, s), y: snap(p.y, s) }),
};

/** 꼭짓점 v에서 a, b로 향하는 두 반직선 사이의 각 (0 ~ π) */
export function angleAt(v, a, b) {
  const u = V.norm(V.sub(a, v)), w = V.norm(V.sub(b, v));
  return Math.acos(clamp(V.dot(u, w), -1, 1));
}
/** 직선 p + t·d 와 q + s·e 의 교점 (평행이면 null) */
export function intersect(p, d, q, e) {
  const den = V.cross(d, e);
  if (Math.abs(den) < 1e-12) return null;
  const t = V.cross(V.sub(q, p), e) / den;
  return V.add(p, V.mul(d, t));
}
export const area2 = (A, B, C) => V.cross(V.sub(B, A), V.sub(C, A));
export function polyArea(ps) {
  let s = 0;
  for (let i = 0; i < ps.length; i++) { const a = ps[i], b = ps[(i + 1) % ps.length]; s += a.x * b.y - b.x * a.y; }
  return s / 2;
}
/** 세 점이 거의 한 직선 위에 있는지 */
export function isDegenerate(A, B, C) {
  const m = Math.max(V.dist(A, B), V.dist(B, C), V.dist(C, A));
  if (m < 1e-9) return true;
  return Math.abs(area2(A, B, C)) / (m * m) < 0.004;
}
export function circumcenter(A, B, C) {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
  if (Math.abs(d) < 1e-12) return null;
  const a2 = A.x * A.x + A.y * A.y, b2 = B.x * B.x + B.y * B.y, c2 = C.x * C.x + C.y * C.y;
  const c = {
    x: (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / d,
    y: (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / d,
  };
  return { c, r: V.dist(c, A) };
}
export function incenter(A, B, C) {
  const a = V.dist(B, C), b = V.dist(C, A), c = V.dist(A, B), p = a + b + c;
  const I = { x: (a * A.x + b * B.x + c * C.x) / p, y: (a * A.y + b * B.y + c * C.y) / p };
  return { c: I, r: Math.abs(area2(A, B, C)) / p };
}
/** 점 p를 직선 ab 위로 정사영. t는 a→b 방향 매개변수 */
export function project(p, a, b) {
  const d = V.sub(b, a), t = V.dot(V.sub(p, a), d) / V.dot(d, d);
  return { t, pt: V.add(a, V.mul(d, t)) };
}
export const distToLine = (p, a, b) => Math.abs(V.cross(V.sub(b, a), V.sub(p, a))) / V.dist(a, b);
/** 두 선분이 (끝점 제외) 교차하는지 */
export function segmentsCross(p1, p2, q1, q2) {
  const d1 = V.cross(V.sub(p2, p1), V.sub(q1, p1)), d2 = V.cross(V.sub(p2, p1), V.sub(q2, p1));
  const d3 = V.cross(V.sub(q2, q1), V.sub(p1, q1)), d4 = V.cross(V.sub(q2, q1), V.sub(p2, q1));
  return d1 * d2 < 0 && d3 * d4 < 0;
}
