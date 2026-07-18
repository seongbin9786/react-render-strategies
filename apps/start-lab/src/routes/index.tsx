// 카탈로그(/) — start-lab의 렌더링 접근 철학 요약 + 전체 데모 목록.
import { Link, createFileRoute } from '@tanstack/react-router'
import { validateApiDelaySearch } from '../lib/search'

export const Route = createFileRoute('/')({
  validateSearch: validateApiDelaySearch,
  component: IndexPage,
})

interface CatalogRow {
  path: string
  kind: 'as-is' | 'to-be' | 'variant'
  strategy: string
  desc: string
}

const CATALOG: { title: string; wiki: string; rows: CatalogRow[] }[] = [
  {
    title: '1. loader vs 클라이언트 fetch',
    wiki: '02-csr.md · 03-ssr.md',
    rows: [
      {
        path: '/loader-vs-client/as-is',
        kind: 'as-is',
        strategy: 'CSR — useEffect fetch',
        desc: 'SSR은 스켈레톤만. 데이터는 hydration 후 클라이언트 fetch로 — HTML에 콘텐츠 없음.',
      },
      {
        path: '/loader-vs-client/to-be',
        kind: 'to-be',
        strategy: 'isomorphic 라우트 loader',
        desc: '라우트 loader가 서버에서 데이터를 await — 첫 HTML에 콘텐츠 포함, 왕복 1회 절약.',
      },
    ],
  },
  {
    title: '2. 블로킹 SSR vs deferred 스트리밍',
    wiki: '05-streaming-ssr.md',
    rows: [
      {
        path: '/blocking-vs-deferred/as-is',
        kind: 'as-is',
        strategy: '블로킹 loader (전부 await)',
        desc: '세 데이터셋(+200/+500/+900ms)을 loader에서 전부 기다림 — TTFB가 가장 느린 것에 묶임.',
      },
      {
        path: '/blocking-vs-deferred/to-be',
        kind: 'to-be',
        strategy: 'deferred loader + Await 스트리밍',
        desc: 'loader가 Promise를 그대로 반환 — 셸 즉시 전송, 섹션이 준비되는 순서대로 스트리밍.',
      },
    ],
  },
  {
    title: '3. Selective SSR — 라우트 단위 SSR 제어 (Start 고유)',
    wiki: '09-selective-ssr-and-router-caching.md',
    rows: [
      {
        path: '/selective-ssr/full',
        kind: 'variant',
        strategy: 'ssr: true (full SSR)',
        desc: 'loader+컴포넌트 모두 서버 실행 — HTML에 콘텐츠 포함, 대신 TTFB가 loader에 블록.',
      },
      {
        path: '/selective-ssr/data-only',
        kind: 'variant',
        strategy: "ssr: 'data-only'",
        desc: 'loader만 서버 실행, 마크업은 클라이언트 렌더 — 데이터 왕복은 절약하되 렌더 비용은 클라이언트로.',
      },
      {
        path: '/selective-ssr/spa',
        kind: 'variant',
        strategy: 'ssr: false (SPA)',
        desc: 'loader도 컴포넌트도 클라이언트에서 — 서버는 셸만. TTFB 최소, 콘텐츠는 가장 늦음.',
      },
    ],
  },
  {
    title: '4. 라우터 캐시 + 프리로드',
    wiki: '09-selective-ssr-and-router-caching.md',
    rows: [
      {
        path: '/cache-preload/as-is',
        kind: 'as-is',
        strategy: '캐시 없음 + 프리로드 없음',
        desc: '목록→상세→목록, 이동할 때마다 loader 재실행(500ms) — 모든 전환이 느리다.',
      },
      {
        path: '/cache-preload/to-be',
        kind: 'to-be',
        strategy: 'staleTime 60s + preload="intent"',
        desc: '호버 순간 프리로드 + 캐시 재사용 — 클릭 즉시 전환, 뒤로가기 즉시.',
      },
    ],
  },
]

function IndexPage() {
  return (
    <div className="page">
      <div className="hero">
        <h1>start-lab — TanStack Start 렌더링 전략 데모</h1>
        <p>
          같은 화면(스터디스페이스 목록)을 서로 다른 렌더링 전략으로 구현한 <b>as-is/to-be 쌍 데모</b>를 눈과
          숫자(PerfHUD)로 비교하는 랩입니다. 우하단 HUD를 펼치면 단계 타임라인·단계별 화면 스냅샷·네트워크
          프리셋(?apiDelay=)이 보입니다.
        </p>
        <p>
          <b>Start의 접근 철학</b> — Next.js가 "컴포넌트(RSC) 중심"이라면 TanStack Start는 <b>라우터 중심</b>입니다:
        </p>
        <ul>
          <li>
            <b>isomorphic loader</b> — 같은 loader 코드가 첫 요청엔 서버에서, SPA 전환엔 클라이언트에서 실행된다.
          </li>
          <li>
            <b>라우트 단위 세밀한 SSR 제어</b> — 라우트마다 <code>ssr: true | 'data-only' | false</code>로 서버가 할
            일을 고른다 (Start 고유 기능).
          </li>
          <li>
            <b>deferred 스트리밍</b> — loader가 Promise를 그대로 반환하면 셸 먼저, 데이터는 준비되는 대로 스트리밍.
          </li>
          <li>
            <b>라우터 캐시</b> — staleTime/gcTime/preload="intent"로 SPA 전환을 0ms에 수렴시킨다.
          </li>
        </ul>
        <p className="footnote">
          같은 시나리오의 Next.js(App Router) 구현은 <a href="http://localhost:3000">next-lab (localhost:3000)</a>에서
          비교할 수 있습니다.
        </p>
      </div>

      {CATALOG.map((group) => (
        <section key={group.title}>
          <h2 className="section-title">
            {group.title} <span className="badge badge-wiki">wiki: {group.wiki}</span>
          </h2>
          <table className="catalog">
            <thead>
              <tr>
                <th style={{ width: 230 }}>경로</th>
                <th style={{ width: 90 }}>구분</th>
                <th style={{ width: 220 }}>전략</th>
                <th>무엇을 보는가</th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map((row) => (
                <tr key={row.path}>
                  <td className="path">
                    <Link to={row.path} search={(prev: Record<string, unknown>) => prev}>
                      {row.path}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge badge-${row.kind}`}>{row.kind}</span>
                  </td>
                  <td>{row.strategy}</td>
                  <td>{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <section>
        <h2 className="section-title">부록 — 측정용 API</h2>
        <table className="catalog">
          <tbody>
            <tr>
              <td className="path">
                <a href="/api/spaces?count=5&delay=0">/api/spaces</a>
              </td>
              <td>
                <span className="badge badge-strategy">server route</span>
              </td>
              <td>GET · delay/count/region</td>
              <td>Start의 서버 라우트로 만든 JSON 엔드포인트 (no-store). RN WebView/외부 측정용 — next-lab과 동일 스펙.</td>
            </tr>
          </tbody>
        </table>
        <p className="footnote">
          모든 데모는 <code>?apiDelay=</code> 쿼리(HUD 프리셋 버튼)로 데이터 지연을 조절해 재측정할 수 있습니다. 카탈로그
          링크는 SPA 전환이라 HUD에 <code>spa-nav:start/done</code> 단계가 찍힙니다 — 전체 리로드 측정을 원하면
          브라우저 새로고침을 사용하세요.
        </p>
      </section>
    </div>
  )
}
