// SSR — force-dynamic: 매 요청마다 서버에서 데이터를 가져와 새로 렌더한다.
// 새로고침할 때마다 "요청 시각"이 바뀌는 것이 증거.

import { StreamMark, StageMark } from '@renderlab/perf'
import { getSpaces, parseDelay } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SpaceCard } from '../../components/SpaceCard'

export const dynamic = 'force-dynamic'

function fmt(d: Date): string {
  return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }) + ` (KST)`
}

export default async function SsrModePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  // 기본 백엔드 지연 300ms + HUD의 apiDelay를 더해 재측정할 수 있게 한다.
  const delay = 300 + parseDelay(sp.apiDelay)
  const spaces = await getSpaces({ delay, count: 12 })
  const requestedAt = new Date()

  return (
    <DemoLayout
      title="렌더링 모드 — SSR (매 요청 렌더)"
      strategy="SSR — export const dynamic = 'force-dynamic'"
      kind="variant"
      pairHref="/rendering-modes/ssg"
      description="이 라우트는 요청이 올 때마다 서버에서 데이터(지연 300ms + apiDelay)를 가져와 HTML을 새로 만든다. 항상 최신이지만, 모든 사용자가 매번 데이터 지연만큼 TTFB를 지불한다. 새로고침마다 아래 요청 시각이 바뀐다."
      observe={[
        '새로고침마다 요청 시각이 바뀐다 — 매 요청 서버 렌더의 증거',
        'ttfb ≈ 300ms + apiDelay — SSG/ISR과 비교하면 항상 데이터 지연만큼 느리다',
        'HUD 프리셋으로 apiDelay를 올리면 ttfb가 그대로 늘어난다',
      ]}
      wikiRef="04-ssg-isr.md"
    >
      <div className="stamp">
        <b>요청 시각:</b> {fmt(requestedAt)} — 새로고침하면 매번 바뀝니다
      </div>
      <section className="section">
        <h2>목록 12건 (요청 시점 데이터)</h2>
        <p className="section-sub">데이터 지연: 300ms + apiDelay</p>
        <div className="card-grid">
          {spaces.map((s) => (
            <SpaceCard key={s.id} space={s} />
          ))}
        </div>
        <StreamMark name="content" />
        <StageMark name="content-rendered" detail="SSR 콘텐츠 hydrate 완료" />
      </section>
    </DemoLayout>
  )
}
