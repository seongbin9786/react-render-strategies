'use client'
// SPA 내비게이션 계측 (start-lab의 nav-perf와 동일한 단계 이름 사용).
// Next App Router에는 TanStack Router 같은 전환 이벤트 구독 API가 없으므로,
// - spa-nav:start — Link onClick에서 기록 (전환 시작, 대상 경로)
// - spa-nav:done  — 도착 페이지의 콘텐츠가 마운트된 effect에서 기록 (경과 ms)
// 모듈 스코프 변수는 클라이언트 번들에서 페이지 간에 공유되므로 SPA 전환을 관통해 살아남는다.
import { perfStage } from '@renderlab/perf'

let navStart = 0

export function markNavStart(target: string) {
  navStart = performance.now()
  perfStage('spa-nav:start', { detail: `SPA 전환 시작 → ${target}`, snapshot: false })
}

export function markNavDone(label: string) {
  // 최초 문서 로드(마운트)에서는 시작점이 없으므로 no-op — 브라우저 내비게이션(ttfb 등)으로 이미 계측된다.
  if (navStart === 0) return
  const ms = Math.round(performance.now() - navStart)
  navStart = 0
  perfStage('spa-nav:done', { detail: `SPA 전환 완료 → ${label} · 소요 ${ms}ms (RSC 응답 대기 + 렌더 포함)` })
}
