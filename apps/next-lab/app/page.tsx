import Link from 'next/link'

// 카탈로그 인덱스 — next-lab의 렌더링 접근 철학 요약 + 전체 데모 목록.

interface CatalogRow {
  path: string
  title: string
  strategy: string
  kind: 'as-is' | 'to-be' | 'variant' | 'index'
  pair?: string
  desc: string
}

const CATALOG: CatalogRow[] = [
  {
    path: '/csr-vs-ssr/as-is',
    title: 'CSR vs SSR',
    strategy: 'CSR — 클라이언트 fetch',
    kind: 'as-is',
    pair: '/csr-vs-ssr/to-be',
    desc: '빈 셸 + 스켈레톤을 먼저 받고, 데이터는 hydration 이후 클라이언트에서 가져온다. 콘텐츠 표시가 늦다.',
  },
  {
    path: '/csr-vs-ssr/to-be',
    title: 'CSR vs SSR',
    strategy: 'SSR — 서버 컴포넌트에서 직접 데이터',
    kind: 'to-be',
    pair: '/csr-vs-ssr/as-is',
    desc: '서버가 데이터를 채운 HTML을 보낸다. 첫 페인트에 콘텐츠가 있는 대신 TTFB가 데이터 지연에 묶인다.',
  },
  {
    path: '/blocking-vs-streaming/as-is',
    title: 'Blocking vs Streaming',
    strategy: 'Blocking SSR — 전체 await 후 렌더',
    kind: 'as-is',
    pair: '/blocking-vs-streaming/to-be',
    desc: '세 섹션 데이터를 전부 기다린 뒤에야 첫 바이트가 나간다. 가장 느린 섹션이 전체 TTFB를 결정한다.',
  },
  {
    path: '/blocking-vs-streaming/to-be',
    title: 'Blocking vs Streaming',
    strategy: 'Streaming SSR — Suspense 단위 스트리밍',
    kind: 'to-be',
    pair: '/blocking-vs-streaming/as-is',
    desc: '셸을 즉시 흘려보내고 섹션별로 준비되는 대로 청크를 잇는다. stream:section-N 단계가 계단식으로 찍힌다.',
  },
  {
    path: '/rendering-modes',
    title: '렌더링 모드 트리오',
    strategy: 'SSR · SSG · ISR 소개',
    kind: 'index',
    desc: '같은 화면을 라우트 단위 렌더링 모드 3종으로 각각 제공. 언제 무엇을 쓰는지 비교.',
  },
  {
    path: '/rendering-modes/ssr',
    title: '렌더링 모드',
    strategy: 'SSR (force-dynamic)',
    kind: 'variant',
    pair: '/rendering-modes/ssg',
    desc: '매 요청마다 서버에서 새로 렌더. 새로고침마다 요청 시각이 바뀐다.',
  },
  {
    path: '/rendering-modes/ssg',
    title: '렌더링 모드',
    strategy: 'SSG (정적 생성)',
    kind: 'variant',
    pair: '/rendering-modes/isr',
    desc: '빌드 시점에 HTML을 한 번 생성. 요청 시 서버 작업이 없어 TTFB가 가장 빠르다.',
  },
  {
    path: '/rendering-modes/isr',
    title: '렌더링 모드',
    strategy: 'ISR (revalidate: 10)',
    kind: 'variant',
    pair: '/rendering-modes/ssr',
    desc: '정적 캐시를 주되 10초가 지나면 백그라운드에서 재생성(stale-while-revalidate).',
  },
  {
    path: '/rsc-payload/as-is',
    title: 'RSC Payload',
    strategy: '클라이언트 번들 렌더 (marked + highlight.js 전체)',
    kind: 'as-is',
    pair: '/rsc-payload/to-be',
    desc: '마크다운 파서 + 하이라이터 전체가 클라이언트 번들에 실린다. js-eval→hydrated 간격과 long-tasks가 커진다.',
  },
  {
    path: '/rsc-payload/to-be',
    title: 'RSC Payload',
    strategy: '서버 컴포넌트 렌더 (번들에 하이라이터 없음)',
    kind: 'to-be',
    pair: '/rsc-payload/as-is',
    desc: '같은 문서 30개를 서버에서 HTML로 렌더해 전송. First Load JS가 극적으로 줄어든다.',
  },
  {
    path: '/prefetch-cache/as-is',
    title: 'Prefetch & Router Cache',
    strategy: 'Link prefetch={false} — 프리페치·로딩 셸 없음',
    kind: 'as-is',
    pair: '/prefetch-cache/to-be',
    desc: '목록→상세 전환이 클릭 후에야 시작된다. 응답까지 화면이 무반응 — spa-nav:start→done 간격이 그대로 체감 지연.',
  },
  {
    path: '/prefetch-cache/to-be',
    title: 'Prefetch & Router Cache',
    strategy: '기본 prefetch + loading.tsx + staleTimes 60s',
    kind: 'to-be',
    pair: '/prefetch-cache/as-is',
    desc: '뷰포트 프리페치로 클릭 즉시 로딩 셸, Router Cache(staleTimes 60s)로 재방문·뒤로가기는 수 ms.',
  },
]

