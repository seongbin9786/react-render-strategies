// ISR — Incremental Static Regeneration: 정적 캐시를 서빙하되,
// revalidate(10초)가 지난 뒤 첫 요청은 "이전 캐시"를 받고 백그라운드에서 재생성된다.
// stale-while-revalidate — 사용자는 절대 렌더를 기다리지 않는다.

import { StageMark } from '@renderlab/perf'
import { getSpaces } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SpaceCard } from '../../components/SpaceCard'

// 10초마다 재검증 — 이 한 줄이 ISR의 전부다.
export const revalidate = 10

export default async function IsrModePage() {
  // 이 코드는 "재생성 시점"에만 실행된다 (매 요청이 아니라).
  const spaces = await getSpaces({ delay: 300, count: 12 })
  const generatedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })

  return (
    <DemoLayout
      title="렌더링 모드 — ISR (10초 재검증)"
      strategy="ISR — export const revalidate = 10"
      kind="variant"
      pairHref="/rendering-modes/ssr"
      description="정적 페이지처럼 캐시에서 즉시 서빙하지만, 생성 후 10초가 지난 뒤의 첫 요청은 이전 캐시를 받으면서 백그라운드 재생성을 트리거한다(stale-while-revalidate). 그 다음 요청부터 새 HTML을 받는다. 데이터 지연(300ms)을 사용자 아무도 기다리지 않는다는 점이 SSR과의 결정적 차이다."
      observe={[
        'ttfb가 SSG 수준으로 짧다 — 재생성은 백그라운드에서 일어나므로 요청 경로에 데이터 지연(300ms)이 없다',
        '10초 안에 새로고침하면 생성 시각이 그대로다 (캐시 히트)',
        '10초 지난 후 첫 새로고침도 이전 시각(stale 제공 + 백그라운드 재생성), 그 직후 한 번 더 새로고침하면 새 시각',
      ]}
      wikiRef="04-ssg-isr.md"
    >
      <div className="stamp">
        <b>생성 시각:</b> {generatedAt} (KST) — 이 HTML이 (재)생성된 순간
      </div>
      <div className="note">
        <h3>직접 실험 절차 (stale-while-revalidate 체감하기)</h3>
        <ol>
          <li>위 생성 시각을 기억한다.</li>
          <li>10초 안에 몇 번 새로고침 — 시각이 그대로다 (신선한 캐시).</li>
          <li>10초 지난 뒤 새로고침 — <b>여전히 이전 시각</b>이 보인다. 이 요청이 이전 캐시를 받으며 백그라운드
            재생성을 트리거했다.</li>
          <li>곧바로 한 번 더 새로고침 — 이제 새 시각이 보인다 (재생성 완료본).</li>
        </ol>
        즉, 어떤 요청도 300ms 데이터 지연을 기다리지 않는다. 최신성(최대 10초 + 재생성 시간 지연)과 속도를 맞바꾼
        전략이다.
      </div>
      <section className="section">
        <h2>목록 12건 (최근 재생성 시점 데이터)</h2>
        <p className="section-sub">?apiDelay=는 요청 경로에 영향을 주지 못한다 — 재생성은 쿼리와 무관하게 경로 단위로 일어난다.</p>
        <div className="card-grid">
          {spaces.map((s) => (
            <SpaceCard key={s.id} space={s} />
          ))}
        </div>
        <StageMark name="content-rendered" detail="ISR 캐시 콘텐츠 hydrate 완료" />
      </section>
    </DemoLayout>
  )
}
