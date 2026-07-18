// TanStack Start 1.131.x 규약: src/router.tsx가 createRouter를 named export 해야 한다.
// (가상 클라이언트/서버 엔트리가 이 함수를 import 한다 — react-start-plugin 참고)
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { setupNavPerf } from './lib/nav-perf'

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    // 데모 목적: 로더가 막고 있으면 스켈레톤(pendingComponent)이 빨리 뜨도록.
    // 기본값(1000ms)은 짧은 로더에서 pending UI가 아예 안 보인다.
    defaultPendingMs: 100,
    defaultPendingMinMs: 200,
  })
  // SPA 전환 비용을 PerfHUD에 기록 (클라이언트에서만 동작)
  setupNavPerf(router)
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
