// 빌드 후 dist 산출물에서 실측한 초기 JS 크기 (vite 6.4.3 프로덕션 빌드).
// "초기 JS" = 해당 HTML이 <script>/<link rel="modulepreload">로 즉시 로드하는 JS 합계.
// 이 상수 텍스트 자체가 번들에 들어가므로 재빌드 시 수 KB 오차가 날 수 있어 "약"으로 표기한다.
// 갱신 방법: npm run build 후 dist/bundle-*.html이 참조하는 .js 크기를 합산해 아래를 수정.

export const SIZE_AS_IS =
  '약 1,199KB (gzip 약 386KB) — marked + highlight.js 전체 언어가 초기 경로에 포함 (엔트리 청크만 약 950KB)'

export const SIZE_TO_BE =
  '약 212KB (gzip 약 70KB) — 초기 번들은 as-is의 1/5.7 수준. 뷰어 청크 약 17KB(gzip 4KB)는 "하이라이트 보기" 클릭 시에만 로드'
