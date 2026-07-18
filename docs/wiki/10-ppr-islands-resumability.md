# 10. PPR · Islands · Resumability — 최전선의 세 가지 답

> **한 줄 요약**: "정적의 속도"와 "동적의 신선함"과 "hydration 비용 제거"를 동시에 노리는 세 접근 — Next PPR(정적 셸+동적 구멍), Astro Islands(상호작용 섬만 hydrate), Qwik Resumability(hydration 자체 폐지) — 을 개념으로만 정리한다.
>
> **선행 문서**: [05. Streaming SSR](./05-streaming-ssr.md), [07. Hydration](./07-hydration.md)
>
> ⚠️ **이 문서는 개념 전용이다. renderlab에 대응 데모가 없다.** (이 랩이 고정한 Next 15.5에서 PPR은 canary 전용 실험 플래그(`experimental.ppr`)였고, Next 16(2025-10)에서 그 플래그가 제거되며 **Cache Components(`'use cache'`)의 일부로 안정화**됐다 — 15.5 안정판 고정인 이 랩에는 데모를 넣지 않았고, 랩을 Next 16으로 올리면 next-lab에 `/ppr` 라우트로 추가할 수 있다. Astro/Qwik은 이 랩의 범위 밖이다.)

## 세 접근의 위치

```mermaid
graph TB
  subgraph problem["풀려는 문제"]
    P1["정적 vs 동적을<br/>페이지 단위로만 골라야 함"]
    P2["페이지 대부분이 정적인데<br/>전부 hydrate함"]
    P3["hydration이라는 이중 작업<br/>자체가 낭비"]
  end
  P1 --> PPR["<b>PPR</b> (Next)<br/>한 페이지 안에서<br/>정적 셸 + 동적 구멍"]
  P2 --> ISL["<b>Islands</b> (Astro)<br/>상호작용 컴포넌트만<br/>골라서 hydrate"]
  P3 --> QWK["<b>Resumability</b> (Qwik)<br/>서버 상태를 직렬화,<br/>클라이언트는 '이어서 실행'"]
```

## PPR — Partial Prerendering (Next)

한 페이지를 **정적 셸(빌드 시 프리렌더, CDN 캐시 가능)**과 **동적 구멍(요청 시 스트리밍)**으로 나눈다. 경계는 스트리밍과 동일하게 **Suspense**다.

- 첫 바이트: 정적 셸이 CDN에서 즉시 (SSG급 TTFB — [04](./04-ssg-isr.md))
- 같은 응답 스트림으로 동적 부분이 이어서 도착 ([05. Streaming](./05-streaming-ssr.md)과 동일 메커니즘)
- 개념적으로 **"ISR + Streaming SSR을 한 페이지 안에 합친 것"**. renderlab의 두 축으로 말하면 "언제 렌더하나"를 페이지가 아닌 **섹션 단위로** 선택하는 것이다 — [09](./09-selective-ssr-and-router-caching.md)의 Start selective SSR이 같은 선택(정적/동적 혼합)을 **라우트 단위** 스위치로 내리는 것과 대비된다.
- 상태: Next 15까지는 canary 전용 실험 플래그(`experimental.ppr`)였고, Next 16(2025-10)에서 플래그가 제거되며 Cache Components(`'use cache'`)로 안정화됐다. 개념은 그대로 유효하니 API 세부는 최신 문서를 볼 것.

## Islands — Astro의 부분 hydration

페이지를 기본 **정적 HTML(JS 0)**로 굽고, 상호작용이 필요한 컴포넌트(섬, island)만 개별적으로 hydrate한다. 각 섬은 로드 전략을 따로 가진다(즉시/유휴 시/뷰포트 진입 시).

- [07. 선택적 hydration](./07-hydration.md)과의 차이: React의 선택적 hydration은 "전체를 hydrate하되 순서를 조절", Islands는 "**애초에 hydrate 대상이 아닌 영역**이 대부분".
- 콘텐츠 위주 + 산발적 상호작용(블로그, 문서, 커머스 상세)에서 강력하다. 섬들 사이 상태 공유가 필요해지는 순간 복잡해진다.

## Resumability — Qwik의 hydration 폐지

hydration이 비싼 근본 이유는 **서버가 한 일을 클라이언트가 다시 하기** 때문이다([07](./07-hydration.md)). Qwik은 서버 렌더 시점의 상태와 이벤트 배선을 HTML에 직렬화해 두고, 클라이언트는 재실행 없이 **중단된 지점부터 재개(resume)**한다. 이벤트 핸들러 코드도 실제 상호작용 시점에 지연 로드한다.

- 초기 JS가 상수 수준(수 KB)이라 TTI가 페이지 크기와 거의 무관해진다.
- 대가: 전용 컴파일러와 프로그래밍 모델. React 생태계와의 호환이 아니라 대체다.

## 관계 정리

| | 렌더 시점 | hydration | 경계 단위 |
|---|---|---|---|
| Streaming SSR ([05](./05-streaming-ssr.md)) | 요청 시 | 전체 (순서만 분할) | Suspense 섹션 |
| RSC ([06](./06-rsc.md)) | 요청 시(서버 부분) | 클라이언트 컴포넌트만 | `'use client'` 경계 |
| **PPR** | **빌드+요청 혼합** | 전체 | Suspense 섹션 |
| **Islands** | 빌드 시 위주 | **섬만** | 컴포넌트 |
| **Resumability** | 요청/빌드 | **없음** | 이벤트 핸들러 단위 |

방향은 하나로 수렴한다: **"클라이언트가 다시 해야 하는 일을 0에 가깝게"**. RSC(보낼 코드 축소) → Islands(hydrate 영역 축소) → Resumability(hydration 제거)는 같은 축의 점진적 극단화다.

## renderlab에서 유사 체험하기 (근사치)

데모는 없지만 다음 조합으로 감을 잡을 수 있다:

- PPR 근사: [SSG의 TTFB](http://localhost:3000/rendering-modes/ssg) + [스트리밍의 섹션 도착](http://localhost:3000/blocking-vs-streaming/to-be)을 각각 본 뒤 "한 페이지에 합쳐진다면"을 상상
- Islands 근사: [selective-ssr/full](http://localhost:3001/selective-ssr/full)에서 hydration 비용을 확인한 뒤, "페이지의 90%가 hydrate 대상에서 빠진다면 `hydrated`가 어디로 올까"를 추정

---

**다음 문서**: [12. 네트워크 조건](./12-network-conditions.md)
