import { createRoot } from 'react-dom/client'
import { HydrationMarker, PerfHUD } from '@renderlab/perf'
import '../styles.css'
import { BundleApp } from './BundleApp'
// as-is의 핵심: 뷰어(= marked + highlight.js 전체)를 엔트리에서 "정적 import".
// 사용 여부와 무관하게 초기 번들에 전부 포함된다.
import { ViewerStatic } from './viewer-static'
import { SIZE_AS_IS } from './bundle-sizes'

createRoot(document.getElementById('root')!).render(
  <>
    <BundleApp
      kind="as-is"
      title="문서 뷰어 — 전량 정적 import 단일 번들"
      strategy="정적 import (분할 없음): marked + highlight.js 전체 언어"
      pairHref="./bundle-to-be.html"
      description="코드 하이라이트 문서 뷰어인데, marked와 highlight.js(190+ 언어 전부)를 엔트리에서 정적 import했다. 첫 화면은 문서 목록 + 원문 일부뿐이라 그 코드가 전혀 필요 없는데도, CSR 특성상 이 무거운 번들을 전부 받고 평가해야 첫 화면이 뜬다."
      observe={[
        'DevTools Network — 초기 JS 총량이 to-be보다 확연히 크다 (하단 실측치 참고)',
        'js-eval → fcp/hydrated 구간 — 번들 평가 비용만큼 to-be보다 길다 (느린 기기/회선일수록 격차 확대)',
        'editor-requested → editor-ready — 코드가 이미 번들에 있어 거의 0ms (as-is의 유일한 장점)',
        '전체 회선 스로틀(DevTools Fast 3G)로 열어 보면 빈 화면 시간이 그대로 체감된다',
      ]}
      Viewer={ViewerStatic}
      sizeNote={SIZE_AS_IS}
    />
    {/* PERF_API.md 계약: 엔트리(문서)마다 HydrationMarker + PerfHUD 1회 */}
    <HydrationMarker />
    <PerfHUD app="react-lab" />
  </>,
)
