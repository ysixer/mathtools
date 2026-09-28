// 첫 화면(index.html)을 shared/tools.js 목록으로부터 다시 만든다.
// 사용법: 저장소 루트에서  node scripts/gen-index.mjs
import { writeFileSync } from 'node:fs';
import { GRADES } from '../shared/tools.js';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jump = GRADES.map(g => `<li><a href="#${g.id}">${g.label}</a></li>`).join('');
const secs = GRADES.map(g => `
    <section class="grade" id="${g.id}">
      <h2>${g.label} <small>${g.note}</small></h2>
      <ul class="cards">${g.tools.map(t => `
        <li><a class="card" href="/${g.id}/${t.slug}/"><span class="unit">${esc(t.unit)}</span><span class="t">${esc(t.title)}</span><span class="d">${esc(t.desc)}</span></a></li>`).join('')}
      </ul>
    </section>`).join('');

writeFileSync(new URL('../index.html', import.meta.url), `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>mathtools · 점을 움직이며 이해하는 수학</title>
<meta name="description" content="한국 중·고등학교 수학 교육과정의 정리를 직접 조작하며 확인하는 인터랙티브 도구 모음">
<link rel="icon" href="/shared/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;700&family=Noto+Serif:ital,wght@1,500;1,700&display=swap">
<link rel="stylesheet" href="/shared/theme.css">
</head>
<body class="landing">
<main>
  <h1>mathtools</h1>
  <p class="lead">점을 직접 움직이며 확인하는 수학 정리 모음입니다. 2022 개정 교육과정의 학년·과목 순서로 정리했어요.</p>
  <ul class="jump">${jump}</ul>${secs}
  <footer>모든 도구는 설치 없이 브라우저에서 동작합니다. 교과서 출판사에 따라 단원 배치가 조금 다를 수 있어요.</footer>
</main>
</body>
</html>
`);
console.log('index.html 생성 완료:', GRADES.reduce((n, g) => n + g.tools.length, 0), '개 도구');
