import { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { HydrationMarker, PerfHUD } from '@renderlab/perf'
import './styles.css'
import Home from './pages/Home'
import TransitionAsIs from './pages/transition/TransitionAsIs'
import TransitionToBe from './pages/transition/TransitionToBe'
import MemoAsIs from './pages/memo/MemoAsIs'
import MemoToBe from './pages/memo/MemoToBe'
import VirtualAsIs from './pages/virtual/VirtualAsIs'
import VirtualToBe from './pages/virtual/VirtualToBe'

// waterfall 쌍은 일부러 lazy 라우트(별도 청크)로 둔다.
// to-be는 "모듈 평가 시점 = 라우트 청크 로드 시점"에 요청을 선시작(render-as-you-fetch)해야 하는데,
// 메인 번들에 eager로 포함되면 앱 부팅 순간(홈에서도) 요청이 시작돼 버려 비교가 무의미해지기 때문.
// 공정 비교를 위해 as-is도 동일하게 lazy 청크로 로드한다.
const WaterfallAsIs = lazy(() => import('./pages/waterfall/WaterfallAsIs'))
const WaterfallToBe = lazy(() => import('./pages/waterfall/WaterfallToBe'))

function PageSkeleton() {
  return (
    <div className="page-skeleton">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  )
}

function AppShell() {
  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/">
          renderlab · <em>react-lab</em>
        </Link>
        <nav>
          <Link to="/transition/as-is">transition</Link>
          <Link to="/memo/as-is">memo</Link>
          <Link to="/virtual/as-is">virtual</Link>
          <Link to="/waterfall/as-is">waterfall</Link>
          {/* 번들 분할 데모는 별도 HTML 엔트리 — SPA 라우팅이 아닌 전체 리로드 링크 */}
          <a href="./bundle-as-is.html">bundle</a>
        </nav>
      </header>
      <main className="container">
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/transition/as-is" element={<TransitionAsIs />} />
            <Route path="/transition/to-be" element={<TransitionToBe />} />
            <Route path="/memo/as-is" element={<MemoAsIs />} />
            <Route path="/memo/to-be" element={<MemoToBe />} />
            <Route path="/virtual/as-is" element={<VirtualAsIs />} />
            <Route path="/virtual/to-be" element={<VirtualToBe />} />
            <Route path="/waterfall/as-is" element={<WaterfallAsIs />} />
            <Route path="/waterfall/to-be" element={<WaterfallToBe />} />
          </Routes>
        </Suspense>
      </main>
    </>
  )
}

// HashRouter를 쓰는 이유:
//  - 서버 리라이트 설정 없이 어디서나 동작한다. vite preview·정적 호스팅·RN WebView에서
//    /transition/as-is 같은 경로로 새로고침해도 404가 나지 않는다 (경로가 # 뒤에 있으므로).
//  - PerfHUD의 네트워크 프리셋은 location.search(?apiDelay=)를 바꾸는데,
//    해시 라우팅에서는 URL이 "/?apiDelay=800#/waterfall/as-is" 형태가 되어
//    search와 라우트가 충돌하지 않는다. 데모는 반드시 getApiDelay()로 이 값을 읽는다.
//
// StrictMode를 쓰지 않는 이유: memo 데모가 "렌더 횟수"를 그대로 보여줘야 하는데
// StrictMode는 dev에서 렌더를 2번씩 실행해 숫자를 왜곡한다.
createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <AppShell />
    {/* PERF_API.md 계약: 루트 트리에 HydrationMarker + PerfHUD 1회 부착.
        CSR이므로 hydrated 단계는 "첫 mount 완료"를 뜻한다. */}
    <HydrationMarker />
    <PerfHUD app="react-lab" />
  </HashRouter>,
)
