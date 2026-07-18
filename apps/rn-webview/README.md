# rn-webview — renderlab RN WebView Lab

같은 renderlab 데모를 **RN WebView 안에서 열어** Mac 브라우저와 성능을 비교하는 Expo 앱입니다.
웹 페이지에 붙어 있는 `@renderlab/perf`의 PerfHUD는 `window.ReactNativeWebView`가 있으면
자동으로 단계(stage) 타임라인을 `postMessage`로 전송하고, 이 앱이 그것을 받아
하단 패널에 실시간 표시 + 기록 저장 + A/B 비교를 제공합니다.

- 프레임워크: Expo SDK 57 (Expo Go 실행 가능) + TypeScript
- 내비게이션 라이브러리 없음 — `useState`로 화면 전환 (설정+카탈로그 / WebView / 기록 비교)
- 의존성 최소화: `expo`, `react`, `react-native`, `react-native-webview`, `expo-constants`, `expo-status-bar`

## 실행법

**폰과 Mac이 같은 Wi-Fi에 있어야 합니다.** (Expo 개발 서버와 랩 서버 모두 LAN으로 접속)

```bash
# 1) 이 앱 설치
cd apps/rn-webview
npm install

# 2) 비교 대상 랩 서버 켜기 (repo 루트에서 — 3000 next / 3001 start / 3002 react)
cd ../.. && npm run dev        # 또는 개별 앱만: npm --prefix apps/next-lab run dev

# 3) Expo 개발 서버 시작 → 폰의 Expo Go 앱으로 QR 스캔
cd apps/rn-webview
npx expo start
```

- 호스트 IP는 Expo `hostUri`에서 자동 감지됩니다(개발 Mac의 LAN IP). 필요하면 설정 화면에서 직접 수정하세요.
- 타입체크/빌드 검증: `npm run build` (= `tsc --noEmit`)

## 화면 구성

| 화면 | 역할 |
|---|---|
| 설정 + 카탈로그 | 호스트 IP · 포트 프리셋(3000/3001/3002/4300) · apiDelay 프리셋(0/200/800/2000ms) 선택 후 데모 탭 |
| WebView | 데모 로드. 하단 패널에 perf 단계(name/t/Δ) 실시간 갱신, final 수신 시 FCP/LCP/hydrated 요약 고정. "기록 저장" / "새로고침" |
| 기록 비교 | 저장된 기록 2개(A/B) 선택 → 단계별 나란히 비교, 공통 단계는 Δms(B−A) 표시 |

## 데모 카탈로그 (src/catalog.ts 단일 소스)

apiDelay는 URL 조립 시 쿼리로 삽입됩니다. 해시 라우트는 해시 **앞**에 넣습니다
(`http://IP:3002/?apiDelay=800#/memo/as-is`) — 웹 쪽 `getApiDelay()`가 `location.search`만 읽기 때문입니다.

### next-lab :3000

| 경로 | 전략 | 웹뷰에서 볼 것 |
|---|---|---|
| `/csr-vs-ssr/as-is` | CSR (클라이언트 fetch) | 빈 화면 → hydrated 후 data-requested/received가 늦게 시작 |
| `/csr-vs-ssr/to-be` | SSR (서버 렌더) | ttfb 직후 fcp에 콘텐츠 포함 — 저성능 기기에서 차이 확대 |
| `/blocking-vs-streaming/as-is` | 블로킹 SSR | ttfb 자체가 apiDelay만큼 밀림 |
| `/blocking-vs-streaming/to-be` | 스트리밍 SSR | 빠른 fcp 후 `stream:section-N`이 순차 도착 |
| `/rendering-modes/ssr` | 요청마다 렌더 | ttfb에 서버 처리 시간 포함 |
| `/rendering-modes/ssg` | 빌드 시 정적화 | 가장 빠른 ttfb/fcp 기준선 |
| `/rendering-modes/isr` | 주기적 재생성 | 재검증 주기에 따른 ttfb 변화 |
| `/rsc-payload/as-is` | 클라이언트 컴포넌트 위주 | js-eval→hydrated 구간과 long-tasks 증가 |
| `/rsc-payload/to-be` | 서버 컴포넌트 위주 | 번들 축소로 hydrated 앞당겨짐 |

### start-lab :3001

| 경로 | 전략 | 웹뷰에서 볼 것 |
|---|---|---|
| `/loader-vs-client/as-is` | 마운트 후 클라이언트 fetch | hydrated 이후에야 data-requested |
| `/loader-vs-client/to-be` | 라우트 loader | 탐색과 동시에 데이터 — content-rendered 당겨짐 |
| `/blocking-vs-deferred/as-is` | 블로킹 loader | 가장 느린 데이터가 전체 첫 페인트를 붙잡음 |
| `/blocking-vs-deferred/to-be` | deferred loader | 빠른 뼈대 먼저, 느린 섹션은 나중에 (section-N) |
| `/selective-ssr/full` | 전체 SSR | fcp 빠름, hydration 비용 존재 |
| `/selective-ssr/data-only` | 데이터만 SSR | 중간 절충 — fcp/hydrated 균형 |
| `/selective-ssr/spa` | SPA 모드 | fcp 늦음, 서버 부담 최소 |
| `/cache-preload/as-is` | 캐시 없음 | 재방문에도 매번 data-requested |
| `/cache-preload/to-be` | 캐시 + preload | 재방문 시 data-received 즉시 |

