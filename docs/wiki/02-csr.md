# 02. CSR — Client-Side Rendering

> **한 줄 요약**: 서버는 빈 HTML과 JS 번들만 주고 화면 구성·데이터 페치를 전부 브라우저가 하는 방식 — 서버는 단순해지지만 첫 화면까지 **왕복 3회 이상**이 필요하다.
>
> **선행 문서**: [01. 렌더링 파이프라인과 지표](./01-rendering-pipeline-and-metrics.md)

## 동작 원리

```mermaid
sequenceDiagram
    participant B as 브라우저
    participant S as 정적 서버/CDN
    participant A as API 서버

    B->>S: GET / (왕복 1)
    S-->>B: 빈 HTML (&lt;div id="root"&gt;) + &lt;script src&gt;
    Note over B: 흰 화면 (FCP 전)
    B->>S: GET bundle.js (왕복 2)
    S-->>B: JS 번들
    Note over B: js-eval — 번들 평가·실행<br/>React가 셸(스피너) 렌더 → FCP
    B->>A: GET /api/spaces (왕복 3)
    Note over B: 스피너... (여기가 CSR의 병목)
    A-->>B: JSON
    Note over B: content-rendered — 주 콘텐츠 커밋 (≈LCP)
```

구조적 특징: **HTML → JS → 데이터**가 직렬 의존이다. 각 단계는 앞 단계가 끝나야 시작할 수 있으므로, 회선 지연(RTT)이 크면 그대로 3배로 곱해진다. 이것이 [12. 네트워크 조건](./12-network-conditions.md)의 핵심 직관("지연이 크면 왕복 횟수가 지배한다")과 만나는 지점이다.

## 유리한 상황

- **로그인 뒤의 앱 화면**: 대시보드, 관리자 도구, 에디터 — SEO 불필요, 사용자별 데이터, 상호작용 위주.
- **긴 세션**: 초기 로드는 한 번이고 이후 내비게이션은 API 호출뿐이라 매우 빠르다.
- **배포 단순성**: 정적 파일 호스팅/CDN만으로 끝. 서버 런타임이 없다.

## 불리한 상황

- **첫 방문 콘텐츠가 중요한 페이지**: 랜딩, 상품 목록, 글. FCP/LCP가 번들+데이터에 볼모로 잡힌다.
- **느린 회선·저사양 기기**: JS 다운로드와 평가 비용을 사용자 기기가 전부 낸다.
- **SEO / 링크 미리보기**: 크롤러가 빈 HTML을 볼 수 있다.

## 전형적 함정

1. **요청 워터폴(request waterfall)**: 데이터 요청이 "JS 로드 완료 후"에야 시작된다. 컴포넌트 안에서 또 컴포넌트가 fetch하면 폭포가 층층이 쌓인다 → [08. 워터폴 제거](./08-client-rendering-optimizations.md).
2. **번들 비대**: "어차피 CSR이니까"라며 전부 한 번들에 넣으면 `js-eval`이 밀리고 TTI가 무너진다 → 코드 분할.
3. **스피너 지옥**: FCP는 빨라 보이지만(빈 셸이 그려지니까) 사용자가 실제로 원하는 콘텐츠(LCP)는 한참 뒤. **FCP만 보고 "빠르다"고 속는 대표 사례** — [14. 측정 방법론](./14-measurement-methodology.md).

## 관련 데모

| 데모 | URL | 확인할 것 |
|---|---|---|
| next-lab CSR 쪽 | [http://localhost:3000/csr-vs-ssr/as-is](http://localhost:3000/csr-vs-ssr/as-is) | HUD에서 `fcp`(스켈레톤 셸)와 `content-rendered`의 간격. 스냅샷 필름스트립: 스켈레톤 → 콘텐츠. 단, 이 데모는 셸은 SSR로 오고 데이터만 클라이언트 페치 — CSR의 "데이터 워터폴"만 재현한다. 다이어그램 그대로의 빈 HTML CSR은 react-lab(3002) |
| SSR 대조군 | [http://localhost:3000/csr-vs-ssr/to-be](http://localhost:3000/csr-vs-ssr/to-be) | 같은 화면이 `fcp` 시점에 이미 콘텐츠를 갖고 있음 |
| start-lab 미러 쌍 | [http://localhost:3001/loader-vs-client/as-is](http://localhost:3001/loader-vs-client/as-is) | 같은 문제의 Start 버전 ([11. Next vs Start](./11-next-vs-start.md)) |
| 순수 CSR 앱 전체 | [http://localhost:3002/](http://localhost:3002/) | react-lab은 앱 전체가 CSR — 모든 데모에서 위 시그니처가 기본값 |

**실험 순서 제안**: as-is에서 HUD 프리셋 `800ms`를 눌러 `?apiDelay=800`을 건다 → `data-received`와 `content-rendered`가 통째로 밀리는 것 확인 → to-be에서 같은 프리셋 → 밀리는 것이 `ttfb`로 옮겨가는 것 확인. **지연이 사라지는 게 아니라 어느 단계가 흡수하느냐가 바뀐다**는 것이 CSR vs SSR의 본질이다.

---

**다음 문서**: [03. SSR](./03-ssr.md)
