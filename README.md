# mathtools

한국 중·고등학교 수학 교육과정(2022 개정)의 정리를 점을 직접 움직이며 확인하는 인터랙티브 도구 모음입니다. 빌드 과정 없는 정적 사이트라서 Vercel·GitHub Pages 등에 그대로 올리면 됩니다.

## 폴더 구조

```
mathtools/
├── index.html              첫 화면 (scripts/gen-index.mjs로 생성)
├── vercel.json             끝 슬래시 강제, 옛 주소 리다이렉트
├── shared/
│   ├── theme.css           색상 토큰·레이아웃·패널·SVG 공통 스타일 (다크 모드 포함)
│   ├── geometry.js         순수 기하 계산 (벡터, 교점, 외심·내심 등) — DOM 의존 없음
│   ├── draw.js             SVG 마크업 도우미 (선, 각 표시, 직각 표시, 끌 수 있는 점 등)
│   ├── stage.js            월드↔화면 변환, 격자·좌표축, 이동·확대, 점 끌기, 렌더 루프
│   ├── ui.js               패널 도우미 (값 표시, 슬라이더, 토글, 애니메이션 루프, 이전/다음 링크)
│   ├── tools.js            학년별 도구 목록 (단일 출처)
│   └── favicon.svg
├── m1/ m2/ m3/             중학교 1~3학년
├── h1/                     고등학교 1학년 (공통수학)
├── h2/                     고등학교 선택 과목 (대수, 미적분Ⅰ, 확률과 통계, 기하)
│   └── <도구>/
│       ├── index.html      마크업 (머리글, 캔버스, 패널)
│       └── main.js         이 도구의 상태·그리기·패널 갱신
└── scripts/gen-index.mjs
```

## 로컬에서 실행

ES 모듈을 `/shared/...` 절대 경로로 불러오기 때문에 파일을 더블클릭해서 열면 동작하지 않습니다. 저장소 루트에서 간단한 서버를 띄워 주세요.

```bash
python3 -m http.server 8000     # 또는  npx serve .
```

그다음 http://localhost:8000 에 접속합니다.

## 도구 하나의 구조

모든 도구는 같은 패턴을 따릅니다. 상태를 들고 있다가, `draw`에서 그림을 문자열로 돌려주고, `drag`에서 상태만 바꾸면 `Stage`가 나머지를 처리합니다.

```js
import { Stage } from '/shared/stage.js';
import { V } from '/shared/geometry.js';
import { $, setText, mountNav } from '/shared/ui.js';

mountNav();
let P = { A: { x: 0, y: 1 }, B: { x: -1, y: 0 } };

const stage = new Stage($('#cv'), {
  bounds: () => Object.values(P),            // "전체 보기" 범위
  drag: (key, p) => { P[key] = p; },         // 점을 끌었을 때
  draw: d => d.line(P.A, P.B) + d.handle('A', P.A, { label: 'A' }) + d.handle('B', P.B, { label: 'B' }),
  after: () => setText('len', V.dist(P.A, P.B).toFixed(2)),   // 패널 갱신
});
```

좌표는 수학 좌표계(위가 +y)입니다. 함수 그래프에는 `axes: {}`, 가로·세로 배율이 달라야 하는 그래프에는 `lockAspect: false`를 넘깁니다.

## 새 도구 추가하기

1. 비슷한 도구 폴더를 복사해 `m2/새-도구/`처럼 만들고 `index.html`의 제목·패널과 `main.js`를 고칩니다.
2. `shared/tools.js`의 해당 학년 `tools` 배열에 `{ slug, title, unit, desc, hint }`를 추가합니다. 이전/다음 링크가 자동으로 연결됩니다.
3. `node scripts/gen-index.mjs`로 첫 화면을 다시 만듭니다.
4. 커밋하고 push하면 Vercel이 자동 배포합니다.
