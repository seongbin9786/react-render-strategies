// SSG — 정적 생성: 빌드 시점에 HTML을 1회 만들어 두고 요청 시에는 그대로 서빙.
// 아래 "빌드 시점" 타임스탬프는 next build가 이 페이지를 프리렌더한 순간에 고정된다.

import { StageMark } from '@renderlab/perf'
import { getSpaces } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SpaceCard } from '../../components/SpaceCard'

// 명시적 정적 렌더 (searchParams/헤더 등 동적 API를 쓰지 않으므로 기본값도 static이지만 의도를 드러낸다)
export const dynamic = 'force-static'

export default async function SsgModePage() {
  // 이 코드는 next build 중에 실행된다 — 여기서의 "지금"이 곧 빌드 시점.
  const spaces = await getSpaces({ count: 12 })
  const builtAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })

  return (
    <DemoLayout
      title="렌더링 모드 — SSG (빌드 시점 정적 생성)"
      strategy="SSG — 빌드 타임 프리렌더 (기본 static + force-static)"
      kind="variant"
      pairHref="/rendering-modes/isr"
      description="이 페이지의 HTML은 next build 중 단 한 번 생성됐다. 요청 시 서버는 파일을 그대로 돌려줄 뿐 데이터도 렌더도 하지 않는다. 그래서 트리오 중 TTFB가 가장 빠르고, 내용은 다시 배포하기 전까지 절대 변하지 않는다."
      observe={[
        '몇 번을 새로고침해도 아래 빌드 시점이 변하지 않는다',
        'ttfb가 SSR(300ms+)보다 확연히 짧다 — 요청 시 서버 작업이 없다',
        '?apiDelay=는 이 페이지에 효과가 없다 — 데이터가 빌드 타임에 이미 소비됐기 때문 (HUD 버튼을 눌러 확인해 보자)',
      ]}
      wikiRef="04-ssg-isr.md"
    >
      <div className="stamp">
        <b>빌드 시점:</b> {builtAt} (KST) — 새로고침해도 바뀌지 않습니다
      </div>
      <div className="note">
        <h3>apiDelay가 적용되지 않는 이유</h3>
        데이터 호출(getSpaces)은 <b>빌드 타임</b>에 실행이 끝났다. 런타임 요청에는 데이터 코드가 아예 실행되지 않으므로
        ?apiDelay= 쿼리를 읽을 곳이 없다. 정적 페이지의 장점(지연 0)과 제약(요청별 데이터 불가)이 동전의 양면임을
        보여준다.
      </div>
      <section className="section">
        <h2>목록 12건 (빌드 타임 데이터)</h2>
        <p className="section-sub">seed 고정 mock이므로 SSR/ISR 페이지와 동일한 12건이다 — 다른 것은 생성 시점뿐.</p>
        <div className="card-grid">
          {spaces.map((s) => (
            <SpaceCard key={s.id} space={s} />
          ))}
        </div>
        <StageMark name="content-rendered" detail="정적 콘텐츠 hydrate 완료" />
      </section>
    </DemoLayout>
  )
}
