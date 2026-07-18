# next-lab — Next.js 15 App Router 렌더링 전략 랩

같은 화면(스터디스페이스 목록)을 서로 다른 렌더링 전략의 **as-is / to-be 쌍**으로 구현하고,
공용 계측 레이어 `@renderlab/perf`의 **PerfHUD**(단계 타임라인 · 단계별 화면 스냅샷 · 네트워크 프리셋)로
차이를 눈과 숫자로 확인하는 학습용 랩입니다.

## 실행법

```bash
cd apps/next-lab
npm install        # @renderlab/perf, @renderlab/mock-data는 file: 심링크로 설치됨
npm run dev        # 개발 모드 (http://localhost:3000)

npm run build      # 프로덕션 빌드 — SSG/ISR 데모는 빌드가 있어야 의미가 있다
npm run start      # 프로덕션 기동 (http://localhost:3000) ← 계측은 반드시 프로덕션에서
```

- 렌더링 모드(SSG/ISR)와 번들 크기 비교는 **프로덕션 모드(`npm run build && npm run start`)에서만** 정확합니다.
- 모든 데모 우하단의 **PerfHUD** 알약을 클릭하면 타임라인이 열립니다. 네트워크 프리셋(0/200/800/2000ms) 버튼은
  `?apiDelay=` 쿼리를 바꿔 **데이터 응답만** 지연시킨 뒤 재측정합니다.
