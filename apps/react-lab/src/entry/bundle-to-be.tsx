import { lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { HydrationMarker, PerfHUD } from '@renderlab/perf'
import '../styles.css'
import { BundleApp } from './BundleApp'
import { SIZE_TO_BE } from './bundle-sizes'

// to-be의 핵심: 뷰어를 React.lazy + dynamic import로 분리.
// marked + highlight.js/lib/core(+언어 3개)는 "하이라이트 보기" 클릭 시점에야 로드된다.
const ViewerLazy = lazy(() => import('./viewer-lazy'))

createRoot(document.getElementById('root')!).render(
  <>
    <BundleApp
      kind="to-be"
      title="문서 뷰어 — lazy + dynamic import 분할 번들"
      strategy="React.lazy + dynamic import: hljs core + 언어 3개만 등록"
      pairHref="./bundle-as-is.html"
      description="같은 문서 뷰어지만 뷰어 컴포넌트를 React.lazy로 분리했고, highlight.js도 전체판 대신 lib/core에 실제 쓰는 언어 3개(javascript/typescript/xml)만 등록했다. 초기 번들에는 목록 UI만 남아 첫 화면이 빨라지고, 무거운 코드는 클릭한 사용자만 지불한다."
      observe={[
        'DevTools Network — 초기 JS 총량이 as-is보다 확연히 작다 (하단 실측치 참고)',
        'js-eval → fcp/hydrated 구간 — as-is보다 짧다 (평가할 코드가 적으므로)',
        'editor-requested → editor-ready — 청크 다운로드+평가 시간만큼 벌어진다 (분할의 비용, 스켈레톤 표시)',
        '"하이라이트 보기" 클릭 시 Network에 viewer-lazy 청크가 그제서야 나타나는 것을 확인',
      ]}
      Viewer={ViewerLazy}
      sizeNote={SIZE_TO_BE}
    />
    {/* PERF_API.md 계약: 엔트리(문서)마다 HydrationMarker + PerfHUD 1회 */}
    <HydrationMarker />
    <PerfHUD app="react-lab" />
  </>,
)
