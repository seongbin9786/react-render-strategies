// SPA 내비게이션 계측: TanStack Router의 이벤트를 구독해
// 클라이언트 사이드 전환(spa-nav) 비용을 PerfHUD 타임라인에 기록한다.
// - spa-nav:start — onBeforeNavigate (전환 시작, 대상 경로 기록)
// - spa-nav:done  — onResolved (로더/렌더까지 끝난 시점, 경과 ms 기록)
import { perfStage } from '@renderlab/perf'
import type { AnyRouter } from '@tanstack/react-router'

let installed = false

export function setupNavPerf(router: AnyRouter) {
  if (typeof window === 'undefined' || installed) return
  installed = true

  let navStart = 0
  let target = ''

  router.subscribe('onBeforeNavigate', (e) => {
    // 최초 문서 로드는 브라우저 내비게이션(nav-start/ttfb…)으로 이미 계측된다.
    if (!e.pathChanged && !e.hrefChanged) return
    navStart = performance.now()
    target = e.toLocation.href
    perfStage('spa-nav:start', {
      detail: `SPA 전환 시작 → ${target}`,
      snapshot: false,
    })
  })

  router.subscribe('onResolved', (e) => {
    if (navStart === 0) return
    const ms = Math.round(performance.now() - navStart)
    navStart = 0
    perfStage('spa-nav:done', {
      detail: `SPA 전환 완료 → ${e.toLocation.href} · 소요 ${ms}ms (loader 대기 + 렌더 포함)`,
    })
  })
}
