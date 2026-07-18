# start-lab — TanStack Start 렌더링 전략 랩

React / Next.js / TanStack Start의 렌더링 전략을 as-is/to-be 쌍 데모로 체감·계측하는
renderlab 모노레포의 TanStack Start 앱입니다. 모든 페이지에 [PerfHUD](../../docs/PERF_API.md)가
붙어 있어 단계 타임라인·단계별 화면 스냅샷·네트워크 프리셋(`?apiDelay=`)을 바로 볼 수 있습니다.

**Start의 접근 철학** — 라우터 중심. isomorphic loader(첫 요청은 서버, SPA 전환은 클라이언트에서
같은 코드 실행), 라우트 단위 세밀한 SSR 제어(`ssr: true | 'data-only' | false`, Start 고유),
deferred 스트리밍(loader가 Promise를 그대로 반환), 라우터 캐시(staleTime/gcTime/preload).

## 실행법

```bash
# 이 디렉토리(apps/start-lab)에서 — 앱은 완전히 독립 실행 가능
npm install
npm run dev     # 개발 서버 http://localhost:3001
npm run build   # 프로덕션 빌드 (.output/)
npm run start   # 프로덕션 기동 http://localhost:3001 (PORT=3001 node .output/server/index.mjs)
```

- Node 20.18.x 기준. **Vite 6 + @tanstack/react-start 1.131.x** 조합입니다 —
  react-start 1.132.0부터 Vite 7(Node 20.19+/22.12+)을 요구해서, 이 환경에서 돌아가는
  마지막 라인(1.131.x)에 고정했습니다 (`~1.131.50`).
- `@renderlab/perf`, `@renderlab/mock-data`는 `file:` 심링크로 설치되며 TS 소스를
  앱 번들러가 직접 변환합니다 (`vite.config.ts`의 `ssr.noExternal`, `server.fs.allow` 참고).

## 데모 카탈로그

| 경로 | 전략 | 무엇을 보는가 |
|---|---|---|
| `/` | 카탈로그 | 접근 철학 요약 + 전체 데모 표 |
| `/loader-vs-client/as-is` | CSR — useEffect fetch | HTML엔 스켈레톤뿐. `data-requested`가 hydration 후에야 시작되어 콘텐츠가 가장 늦음 |
| `/loader-vs-client/to-be` | isomorphic 라우트 loader | 서버가 데이터를 await → 첫 HTML에 목록 포함. `stream:content`가 hydration 이전에 찍힘 |
| `/blocking-vs-deferred/as-is` | 블로킹 loader SSR | 세 데이터셋(+200/+500/+900ms) 전부 await → TTFB가 ~900ms 뒤로. `stream:section-1~3`이 한꺼번에 |
| `/blocking-vs-deferred/to-be` | deferred loader + `<Await>` | Promise를 그대로 반환 → 셸 즉시, 섹션이 +200/+500/+900ms에 계단식 스트리밍 |
| `/selective-ssr/full` | `ssr: true` | loader+마크업 모두 서버에서. TTFB는 늦지만 첫 HTML에 콘텐츠 |
| `/selective-ssr/data-only` | `ssr: 'data-only'` | loader만 서버에서(TTFB는 full과 동일하게 블록), 마크업은 클라이언트 렌더 — 데이터는 dehydration 페이로드로 도착 |
| `/selective-ssr/spa` | `ssr: false` | 서버는 셸만(TTFB 최소), loader는 hydration 후 클라이언트에서 — 콘텐츠 가장 늦음 |
| `/cache-preload/as-is` (+`/$id`) | 캐시·프리로드 없음 | staleTime 0 + gcTime 0 → 목록↔상세 오갈 때마다 loader(300/500ms) 재대기. `spa-nav` 단계로 계측 |
| `/cache-preload/to-be` (+`/$id`) | staleTime 60s + `preload="intent"` | 호버 순간 프리로드 → 클릭 즉시 전환, 뒤로가기 즉시 |
| `/api/spaces` | 서버 라우트 (GET) | `delay/count/region` 쿼리, JSON, `no-store`. 웹뷰/외부 측정용 — next-lab과 동일 스펙 |

같은 시나리오의 Next.js 구현은 next-lab(http://localhost:3000)에서 비교:
`/loader-vs-client/*` ↔ next-lab `/csr-vs-ssr/*`, `/blocking-vs-deferred/*` ↔ next-lab `/blocking-vs-streaming/*`.

## 측정 팁

- HUD의 네트워크 프리셋 버튼(0/200/800/2000ms)이 `?apiDelay=`를 바꿔 데이터 지연만 늘린다.
  서버 loader는 `validateSearch → loaderDeps`로, 클라이언트 fetch는 `getApiDelay()`로 읽는다.
- SPA 전환 비용은 `spa-nav:start` / `spa-nav:done` 단계로 기록된다 (`src/lib/nav-perf.ts`,
  `router.subscribe('onBeforeNavigate' | 'onResolved')`).
- **curl로 스트리밍을 볼 때는 브라우저 User-Agent를 지정할 것.** curl 기본 UA는 isbot에 걸려
  Start가 의도적으로 `stream.allReady`까지 기다린 완성본을 보낸다(SEO 대응 동작).

## 빌드 후 실측치 (프로덕션, apiDelay=0, 로컬)

- 클라이언트 번들: main `306.08 kB` (gzip `97.31 kB`), 라우트 청크 각 `0.9~5.8 kB`, CSS `5.92 kB` — 클라이언트 assets 합계 약 364 KB
- 서버 번들: `.output/server` 합계 2.09 MB (gzip 448 kB)
- TTFB 실측 (브라우저 UA):
  - `/loader-vs-client/as-is` 8ms (빈 스켈레톤) ↔ `/to-be` 12ms (데이터 포함, apiDelay만큼 증가)
  - `/blocking-vs-deferred/as-is` 첫 바이트 ~915ms ↔ `/to-be` 셸 11ms 후 섹션이 206/507/903ms에 도착 (raw socket 실측)
  - `/selective-ssr/full` 432ms · `/data-only` 416ms · `/spa` 10ms — data-only는 loader가 서버 블록이라 TTFB는 full과 같고, 본문 마크업만 없음 (`card-thumb` 0개, 데이터 20건은 페이로드에 존재를 curl로 확인)

## 구조

```
src/
  router.tsx                 # createRouter + defaultPendingMs 100 (스켈레톤 빨리 보이게)
  lib/search.ts              # ?apiDelay= validateSearch/loaderDeps 공용
  lib/nav-perf.ts            # spa-nav:start/done 계측
  components/                # DemoLayout · SpaceCard · StreamSections · SelectiveSsr · CachePreload
  routes/__root.tsx          # 문서 셸: STREAM_BOOTSTRAP(head) + HydrationMarker + PerfHUD(body 말미)
  routes/...                 # 파일 라우팅 (위 카탈로그)
  routes/api/spaces.ts       # createServerFileRoute('/api/spaces').methods({ GET })
```
