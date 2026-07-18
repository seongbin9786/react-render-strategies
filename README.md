# renderlab

React / Next.js / TanStack Start **렌더링 전략 학습 랩**입니다.
CSR·SSR·SSG·ISR·스트리밍 SSR·RSC·선택적 SSR(Selective SSR) 같은 렌더링 전략을 "말"이 아니라 **같은 화면을 전략만 바꿔 두 번 구현한 데모 쌍 + 단계별 계측 수치**로 배웁니다.

## as-is / to-be 철학

모든 데모는 쌍으로 존재합니다.

- **as-is** — 흔히 저지르는(혹은 프레임워크 기본값 그대로의) 방식. 문제가 그대로 재현됩니다.
- **to-be** — 같은 화면·같은 데이터를 렌더링 전략만 바꿔 다시 구현한 것. 개선이 숫자와 스냅샷으로 보입니다.

두 페이지는 같은 목데이터(`@renderlab/mock-data` — 시드 고정 스터디스페이스 목록)와 같은 계측 레이어(`@renderlab/perf` — PerfHUD)를 사용하므로, **차이는 오직 렌더링 전략에서만** 나옵니다. 계측 API의 계약은 [docs/PERF_API.md](./docs/PERF_API.md)에 있습니다.

## 요구 사항

- **Node.js 20.18+** (Vite 계열 앱은 20.19+ 권장 — [FAQ](#faq) 참고)
- **npm** (워크스페이스가 아닌 per-app 설치 방식이라 `npm run setup`이 앱별로 설치합니다)
- (RN 데모) iOS 시뮬레이터 / Android 에뮬레이터 또는 실기기 + Expo Go

## 빠른 시작

```bash
# 1. 의존성 설치 (루트 + 앱 3개)
npm run setup

# 2-a. 측정용 실행 (프로덕션 빌드 + 서빙, 권장)
npm run demo

# 2-b. 개발용 실행 (HMR — 수치 비교에는 쓰지 말 것)
npm run dev
```

렌더링 성능을 **비교**할 때는 반드시 `npm run demo`(프로덕션 모드)를 쓰세요. dev 모드가 수치를 어떻게 왜곡하는지는 [위키 14 — 측정 방법론](./docs/wiki/14-measurement-methodology.md)에 정리되어 있습니다.

### RN WebView 데모

```bash
npm run setup:rn
cd apps/rn-webview && npx expo start
```

실기기에서는 웹뷰 주소로 `localhost`가 아니라 **이 Mac의 LAN IP**(`ipconfig getifaddr en0`)를 사용해야 합니다. 자세한 절차는 [위키 13 — WebView 성능](./docs/wiki/13-webview-performance.md).

## 포트

| 포트 | 서비스 | 설명 |
|---|---|---|
| 3000 | next-lab | Next.js (App Router) 데모 |
| 3001 | start-lab | TanStack Start 데모 |
| 3002 | react-lab | Vite + React 순수 CSR 데모 |
| 4300 | throttle proxy | `npm run throttle` — 회선 스로틀 프록시 ([tools/throttle-proxy](./tools/throttle-proxy)) |

## 전체 데모 맵

미러 쌍(같은 문제를 Next 방식 vs Start 방식으로 푼 것): next `/csr-vs-ssr` ↔ start `/loader-vs-client`, next `/blocking-vs-streaming` ↔ start `/blocking-vs-deferred`. 비교 관점은 [위키 11 — Next vs Start](./docs/wiki/11-next-vs-start.md) 참고.

| 앱 | 주제 | 경로 | 주로 볼 지표 (HUD 단계) | 위키 |
|---|---|---|---|---|
| next-lab | CSR vs SSR | [/csr-vs-ssr/as-is](http://localhost:3000/csr-vs-ssr/as-is) · [/csr-vs-ssr/to-be](http://localhost:3000/csr-vs-ssr/to-be) | FCP·LCP, `data-requested`→`content-rendered` | [02](./docs/wiki/02-csr.md) · [03](./docs/wiki/03-ssr.md) |
| next-lab | 블로킹 vs 스트리밍 SSR | [/blocking-vs-streaming/as-is](http://localhost:3000/blocking-vs-streaming/as-is) · [/blocking-vs-streaming/to-be](http://localhost:3000/blocking-vs-streaming/to-be) | TTFB, `stream:section-N` 필름스트립 | [05](./docs/wiki/05-streaming-ssr.md) |
| next-lab | 렌더링 모드 3종 | [/rendering-modes](http://localhost:3000/rendering-modes)(소개) · [/ssr](http://localhost:3000/rendering-modes/ssr) · [/ssg](http://localhost:3000/rendering-modes/ssg) · [/isr](http://localhost:3000/rendering-modes/isr) | TTFB (모드 간 비교), 데이터 신선도 | [04](./docs/wiki/04-ssg-isr.md) |
| next-lab | RSC 페이로드 | [/rsc-payload/as-is](http://localhost:3000/rsc-payload/as-is) · [/rsc-payload/to-be](http://localhost:3000/rsc-payload/to-be) | `js-eval`→`hydrated`, JS 전송량 | [06](./docs/wiki/06-rsc.md) |
| next-lab | 프리페치 + Router Cache | [/prefetch-cache/as-is](http://localhost:3000/prefetch-cache/as-is) · [/prefetch-cache/to-be](http://localhost:3000/prefetch-cache/to-be) (각각 `/[id]` 상세 포함) | 내비게이션 시 `spa-nav:start`→`spa-nav:done` 간격 | [09](./docs/wiki/09-selective-ssr-and-router-caching.md) |
| start-lab | 로더 vs 클라이언트 페치 | [/loader-vs-client/as-is](http://localhost:3001/loader-vs-client/as-is) · [/loader-vs-client/to-be](http://localhost:3001/loader-vs-client/to-be) | FCP·LCP, `data-received` 시점 | [03](./docs/wiki/03-ssr.md) · [11](./docs/wiki/11-next-vs-start.md) |
| start-lab | 블로킹 vs deferred 로더 | [/blocking-vs-deferred/as-is](http://localhost:3001/blocking-vs-deferred/as-is) · [/blocking-vs-deferred/to-be](http://localhost:3001/blocking-vs-deferred/to-be) | TTFB vs `stream:section-N` 완료 시점 | [05](./docs/wiki/05-streaming-ssr.md) · [11](./docs/wiki/11-next-vs-start.md) |
| start-lab | 선택적 SSR | [/selective-ssr/full](http://localhost:3001/selective-ssr/full) · [/data-only](http://localhost:3001/selective-ssr/data-only) · [/spa](http://localhost:3001/selective-ssr/spa) | TTFB·FCP·`hydrated` 삼자 비교 | [09](./docs/wiki/09-selective-ssr-and-router-caching.md) |
| start-lab | 라우터 캐시 + 프리로드 | [/cache-preload/as-is](http://localhost:3001/cache-preload/as-is) · [/cache-preload/to-be](http://localhost:3001/cache-preload/to-be) (각각 `/$id` 상세 포함) | 내비게이션 시 `spa-nav:start`→`spa-nav:done` 간격 | [09](./docs/wiki/09-selective-ssr-and-router-caching.md) |
| react-lab | useTransition | [/#/transition/as-is](http://localhost:3002/#/transition/as-is) · [/#/transition/to-be](http://localhost:3002/#/transition/to-be) | `worst-interaction`(INP 근사), `long-tasks` | [08](./docs/wiki/08-client-rendering-optimizations.md) |
| react-lab | memo | [/#/memo/as-is](http://localhost:3002/#/memo/as-is) · [/#/memo/to-be](http://localhost:3002/#/memo/to-be) | `worst-interaction`, `long-tasks` | [08](./docs/wiki/08-client-rendering-optimizations.md) |
| react-lab | 리스트 가상화 | [/#/virtual/as-is](http://localhost:3002/#/virtual/as-is) · [/#/virtual/to-be](http://localhost:3002/#/virtual/to-be) | `long-tasks`, `content-rendered` | [08](./docs/wiki/08-client-rendering-optimizations.md) |
| react-lab | 요청 워터폴 | [/#/waterfall/as-is](http://localhost:3002/#/waterfall/as-is) · [/#/waterfall/to-be](http://localhost:3002/#/waterfall/to-be) | `fetch-1..3-done` 계단(직렬) vs 동시 도착, `data-requested`가 `hydrated` 앞/뒤 어디에 찍히는지 | [08](./docs/wiki/08-client-rendering-optimizations.md) |
| react-lab | 번들/코드 분할 | [/bundle-as-is.html](http://localhost:3002/bundle-as-is.html) · [/bundle-to-be.html](http://localhost:3002/bundle-to-be.html) | `js-eval`, `hydrated`, JS 전송량 | [08](./docs/wiki/08-client-rendering-optimizations.md) |
| 공용 API | 목데이터 API | [3000/api/spaces](http://localhost:3000/api/spaces) · [3001/api/spaces](http://localhost:3001/api/spaces) | `?delay=`(ms)로 응답 지연 시뮬레이션 | [docs/PERF_API.md](./docs/PERF_API.md) |

## 측정 방법론 요약

자세한 원칙은 [위키 14](./docs/wiki/14-measurement-methodology.md). 핵심만:

1. **반드시 프로덕션 모드로 비교** — `npm run demo`. dev 모드는 HMR·미압축 번들·React 개발 경고 때문에 as-is/to-be 차이를 왜곡합니다.
2. **PerfHUD 사용법** — 모든 데모 페이지 우하단에 떠 있는 오버레이입니다.
   - **네트워크 프리셋 버튼(0 / 200 / 800 / 2000ms)**: `?apiDelay=` 쿼리를 바꿔 **API 응답만** 지연시킵니다. as-is/to-be의 구조적 차이를 증폭해서 보는 가장 빠른 방법입니다.
   - **단계 타임라인**: `ttfb`, `fcp`, `lcp`, `hydrated`, `data-received`, `stream:section-N` 같은 단계별 경과 시간(ms). 📷 표시가 있는 단계는 클릭하면 **그 순간의 화면 스냅샷**이 열립니다.
   - **JSON 복사**: 측정 결과 전체를 클립보드로 복사해 두 페이지를 나란히 비교하거나 기록으로 남길 수 있습니다.
3. **DevTools 네트워크 스로틀** — API만이 아니라 HTML/JS/CSS까지 포함한 전체 회선을 재현할 때. Network 탭 → Fast 3G / Slow 3G.
4. **`npm run throttle` 프록시** — DevTools가 없는 환경(특히 RN WebView)까지 커버하는 전체 회선 스로틀. 프로파일: `wifi / 4g / fast3g / slow3g / 2g`.

   ```bash
   # next-lab(3000)을 slow3g 회선으로: 이후 http://localhost:4300 으로 접속
   npm run throttle -- --target http://localhost:3000 --profile slow3g

   # 세부값 덮어쓰기
   npm run throttle -- --target http://localhost:3001 --profile fast3g --latency 300 --kbps 800

   # 미러 쌍(Next ↔ Start)을 같은 회선 조건으로 나란히 비교하려면 인스턴스를 2개 띄우세요
   npm run throttle -- --target http://localhost:3000 --port 4300 --profile slow3g   # → :4300 = next-lab
   npm run throttle -- --target http://localhost:3001 --port 4301 --profile slow3g   # → :4301 = start-lab
   ```

## 학습 경로

렌더링 전략 체계가 처음이라면 [위키 00 — 전체 개념도와 학습 경로](./docs/wiki/00-index.md)부터 시작하세요. 전체 위키는 [docs/wiki/](./docs/wiki/)에 있으며, 권장 순서는 "지표 이해(01) → 전략 축(02~07) → 클라이언트 최적화(08) → 프레임워크 고유 기능(09, 11) → 환경 변수(12, 13) → 측정 방법론(14)"입니다.

## FAQ

**Q. 3000/3001/3002/4300 포트가 이미 사용 중이라고 나옵니다.**
이전 실행이 안 죽었을 가능성이 큽니다. 점유 프로세스를 찾아 종료하세요.

```bash
lsof -nP -i :3000 -i :3001 -i :3002 -i :4300 | grep LISTEN
kill <PID>
```

`npm run dev`/`npm run start`는 `concurrently -k`로 실행되어 하나가 죽으면 나머지도 정리되지만, 터미널을 강제 종료한 경우 좀비가 남을 수 있습니다.

**Q. Expo(RN 데모)가 기기와 연결되지 않습니다.**
- Mac과 기기가 **같은 Wi-Fi**에 있는지 확인. 회사망처럼 클라이언트 간 통신을 막는 AP라면 `npx expo start --tunnel`을 사용하세요.
- 연결은 됐는데 웹뷰가 빈 화면이라면, 웹뷰 URL이 `localhost`로 되어 있을 가능성이 큽니다. 기기에서 `localhost`는 기기 자신입니다. `ipconfig getifaddr en0`으로 얻은 **Mac의 LAN IP**(예: `http://192.168.0.10:3000`)를 쓰세요. 스로틀을 걸려면 프록시를 띄우고 `http://<LAN IP>:4300`으로 접속합니다.

**Q. Vite 계열 앱(start-lab, react-lab)이 `crypto.hash is not a function` 등의 에러로 죽습니다.**
Node 버전 제약입니다. 최소 요구는 20.18+지만 최신 Vite는 **Node 20.19+ 또는 22.12+**를 요구합니다. `node -v` 확인 후 업그레이드하세요. 또한 `@renderlab/perf`가 심링크로 설치되는 구조라 Vite 설정에 `server.fs.allow: ['../..']`가 필요합니다(이미 설정되어 있음 — 임의로 지우면 dev 모드에서 403이 납니다).

**Q. HUD의 apiDelay 버튼과 DevTools 스로틀은 뭐가 다른가요?**
`?apiDelay=`는 **데이터 응답만** 지연시키는 시뮬레이션이고, DevTools/스로틀 프록시는 HTML·JS·CSS·API **전체 회선**을 느리게 합니다. 3단 시뮬레이션 계층의 구분은 [docs/PERF_API.md](./docs/PERF_API.md)와 [위키 12](./docs/wiki/12-network-conditions.md)를 보세요.
