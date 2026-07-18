// renderlab 데모 카탈로그 — 단일 소스. (이후 문서 정합 단계에서 수정될 수 있음)
// 각 항목은 웹 앱(next-lab/start-lab/react-lab)에 실제로 존재하는 데모 경로를 가리킨다.

export type LabApp = 'next-lab' | 'start-lab' | 'react-lab'

export interface CatalogItem {
  app: LabApp
  port: number
  path: string
  title: string
  /** as-is/to-be 쌍의 반대편 경로 */
  pairPath?: string
}

export type DemoKind = 'as-is' | 'to-be' | 'variant'

/** 경로에서 데모 종류(as-is/to-be/variant)를 유도한다. 배지 표시용. */
export function kindOf(item: CatalogItem): DemoKind {
  if (item.path.includes('as-is')) return 'as-is'
  if (item.path.includes('to-be')) return 'to-be'
  return 'variant'
}

export const APP_LABELS: Record<LabApp, string> = {
  'next-lab': 'next-lab :3000 — Next.js App Router (SSR/SSG/ISR/RSC/스트리밍)',
  'start-lab': 'start-lab :3001 — TanStack Start (loader/deferred/selective SSR)',
  'react-lab': 'react-lab :3002 — Vite CSR (transition/memo/virtual/번들 분할)',
}

/** 포트 프리셋. 'auto'는 카탈로그 항목의 포트를 그대로 사용한다. */
export const PORT_PRESETS: Array<{ label: string; value: 'auto' | number; desc: string }> = [
  { label: '자동', value: 'auto', desc: '카탈로그 항목의 원래 포트 사용' },
  { label: '3000 next', value: 3000, desc: 'next-lab 직접 접속' },
  { label: '3001 start', value: 3001, desc: 'start-lab 직접 접속' },
  { label: '3002 react', value: 3002, desc: 'react-lab 직접 접속' },
  { label: '4300 throttle', value: 4300, desc: 'throttle-proxy 경유 (느린 회선 재현)' },
]

/** apiDelay 프리셋(ms) — 웹 HUD의 네트워크 프리셋과 동일한 값. */
export const API_DELAY_PRESETS = [0, 200, 800, 2000]

