import { Link } from 'react-router-dom'

interface CatalogRow {
  strategy: string
  pair: string
  desc: string
  links: { label: string; href: string; external?: boolean }[]
}

const CATALOG: CatalogRow[] = [
  {
    strategy: '동시성 렌더링 (useTransition + useDeferredValue)',
    pair: '#/transition/as-is ↔ #/transition/to-be',
    desc: '20,000개 아이템 검색 필터. 입력과 무거운 리스트 렌더가 같은 동기 렌더에 묶이면 타이핑이 버벅인다. 전환(transition)으로 리스트 갱신을 끊어 입력 반응성을 지킨다.',
    links: [
      { label: 'as-is', href: '#/transition/as-is' },
      { label: 'to-be', href: '#/transition/to-be' },
    ],
  },
  {
    strategy: '리렌더 제어 (React.memo + 안정 props)',
    pair: '#/memo/as-is ↔ #/memo/to-be',
    desc: '텍스트 입력 + 카드 500개. 키 입력마다 전 카드가 리렌더되는 낭비를 카드별 렌더 카운트와 배경 플래시로 눈으로 확인하고, memo로 0개까지 줄인다.',
    links: [
      { label: 'as-is', href: '#/memo/as-is' },
      { label: 'to-be', href: '#/memo/to-be' },
    ],
  },
  {
    strategy: '리스트 가상화 (@tanstack/react-virtual)',
    pair: '#/virtual/as-is ↔ #/virtual/to-be',
    desc: '10,000행을 전부 DOM에 그리는 것 vs 화면에 보이는 행만 그리는 것. DOM 노드 수와 초기 렌더 long-task 차이를 계측한다.',
    links: [
      { label: 'as-is', href: '#/virtual/as-is' },
      { label: 'to-be', href: '#/virtual/to-be' },
    ],
  },
  {
    strategy: '요청 병렬화 (Promise.all + render-as-you-fetch)',
    pair: '#/waterfall/as-is ↔ #/waterfall/to-be',
    desc: '3개 지역 데이터를 순차 fetch(워터폴)하면 지연이 3배로 쌓인다. 병렬화 + 모듈 로드 시점 요청 선시작으로 전체 대기를 1회 지연으로 줄인다. HUD 워터폴에서 직렬/병렬이 그림으로 보인다.',
    links: [
      { label: 'as-is', href: '#/waterfall/as-is' },
      { label: 'to-be', href: '#/waterfall/to-be' },
    ],
  },
  {
    strategy: '번들 분할 (React.lazy + dynamic import)',
    pair: '/bundle-as-is.html ↔ /bundle-to-be.html',
    desc: 'marked + highlight.js를 전량 정적 import한 무거운 단일 번들 vs 뷰어를 클릭 시점에 로드하는 분할 번들. 별도 HTML 엔트리라 링크를 누르면 전체 리로드된다 — 초기 JS 총량 차이를 그대로 체감할 수 있다.',
    links: [
      { label: 'as-is', href: './bundle-as-is.html', external: true },
      { label: 'to-be', href: './bundle-to-be.html', external: true },
    ],
  },
]

export default function Home() {
  return (
    <div>
      <div className="hero">
        <h1>react-lab — 순수 React(CSR) 렌더링 전략 데모</h1>
        <p>
          프레임워크(서버) 없이 순수 React만으로도 통제할 수 있는 렌더링 지점은 많다. 이 랩은 그중{' '}
          <b>컴포넌트/번들 레벨</b> 전략을 as-is(문제 재현) ↔ to-be(개선) 쌍으로 비교한다. 모든 데모는 같은
          목데이터·같은 화면 구성을 쓰고 전략만 다르므로, 우하단 PerfHUD의 숫자 차이가 곧 전략의 효과다.
        </p>
        <div className="strategies">
          <span>번들 분할</span>
          <span>동시성 렌더링</span>
          <span>리렌더 제어</span>
          <span>가상화</span>
          <span>요청 병렬화</span>
        </div>
      </div>

      <div className="note-box">
        <b>CSR에서 HUD 읽는 법</b> — 이 앱은 순수 CSR이라 서버가 HTML을 미리 그려주지 않는다. 따라서 HUD의{' '}
        <code>hydrated</code> 단계는 SSR의 수화(hydration)가 아니라 <b>"첫 mount 완료"</b>로 읽어야 한다. 또{' '}
        <code>fcp</code> 이전까지 화면은 빈 셸이다(뭔가 뜨려면 JS 다운로드+평가+렌더가 모두 끝나야 한다). 네트워크
        프리셋(?apiDelay=)은 <b>API 응답만</b> 지연시킨다 — 해시 라우팅이라 URL이{' '}
        <code>/?apiDelay=800#/데모경로</code> 순서가 되는 것이 정상이다.
      </div>

      <h2>데모 카탈로그</h2>
      <table className="catalog">
        <thead>
          <tr>
            <th style={{ width: '26%' }}>전략</th>
            <th style={{ width: '24%' }}>쌍 (as-is ↔ to-be)</th>
            <th>무엇을 보는가</th>
            <th style={{ width: '12%' }}>열기</th>
          </tr>
        </thead>
        <tbody>
          {CATALOG.map((row) => (
            <tr key={row.strategy}>
              <td>
                <b>{row.strategy}</b>
              </td>
              <td>
                <code style={{ fontSize: 12 }}>{row.pair}</code>
              </td>
              <td>{row.desc}</td>
              <td className="pair-links">
                {row.links.map((l) =>
                  l.external ? (
                    <a key={l.label} href={l.href}>
                      {l.label}
                    </a>
                  ) : (
                    <Link key={l.label} to={l.href.slice(1)}>
                      {l.label}
                    </Link>
                  ),
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="hint" style={{ marginTop: 16 }}>
        비교 방법: 같은 쌍의 as-is → to-be를 차례로 열고, HUD의 <code>worst-interaction</code>·
        <code>long-tasks</code>·커스텀 단계(<code>filter-applied</code>, <code>fetch-N-done</code>,{' '}
        <code>editor-ready</code> 등)를 나란히 본다. "재측정" 버튼은 새로고침이며, 네트워크 프리셋 버튼은{' '}
        <code>?apiDelay=</code>를 바꿔 다시 측정한다.
      </p>
    </div>
  )
}
