import Link from 'next/link'

// 렌더링 모드 트리오 소개 — 같은 화면을 SSR/SSG/ISR로 각각 제공한다.
// Next의 핵심 철학: "라우트 단위로" 렌더링 모드를 고른다.

export default function RenderingModesIndex() {
  return (
    <main className="demo">
      <section className="demo-info">
        <div>
          <span className="badge badge-variant">TRIO</span>{' '}
          <span className="strategy">라우트 단위 렌더링 모드 — SSR · SSG · ISR</span>
        </div>
        <h1>렌더링 모드 트리오</h1>
        <p className="demo-desc">
          완전히 같은 카드 목록 화면을 세 가지 모드로 제공한다. 각 페이지 상단의 <b>타임스탬프가 언제 찍히는지</b>가
          모드의 본질이다: SSR은 요청 시각, SSG는 빌드 시각, ISR은 (최근) 재생성 시각. HUD의 ttfb를 함께 비교해 보자.
        </p>
      </section>

      <div className="mode-grid">
        <div className="mode-card">
          <h3>SSR — 매 요청 렌더</h3>
          <p>
            <code>force-dynamic</code>. 요청이 올 때마다 서버가 데이터를 가져와 새 HTML을 만든다. 새로고침마다 시각이
            바뀐다.
          </p>
          <p className="when">
            언제 쓰나: 사용자별/실시간 데이터(대시보드, 장바구니, 검색 결과). 항상 최신이지만 매 요청이 서버 비용과
            TTFB를 지불한다.
          </p>
          <Link href="/rendering-modes/ssr">/rendering-modes/ssr →</Link>
        </div>
        <div className="mode-card">
          <h3>SSG — 빌드 시 1회 생성</h3>
          <p>
            빌드 시점에 HTML을 만들어 두고 요청 시에는 그대로 서빙한다. 페이지의 시각은 빌드 시점에 영원히 고정.
          </p>
          <p className="when">
            언제 쓰나: 내용이 바뀌지 않는 페이지(문서, 마케팅, 블로그 본문). 서버 작업이 없어 TTFB가 가장 빠르고 CDN
            캐시에 최적.
          </p>
          <Link href="/rendering-modes/ssg">/rendering-modes/ssg →</Link>
        </div>
        <div className="mode-card">
          <h3>ISR — 정적 + 주기 재생성</h3>
          <p>
            <code>revalidate = 10</code>. 정적 캐시를 서빙하다가 10초가 지난 뒤 첫 요청에는 <b>이전 캐시</b>를 주고
            백그라운드에서 다시 만든다(stale-while-revalidate).
          </p>
          <p className="when">
            언제 쓰나: 자주는 아니지만 갱신되는 목록(상품, 랭킹, 뉴스 헤드라인). 정적의 속도 + 주기적 최신성.
          </p>
          <Link href="/rendering-modes/isr">/rendering-modes/isr →</Link>
        </div>
      </div>

      <div className="note">
        <h3>비교 실험 순서</h3>
        <ol>
          <li>세 페이지를 차례로 열고 타임스탬프와 HUD의 ttfb를 기록한다.</li>
          <li>각 페이지를 여러 번 새로고침한다 — SSR만 시각이 매번 바뀐다.</li>
          <li>ISR에서 10초 기다렸다가 두 번 새로고침한다 — 첫 번째는 이전 시각(stale), 두 번째는 새 시각.</li>
        </ol>
      </div>
    </main>
  )
}