- 같은 시나리오의 TanStack Start 구현(미러 쌍): [start-lab (http://localhost:3001)](http://localhost:3001) —
  `/csr-vs-ssr/*` ↔ start-lab `/loader-vs-client/*`, `/blocking-vs-streaming/*` ↔ start-lab `/blocking-vs-deferred/*`,
  `/prefetch-cache/*` ↔ start-lab `/cache-preload/*`

## 데모 카탈로그

| 경로 | 전략 | 무엇을 보는지 |
|---|---|---|
| `/` | 카탈로그 | 접근 철학 요약 + 전체 데모 표 |
| `/csr-vs-ssr/as-is` | CSR — `'use client'` + useEffect fetch | ttfb는 빠른데 content-rendered가 hydrated + fetch 왕복 + apiDelay만큼 늦음. curl로 받으면 HTML에 데이터가 없음 |
| `/csr-vs-ssr/to-be` | SSR — async 서버 컴포넌트 | HTML에 데이터가 이미 포함(fcp=콘텐츠). 대신 apiDelay를 올리면 TTFB가 같이 늘어남 |
| `/blocking-vs-streaming/as-is` | Blocking SSR — Promise.all 후 일괄 렌더 | ttfb가 가장 느린 섹션(base+900ms)에 묶임. stream:section-1~3이 한 점에 몰림 |
| `/blocking-vs-streaming/to-be` | Streaming SSR — Suspense 단위 스트리밍 | 셸 즉시 도착, stream:section-1→2→3이 계단으로 찍힘. 스켈레톤→부분→완성 시각 단계 |
| `/rendering-modes` | 트리오 소개 | SSR/SSG/ISR을 언제 쓰는지 + 비교 실험 순서 |
| `/rendering-modes/ssr` | `force-dynamic` | 새로고침마다 요청 시각이 바뀜. ttfb ≈ 300ms + apiDelay |
| `/rendering-modes/ssg` | 정적 생성 | "빌드 시점" 고정. 요청 시 서버 작업 없음 → 트리오 중 ttfb 최단. apiDelay 무효 |
| `/rendering-modes/isr` | `revalidate = 10` | 10초 뒤 첫 요청은 이전 캐시(stale) + 백그라운드 재생성. 페이지의 실험 절차 참고 |
| `/rsc-payload/as-is` | 클라이언트 렌더 (marked + highlight.js 전체) | 무거운 번들 → js-eval→hydrated 간격·long-tasks 증가 |
| `/rsc-payload/to-be` | 서버 컴포넌트 렌더 | 하이라이터가 번들에서 제거됨. First Load JS 극감 (아래 실측치) |
| `/prefetch-cache/as-is` | Link `prefetch={false}`, 상세 loading.tsx 없음 | 카드 클릭 후에야 상세 RSC 왕복(500ms+apiDelay) 시작 — spa-nav:start→done이 그대로 체감 지연, 클릭 후 무반응 구간 |
| `/prefetch-cache/to-be` | 기본 prefetch + loading.tsx + `staleTimes.dynamic: 60` | 뷰포트 프리페치로 클릭 즉시 로딩 셸(loading-shell 단계), 60초 내 재방문·복귀는 Router Cache로 수 ms |
| `/api/spaces` | Route Handler | `?delay=&count=&region=` → JSON, `Cache-Control: no-store` |

## 빌드 실측치 (next build 출력, Next.js 15.5.20 기준)

```text
Route (app)                                 Size  First Load JS  Revalidate
┌ ○ /                                      165 B         106 kB
├ ƒ /api/spaces                            122 B         103 kB
├ ƒ /blocking-vs-streaming/as-is           423 B         112 kB
├ ƒ /blocking-vs-streaming/to-be           423 B         112 kB
├ ○ /csr-vs-ssr/as-is                    3.81 kB         115 kB
├ ƒ /csr-vs-ssr/to-be                      423 B         112 kB
├ ƒ /prefetch-cache/as-is                2.87 kB         114 kB
├ ƒ /prefetch-cache/as-is/[id]           2.89 kB         114 kB
├ ƒ /prefetch-cache/to-be                2.87 kB         114 kB
├ ƒ /prefetch-cache/to-be/[id]           2.89 kB         114 kB
├ ○ /rendering-modes                       165 B         106 kB
├ ○ /rendering-modes/isr                   423 B         112 kB         10s
├ ○ /rendering-modes/ssg                   423 B         112 kB
├ ƒ /rendering-modes/ssr                   423 B         112 kB
├ ○ /rsc-payload/as-is                    320 kB         432 kB   ← marked + hljs가 번들에
└ ƒ /rsc-payload/to-be                     423 B         112 kB   ← 같은 화면, 서버 렌더
+ First Load JS shared by all             102 kB
```

핵심 숫자: **rsc-payload as-is 431 kB vs to-be 111 kB** — 동일한 문서 30건을 렌더하는 데
클라이언트가 내려받는 JS가 약 **320 kB(gzip)** 차이 난다. 차이의 대부분이 highlight.js 전체 언어팩 + marked.

## 구조 노트

- `app/layout.tsx` — `<head>` 최상단에 `STREAM_BOOTSTRAP` 인라인(스트리밍 마크 부트스트랩), `<body>` 말미에
  `HydrationMarker` + `PerfHUD app="next-lab"` 1회 부착.
- `app/components/DemoLayout.tsx` — 모든 데모 페이지 공통 프레임(전략/쌍 링크/관찰 포인트/wiki 참조).
- `app/lib/sections.ts`, `app/lib/docs.ts`, `app/lib/render-docs.ts` — as-is/to-be 쌍이 **완전히 같은 데이터·렌더
  코드**를 공유하게 하는 모듈. 쌍의 차이는 "어디서 실행하느냐"뿐이다.
- `next.config.ts` — `transpilePackages: ['@renderlab/perf', '@renderlab/mock-data']` (TS 소스 그대로 배포되는
  로컬 패키지). `tsconfig.json`의 `preserveSymlinks: true`는 심링크된 패키지가 앱의 `node_modules`에서 react 타입을
  찾게 하기 위함.
- `next.config.ts`의 `experimental.staleTimes.dynamic: 60` — `/prefetch-cache/to-be`용 Router Cache 설정.
  **앱 전역**에 걸리므로(라우트 단위 옵션 없음) 60초 내 재방문 전환은 다른 데모·as-is에서도 캐시를 탈 수 있다.
  as-is 페이지에 이 사실을 명시해 두었다.
- `app/lib/nav-perf.ts` — SPA 전환 계측(spa-nav:start/done). Next에는 라우터 전환 이벤트 구독 API가 없어
  Link onClick(시작)과 도착 페이지 마운트 effect(완료)로 잰다. start-lab의 nav-perf와 동일한 단계 이름.
- `dangerouslySetInnerHTML`은 우리가 작성한 정적 상수(STREAM_BOOTSTRAP)와 seed 고정 mock 마크다운의 렌더 결과에만
  사용한다. 외부/사용자 입력은 절대 넣지 않는다.
