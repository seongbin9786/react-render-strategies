// 루트 문서 셸 — 모든 페이지 공통.
// head 최상단에 STREAM_BOOTSTRAP(스트리밍 마크 부트스트랩)을 인라인하고,
// body 말미에 HydrationMarker + PerfHUD를 1회 부착한다 (PERF_API.md 계약).
import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'
import { HydrationMarker, PerfHUD, STREAM_BOOTSTRAP } from '@renderlab/perf'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'start-lab — TanStack Start 렌더링 전략 랩' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="ko">
      <head>
        {/* 스트리밍 청크 도착 시점(hydration 이전)을 기록하는 부트스트랩.
            우리가 작성한 정적 상수(STREAM_BOOTSTRAP)만 인라인한다. */}
        <script dangerouslySetInnerHTML={{ __html: STREAM_BOOTSTRAP }} />
        <HeadContent />
      </head>
      <body>
        <header className="site-header">
          <Link to="/" className="brand">
            renderlab <b>start-lab</b>
          </Link>
          <nav>
            <Link to="/loader-vs-client/as-is">loader-vs-client</Link>
            <Link to="/blocking-vs-deferred/as-is">blocking-vs-deferred</Link>
            <Link to="/selective-ssr/full">selective-ssr</Link>
            <Link to="/cache-preload/as-is">cache-preload</Link>
          </nav>
          <span className="port">TanStack Start · :3001</span>
        </header>
        <Outlet />
        <HydrationMarker />
        <PerfHUD app="start-lab" />
        <Scripts />
      </body>
    </html>
  )
}