### react-lab :3002

| 경로 | 전략 | 웹뷰에서 볼 것 |
|---|---|---|
| `/#/transition/as-is` | 동기 필터링 | worst-interaction/long-tasks 급증 (폰에서 더 큼) |
| `/#/transition/to-be` | useTransition | 입력 반응 유지 — worst-interaction 감소 |
| `/#/memo/as-is` | memo 없음 | 리렌더 폭주로 long-tasks 누적 |
| `/#/memo/to-be` | memo 적용 | 변경분만 렌더 |
| `/#/virtual/as-is` | 대량 목록 전체 렌더 | content-rendered 지연 + 메인스레드 블로킹 |
| `/#/virtual/to-be` | 가상 스크롤 | DOM 축소로 상호작용 부드러움 |
| `/#/waterfall/as-is` | 순차 fetch | data-received가 계단식으로 늦음 |
| `/#/waterfall/to-be` | 병렬 fetch | 동시 요청으로 총 대기 단축 |
| `/bundle-as-is.html` | 단일 번들 | js-eval→hydrated 구간이 김 |
| `/bundle-to-be.html` | 코드 스플리팅 | 초기 번들 축소, 지연 섹션은 나중 로드 |

## 웹 vs 웹뷰 비교 절차

1. Mac 브라우저에서 데모를 열고 HUD의 "JSON 복사"로 수치 확보 (또는 눈으로 기록).
2. 이 앱에서 **같은 경로 + 같은 apiDelay**로 데모를 열고 final 수신 후 "기록 저장".
3. as-is/to-be 쌍도 각각 저장 → "기록 비교"에서 2개 선택.
4. 공통 단계(fcp/lcp/hydrated/data-received…)의 Δms로 비교합니다. 폰 CPU가 느려서
   js-eval→hydrated 구간(hydration 비용)이 데스크톱보다 크게 벌어지는 것이 핵심 관찰 포인트입니다.

## throttle-proxy(:4300)와 조합 — 느린 회선 재현

RN WebView에는 DevTools 스로틀이 없으므로, HTML/JS/CSS/API 전체 회선 지연은 프록시로 재현합니다.

```bash
# Mac에서: 3000(next-lab)을 향한 slow3g 프록시
npm run throttle -- --target http://localhost:3000 --profile slow3g   # repo 루트에서
```

앱 설정 화면에서 포트 프리셋 **4300 throttle**을 선택하면 모든 데모가 `:4300`으로 열립니다.
프로파일: `wifi / 4g / fast3g / slow3g / 2g`. apiDelay(API만 지연)와 달리 **문서/번들 전송까지 전부**
느려지므로 스트리밍 SSR·코드 스플리팅의 체감 차이가 가장 극명해집니다.

## iOS에서 로컬 http가 되는 이유

iOS는 원래 ATS(App Transport Security)로 평문 http를 막지만, **Expo Go는 개발용 클라이언트라
로컬 네트워크 http 접근이 허용**되어 있습니다. 별도 Info.plist 설정 없이 `http://<Mac IP>:3000`을
열 수 있습니다. (단독 배포 빌드로 만들 때는 ATS 예외를 직접 넣어야 합니다.)
iOS 14+에서 처음 실행하면 "로컬 네트워크 접근" 권한 팝업이 뜨는데 허용해야 합니다.

## 자주 막히는 지점

| 증상 | 원인 / 해결 |
|---|---|
| WebView가 "연결 실패" | 랩 서버 미기동. Mac에서 `npm run dev` 확인 후 새로고침 |
| Expo Go는 되는데 데모만 안 열림 | macOS 방화벽이 Node 수신을 차단 — 시스템 설정 → 네트워크 → 방화벽에서 Node/터미널 허용 |
| 어제는 됐는데 오늘 안 됨 | Wi-Fi 재접속으로 **Mac IP가 바뀜** — 설정 화면의 호스트 IP를 갱신 (Expo 재시작 시 자동 감지) |
| perf 단계가 안 뜸 | 페이지에 PerfHUD가 없는 경로(404 등)이거나, 아직 final 이전 — 250ms 스로틀로 갱신되니 잠시 대기 |
| 폰/Mac이 다른 서브넷 | 게스트 Wi-Fi·AP 격리(isolation) 환경에서는 LAN 접속 불가 — 같은 일반 네트워크 사용 |
| 기록이 사라짐 | 실행 기록은 메모리 보관 — 앱(Expo Go) 재시작 시 초기화됩니다 |

## 빌드 실측치 (2026-07-18, 이 저장소에서 실제 측정)

| 항목 | 값 |
|---|---|
| `npm install` | 469 packages (심링크 `@renderlab/perf`, `@renderlab/mock-data` 포함) |
| `npx tsc --noEmit` | 오류 0 (TypeScript 6.0, strict) |
| `npx expo export --platform android` | Hermes 번들 **1,478,269 bytes (약 1.5MB)**, 592 modules, Metro 번들링 4.6s |
| 주요 버전 | expo 57.0.7 · react 19.2.3 · react-native 0.86.0 · react-native-webview 13.16.1 |

> `react-native-webview`는 npm 최신(14.x)이 아니라 **Expo SDK 57이 지정한 13.16.1**을 사용합니다.
> Expo Go 런타임에 내장된 네이티브 모듈 버전과 일치해야 하기 때문입니다 (`npx expo install`로 선택).
