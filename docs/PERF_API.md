# @renderlab/perf — 계측 API 계약

모든 랩 앱(next-lab / start-lab / react-lab)이 공유하는 성능 계측 레이어. 데모 페이지마다 부착되어
**단계(stage) 타임라인 · 단계별 화면 스냅샷 · 네트워크 프리셋 · RN WebView 전송**을 제공한다.

## 설치 (각 앱 package.json)

```json
{
  "dependencies": {
    "@renderlab/perf": "file:../../packages/perf",
    "@renderlab/mock-data": "file:../../packages/mock-data"
  }
}
```

- npm이 로컬 디렉토리를 심링크로 설치한다. 소스(TS)를 그대로 배포하므로 앱 번들러가 트랜스파일해야 한다.
  - **Next**: `next.config.ts`에 `transpilePackages: ['@renderlab/perf', '@renderlab/mock-data']`
  - **Vite 계열(react-lab, start-lab)**: `resolve: { dedupe: ['react', 'react-dom'] }` + `server.fs.allow`에 `'../..'` 추가 (심링크 소스가 앱 루트 밖에 있음)

## Exports

| export | 종류 | 용도 |
|---|---|---|
| `PerfHUD` | 클라이언트 컴포넌트 | 오버레이 HUD. **모든 페이지의 루트 레이아웃에 1개** 부착. `<PerfHUD app="next-lab" />` |
| `HydrationMarker` | 클라이언트 컴포넌트 | 루트 레이아웃에 1개. `js-eval`(번들 평가 시작) + `hydrated`(hydration 완료) 기록 |
| `StageMark` | 클라이언트 컴포넌트 | 마운트 시점을 단계로 기록. 지연 로딩 섹션의 "사용 가능 시점" 표시. `<StageMark name="section-1" detail="추천 목록 hydrate 완료" />` |
| `StreamMark` | **서버 렌더 가능** 컴포넌트 | 인라인 `<script>`를 심어 **HTML 파서 도달 시점**(hydration 이전)을 기록 + 그 순간의 DOM 스냅샷 캡처. 스트리밍 SSR 데모 필수 |
| `STREAM_BOOTSTRAP` | 문자열 상수 | `StreamMark`가 동작하려면 문서 `<head>` 최상단에 인라인 필요: `<script dangerouslySetInnerHTML={{ __html: STREAM_BOOTSTRAP }} />` |
| `perfStage(name, {detail?, snapshot?})` | 함수 | 커스텀 단계 기록 (SSR 중엔 no-op). 기본으로 화면 스냅샷도 캡처 |
| `perfInit({app?, captureSnapshots?})` | 함수 | 자동 계측 초기화 (멱등). PerfHUD가 호출하므로 보통 불필요 |
| `getApiDelay()` | 함수 | `?apiDelay=` 쿼리(0~15000 클램프)를 읽음. **클라이언트 fetch 시 이 값을 API에 전달할 것** |
| `getPerfEntries` / `getPerfReport` / `subscribePerf` / `perfPrint` | 함수 | HUD 외부에서 데이터 접근이 필요할 때 |

## 자동 수집 단계

`nav-start`, `ttfb`, `fcp`, `lcp`(갱신형), `dom-content-loaded`, `load`,
`js-eval`, `hydrated`(HydrationMarker), `long-tasks`(갱신형), `worst-interaction`(갱신형, INP 근사), `stream:<이름>`(StreamMark)

## 커스텀 단계 네이밍 규약 (as-is/to-be 쌍은 반드시 동일 이름 사용)

| 이름 | 의미 |
|---|---|
| `data-requested` | 클라이언트에서 데이터 요청 시작 |
| `data-received` | 데이터 응답 수신 |
| `content-rendered` | 주 콘텐츠가 화면에 렌더됨 (커밋 후 effect에서 기록) |
| `section-1` ~ `section-N` | 스트리밍/지연 섹션 각각의 완료 (StreamMark는 `stream:section-N`으로 찍힘) |
| 데모 고유 단계 | `editor-requested`, `editor-ready` 등 — 쌍끼리 동일하게 |

## 프레임워크별 통합 스니펫

### Next.js (App Router) — `app/layout.tsx`

```tsx
import { PerfHUD, HydrationMarker, STREAM_BOOTSTRAP } from '@renderlab/perf'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: STREAM_BOOTSTRAP }} />
      </head>
      <body>
        {children}
        <HydrationMarker />
        <PerfHUD app="next-lab" />
      </body>
    </html>
  )
}
```

### TanStack Start — `src/routes/__root.tsx`의 문서 셸

루트 문서의 `<head>`에 STREAM_BOOTSTRAP 인라인 스크립트, `<body>` 말미에 `<HydrationMarker />`와 `<PerfHUD app="start-lab" />`.

### Vite + React (react-lab) — `src/main.tsx`

```tsx
import { PerfHUD, HydrationMarker } from '@renderlab/perf'
// 루트 컴포넌트 트리에 <HydrationMarker />와 <PerfHUD app="react-lab" /> 포함
```

## 네트워크 시뮬레이션 계층 (3단)

1. **`?apiDelay=` 쿼리** — HUD 프리셋 버튼(0/200/800/2000ms)이 조절. 데이터 응답만 지연. 서버 코드는 자체 searchParams에서, 클라이언트 코드는 `getApiDelay()`로 읽어 API/데이터 함수의 `delay`로 전달한다.
2. **DevTools Network 스로틀** — 브라우저에서 전체 회선 재현.
3. **`npm run throttle` 프록시** (`tools/throttle-proxy`) — DevTools가 없는 RN WebView까지 포함해 전체 회선(HTML/JS/CSS/API)을 지연+대역폭 제한. 프로파일: wifi/4g/fast3g/slow3g/2g.

## RN WebView 메시지 포맷

`window.ReactNativeWebView`가 존재하면 단계가 갱신될 때마다(250ms 스로틀) 아래 JSON을 postMessage한다.
load 완료 1.2초 뒤 `final: true`로 마지막 전송.

```json
{
  "type": "renderlab-perf",
  "app": "next-lab",
  "url": "/csr-vs-ssr/as-is?apiDelay=800",
  "apiDelay": 800,
  "final": false,
  "entries": [{ "name": "ttfb", "t": 132.4, "detail": "..." }]
}
```

## 스냅샷의 한계 (문서화된 트레이드오프)

- 스냅샷은 script/HUD 제거 후의 DOM 직렬화이며, 캡처는 rAF 2회 뒤(페인트 반영 후)에 수행된다.
- DOM 노드 6,000개 초과 또는 800KB 초과 시 측정 오염 방지를 위해 캡처를 생략한다 (HUD에 📷 없음).
- JS 실행 전 단계(순수 HTML 도착 등)는 `StreamMark`(인라인 스크립트)로만 캡처 가능하다.
- 스냅샷 캡처 자체가 수 ms의 오버헤드를 만든다. 정밀 측정이 필요하면 `perfInit({ captureSnapshots: false })`.