export const CATALOG: CatalogItem[] = [
  // ── next-lab (3000) ──────────────────────────────────────────────
  { app: 'next-lab', port: 3000, path: '/csr-vs-ssr/as-is', title: 'CSR 목록 (클라이언트 fetch)', pairPath: '/csr-vs-ssr/to-be' },
  { app: 'next-lab', port: 3000, path: '/csr-vs-ssr/to-be', title: 'SSR 목록 (서버 렌더)', pairPath: '/csr-vs-ssr/as-is' },
  { app: 'next-lab', port: 3000, path: '/blocking-vs-streaming/as-is', title: '블로킹 SSR (전체 대기)', pairPath: '/blocking-vs-streaming/to-be' },
  { app: 'next-lab', port: 3000, path: '/blocking-vs-streaming/to-be', title: '스트리밍 SSR (Suspense 단계 전송)', pairPath: '/blocking-vs-streaming/as-is' },
  { app: 'next-lab', port: 3000, path: '/rendering-modes/ssr', title: '렌더링 모드 — SSR (요청마다 렌더)' },
  { app: 'next-lab', port: 3000, path: '/rendering-modes/ssg', title: '렌더링 모드 — SSG (빌드 시 정적화)' },
  { app: 'next-lab', port: 3000, path: '/rendering-modes/isr', title: '렌더링 모드 — ISR (주기적 재생성)' },
  { app: 'next-lab', port: 3000, path: '/rsc-payload/as-is', title: 'RSC 페이로드 — 클라이언트 컴포넌트 위주', pairPath: '/rsc-payload/to-be' },
  { app: 'next-lab', port: 3000, path: '/rsc-payload/to-be', title: 'RSC 페이로드 — 서버 컴포넌트 위주', pairPath: '/rsc-payload/as-is' },
  { app: 'next-lab', port: 3000, path: '/prefetch-cache/as-is', title: '프리페치 없음 (클릭 후 대기)', pairPath: '/prefetch-cache/to-be' },
  { app: 'next-lab', port: 3000, path: '/prefetch-cache/to-be', title: '프리페치 + Router Cache (전환 즉시)', pairPath: '/prefetch-cache/as-is' },

  // ── start-lab (3001) ─────────────────────────────────────────────
  { app: 'start-lab', port: 3001, path: '/loader-vs-client/as-is', title: '클라이언트 fetch (마운트 후 요청)', pairPath: '/loader-vs-client/to-be' },
  { app: 'start-lab', port: 3001, path: '/loader-vs-client/to-be', title: '라우트 loader (탐색과 동시 요청)', pairPath: '/loader-vs-client/as-is' },
  { app: 'start-lab', port: 3001, path: '/blocking-vs-deferred/as-is', title: '블로킹 loader (모든 데이터 대기)', pairPath: '/blocking-vs-deferred/to-be' },
  { app: 'start-lab', port: 3001, path: '/blocking-vs-deferred/to-be', title: 'deferred loader (느린 데이터 나중에)', pairPath: '/blocking-vs-deferred/as-is' },
  { app: 'start-lab', port: 3001, path: '/selective-ssr/full', title: 'Selective SSR — 전체 SSR' },
  { app: 'start-lab', port: 3001, path: '/selective-ssr/data-only', title: 'Selective SSR — 데이터만 SSR' },
  { app: 'start-lab', port: 3001, path: '/selective-ssr/spa', title: 'Selective SSR — SPA 모드' },
  { app: 'start-lab', port: 3001, path: '/cache-preload/as-is', title: '캐시 없음 (매번 재요청)', pairPath: '/cache-preload/to-be' },
  { app: 'start-lab', port: 3001, path: '/cache-preload/to-be', title: '캐시 + preload (재방문 즉시)', pairPath: '/cache-preload/as-is' },

  // ── react-lab (3002) ─────────────────────────────────────────────
  { app: 'react-lab', port: 3002, path: '/#/transition/as-is', title: '동기 필터링 (입력 버벅임)', pairPath: '/#/transition/to-be' },
  { app: 'react-lab', port: 3002, path: '/#/transition/to-be', title: 'useTransition (입력 우선)', pairPath: '/#/transition/as-is' },
  { app: 'react-lab', port: 3002, path: '/#/memo/as-is', title: '전체 리렌더 (memo 없음)', pairPath: '/#/memo/to-be' },
  { app: 'react-lab', port: 3002, path: '/#/memo/to-be', title: 'memo 적용 (변경분만 렌더)', pairPath: '/#/memo/as-is' },
  { app: 'react-lab', port: 3002, path: '/#/virtual/as-is', title: '대량 목록 전체 렌더', pairPath: '/#/virtual/to-be' },
  { app: 'react-lab', port: 3002, path: '/#/virtual/to-be', title: '가상 스크롤 (보이는 것만 렌더)', pairPath: '/#/virtual/as-is' },
  { app: 'react-lab', port: 3002, path: '/#/waterfall/as-is', title: '요청 워터폴 (순차 fetch)', pairPath: '/#/waterfall/to-be' },
  { app: 'react-lab', port: 3002, path: '/#/waterfall/to-be', title: '병렬 fetch (동시 요청)', pairPath: '/#/waterfall/as-is' },
  { app: 'react-lab', port: 3002, path: '/bundle-as-is.html', title: '단일 번들 (전부 미리 로드)', pairPath: '/bundle-to-be.html' },
  { app: 'react-lab', port: 3002, path: '/bundle-to-be.html', title: '코드 스플리팅 (필요할 때 로드)', pairPath: '/bundle-as-is.html' },
]

/** 앱별로 묶은 카탈로그 (설정 화면 섹션 렌더용). */
export const CATALOG_BY_APP: Array<{ app: LabApp; items: CatalogItem[] }> = (
  ['next-lab', 'start-lab', 'react-lab'] as LabApp[]
).map((app) => ({ app, items: CATALOG.filter((i) => i.app === app) }))

/**
 * 데모 URL 조립. apiDelay는 쿼리로 삽입하되, 해시 라우트(/#/...)는
 * 반드시 해시 앞에 넣는다 — 웹 쪽 getApiDelay()가 location.search만 읽기 때문.
 * 예: buildDemoUrl('192.168.0.5', 3002, '/#/memo/as-is', 800)
 *     → http://192.168.0.5:3002/?apiDelay=800#/memo/as-is
 */
export function buildDemoUrl(host: string, port: number, path: string, apiDelay: number): string {
  const base = `http://${host.trim()}:${port}`
  if (!(apiDelay > 0)) return base + path
  const q = `apiDelay=${Math.min(Math.round(apiDelay), 15000)}`
  const hashIdx = path.indexOf('#')
  if (hashIdx >= 0) {
    const before = path.slice(0, hashIdx)
    const hash = path.slice(hashIdx)
    const sep = before.includes('?') ? '&' : '?'
    return `${base}${before}${sep}${q}${hash}`
  }
  const sep = path.includes('?') ? '&' : '?'
  return `${base}${path}${sep}${q}`
}
