# react-lab — 순수 React(CSR) 렌더링 전략 데모

renderlab 모노레포의 Vite + React 19 앱. 프레임워크(서버 렌더링) 없이 **순수 React에서 쓸 수 있는
컴포넌트/번들 레벨 렌더링 전략**을 as-is(문제 재현) ↔ to-be(개선) 쌍으로 체감·계측한다.

다루는 전략: **번들 분할 · 동시성 렌더링(Transitions) · 리렌더 제어(memo) · 리스트 가상화 · 요청 병렬화**

## 실행법

```bash
cd apps/react-lab
npm install        # @renderlab/perf, @renderlab/mock-data는 file: 심링크로 설치됨
npm run dev        # 개발 서버 — http://localhost:3002
npm run build      # tsc 타입체크 + 프로덕션 빌드 (dist/)
npm run start      # 프로덕션 preview — http://localhost:3002
```

- 포트는 dev/preview 모두 **3002 (strictPort)**.
- `GET /api/spaces?delay=&count=&region=` 목데이터 API는 vite 플러그인 미들웨어로 **dev와 preview 양쪽**에서 동작한다 (`vite.config.ts`).
- 루트 워크스페이스 없이 이 디렉토리 단독으로 실행 가능하다.

## 왜 HashRouter인가

- 서버 리라이트 설정 없이 어디서나 동작한다. `vite preview`·정적 호스팅·RN WebView에서 데모 경로를 새로고침해도 404가 나지 않는다 (경로가 `#` 뒤에 있으므로).
- PerfHUD의 네트워크 프리셋은 `location.search`(`?apiDelay=`)를 바꾸는데, 해시 라우팅에서는 URL이 `/?apiDelay=800#/waterfall/as-is` 순서가 되어 search와 라우트가 충돌하지 않는다. **데모는 반드시 `getApiDelay()`로 이 값을 읽는다.**

## CSR에서 HUD 읽는 법

- 이 앱은 순수 CSR — 서버가 HTML을 그려주지 않으므로 HUD의 `hydrated`는 SSR 수화가 아니라 **"첫 mount 완료"**다.
- `fcp` 전까지 화면은 빈 셸이다. 초기 번들 크기가 곧 빈 화면의 길이다(→ 번들 분할 데모).
- 스트리밍 SSR이 없으므로 `STREAM_BOOTSTRAP`/`StreamMark`는 이 앱에서 쓰지 않는다.

## 데모 카탈로그

| 경로 | 전략 | 무엇을 보는가 |
| --- | --- | --- |
| `#/` | — | 카탈로그 + 렌더링 접근 철학 요약 |
| `#/transition/as-is` | 동기 렌더 (전략 없음) | 20,000개 검색 필터에서 입력과 리스트가 한 렌더에 묶여 타이핑이 버벅임. `worst-interaction`·`long-tasks`·keydown→paint 실측치 |
| `#/transition/to-be` | useTransition + useDeferredValue + memo | 리스트 갱신을 transition으로 격하해 입력 반응 유지. isPending 동안 리스트 dim. 단계명 `filter-applied` 쌍 동일 |
| `#/memo/as-is` | 기본 렌더 전파 | 키 입력마다 카드 500장 전부 리렌더 — 카드별 렌더 카운트 + 배경 플래시 + "이번 입력으로 리렌더된 카드 수: 500" |
| `#/memo/to-be` | React.memo + 안정 props | 같은 화면에서 리렌더 카드 수 0. useCallback/모듈 상수로 props 참조 안정화 |
| `#/virtual/as-is` | 전체 DOM 렌더 | 10,000행 전부 DOM 생성 — DOM 노드 수(약 5만) 표시, 초기 long-task, **DOM이 커서 HUD 📷 스냅샷이 생략되는 것 자체가 관찰 포인트** |
| `#/virtual/to-be` | @tanstack/react-virtual | 보이는 행 + overscan만 DOM(수백 노드). 단계명 `content-rendered` 쌍 동일 |
| `#/waterfall/as-is` | fetch-on-render + 직렬 await | 3개 지역을 순차 fetch — HUD에 `fetch-1/2/3-done`이 계단으로 찍히고 `all-done ≈ 지연×3` |
| `#/waterfall/to-be` | Promise.all + render-as-you-fetch | 병렬 + 라우트 청크 로드(모듈 평가) 시점 요청 선시작 — `all-done ≈ 지연×1`, `data-requested`가 `hydrated`보다 먼저 |
| `/bundle-as-is.html` | 전량 정적 import (별도 엔트리) | marked + highlight.js 전체가 초기 번들에 포함 — 무거운 첫 로드. `editor-requested/ready`는 거의 0ms |
| `/bundle-to-be.html` | React.lazy + dynamic import (별도 엔트리) | 뷰어를 클릭 시점 로드, hljs core + 언어 3개만 등록 — 첫 로드 가벼움, 클릭 시 청크 비용 발생 |

모든 데이터 데모는 `?apiDelay=` 쿼리(HUD 네트워크 프리셋 0/200/800/2000ms)를 `getApiDelay()`로 읽어
API의 `delay`로 전달한다. waterfall은 기본 지연 400ms에 apiDelay가 합산된다.

## 빌드 실측치 (vite 6.4.3, 재빌드 시 수 KB 오차 가능)

각 HTML이 즉시 로드하는 JS(`<script>` + `modulepreload`) 합계:

| 엔트리 | 초기 JS (raw) | 초기 JS (gzip) | 비고 |
| --- | --- | --- | --- |
| `bundle-as-is.html` | **약 1,199KB** | 약 386KB | 엔트리 청크만 949.7KB — hljs 전체 언어 + marked 포함 |
| `bundle-to-be.html` | **약 212KB** | 약 70KB | as-is의 **약 1/5.7**. 뷰어 청크 16.7KB(gzip 4.2KB)는 클릭 시에만 로드 |
| `index.html` (SPA) | 약 284KB | 약 93KB | waterfall 쌍은 lazy 청크(각 1.6~1.8KB)로 분리 |

주요 청크: `bundle-as-is-*.js` 949.69KB · `DemoLayout-*.js`(공유 React+공용 UI) 207.80KB ·
`main-*.js`(SPA) 81.61KB · `core-*.js`(marked 공유) 63.52KB · `viewer-lazy-*.js` 16.72KB ·
`bundle-to-be-*.js` 1.58KB

> 빌드 시 "chunks larger than 500 kB" 경고가 나오는데, 그 500KB+ 청크(bundle-as-is)가 바로
> 이 데모의 관찰 대상이므로 의도된 것이다.

## 구조 메모

- `vite.config.ts` — 멀티 엔트리(main + bundle-as-is + bundle-to-be), `/api/spaces` 미들웨어(dev/preview 공용), `resolve.dedupe: ['react','react-dom']`, `server.fs.allow: ['../..']`. mock-data는 설정 파일 번들링 이슈 회피를 위해 상대 경로로 import.
- `src/components/DemoLayout.tsx` — 모든 데모 상단의 정보 박스(전략/kind/설명/관찰 포인트/짝 링크/wiki 참조).
- StrictMode 미사용 — memo 데모의 "렌더 횟수"가 dev 이중 렌더로 왜곡되지 않게 하기 위함(main.tsx 주석).
- 커스텀 단계 이름은 쌍끼리 동일: `filter-applied` / `content-rendered` / `data-requested`·`fetch-N-done`·`all-done` / `editor-requested`·`editor-ready`.