const BADGE: Record<CatalogRow['kind'], string> = {
  'as-is': 'badge badge-as-is',
  'to-be': 'badge badge-to-be',
  variant: 'badge badge-variant',
  index: 'badge badge-variant',
}

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <h1>next-lab — 렌더링 전략 실험 데모</h1>
          <p>
            같은 화면(스터디스페이스 목록)을 서로 다른 렌더링 전략으로 구현하고, 우하단 <b>PerfHUD</b>의 단계
            타임라인·스냅샷·네트워크 프리셋(?apiDelay=)으로 차이를 <b>눈과 숫자</b>로 확인합니다.
          </p>
          <p>
            같은 시나리오의 TanStack Start 구현은 <a href="http://localhost:3001">start-lab (http://localhost:3001)</a>
            에서 나란히 비교할 수 있습니다.
          </p>
          <div className="philosophy">
            <div>
              <h3>1. 서버 우선 (RSC)</h3>
              <p>
                Next는 기본이 서버 컴포넌트다. 데이터 접근·무거운 렌더(마크다운, 하이라이트)는 서버에 두고, 클라이언트
                번들에는 상호작용에 필요한 코드만 남긴다.
              </p>
            </div>
            <div>
              <h3>2. 라우트 단위 렌더링 모드</h3>
              <p>
                같은 앱 안에서 라우트마다 SSR(force-dynamic) / SSG(정적) / ISR(revalidate)을 선택한다. 페이지 성격에
                맞는 모드를 개별로 고르는 것이 Next의 방식.
              </p>
            </div>
            <div>
              <h3>3. 프레임워크 캐시 계층</h3>
              <p>
                빌드 산출물 캐시(Full Route Cache)와 revalidate 기반 무효화가 프레임워크에 내장되어 있다. ISR 데모에서
                stale-while-revalidate 동작을 직접 실험한다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="catalog">
        <h2>데모 카탈로그</h2>
        <div className="catalog-table-wrap">
          <table>
            <thead>
              <tr>
                <th>구분</th>
                <th>시나리오</th>
                <th>전략</th>
                <th>설명</th>
                <th>짝</th>
              </tr>
            </thead>
            <tbody>
              {CATALOG.map((row) => (
                <tr key={row.path}>
                  <td>
                    <span className={BADGE[row.kind]}>{row.kind.toUpperCase()}</span>
                  </td>
                  <td>
                    <Link href={row.path}>
                      <b>{row.title}</b>
                    </Link>
                    <br />
                    <code>{row.path}</code>
                  </td>
                  <td>{row.strategy}</td>
                  <td>{row.desc}</td>
                  <td>{row.pair ? <Link href={row.pair}>{row.pair}</Link> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>사용법</h2>
        <div className="note">
          <ul>
            <li>
              각 데모 우하단 <b>PerfHUD</b> 알약을 클릭하면 단계 타임라인(ttfb/fcp/lcp/hydrated/커스텀 단계)과 단계별
              화면 스냅샷이 열립니다.
            </li>
            <li>
              HUD의 <b>네트워크 프리셋(0/200/800/2000ms)</b>은 <code>?apiDelay=</code> 쿼리를 바꿔 데이터 응답만
              지연시킵니다. as-is/to-be에서 같은 지연으로 재측정해 비교하세요.
            </li>
            <li>
              데이터·화면 구성은 쌍끼리 완전히 동일합니다(seed 고정 mock). 달라지는 것은 <b>렌더링 전략뿐</b>입니다.
            </li>
          </ul>
        </div>
      </section>
    </>
  )
}
