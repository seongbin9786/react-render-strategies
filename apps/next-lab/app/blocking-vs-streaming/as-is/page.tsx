// AS-IS: Blocking SSR — 세 섹션의 데이터를 Promise.all로 "전부" 기다린 뒤
// 한 번에 렌더한다. 첫 바이트(TTFB)가 가장 느린 섹션(base+900ms)에 묶인다.

import { StreamMark } from '@renderlab/perf'
import { parseDelay } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SpaceCard } from '../../components/SpaceCard'
import { SECTION_META, getRecommended, getGangnam, getTopRated } from '../../lib/sections'

export default async function BlockingAsIsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const base = parseDelay(sp.apiDelay)

  // 세 데이터 소스를 병렬로 부르지만, 응답은 "전부 도착할 때까지" 어떤 HTML도 못 나간다.
  const [recommended, gangnam, topRated] = await Promise.all([
    getRecommended(base),
    getGangnam(base),
    getTopRated(base),
  ])
  const sections = [recommended, gangnam, topRated]

  return (
    <DemoLayout
      title="홈 대시보드 — 세 섹션을 전부 기다렸다가 렌더"
      strategy="Blocking SSR — Promise.all 후 일괄 렌더"
      kind="as-is"
      pairHref="/blocking-vs-streaming/to-be"
      mirrorHref="http://localhost:3001/blocking-vs-deferred/as-is"
      description="홈 화면은 응답 속도가 서로 다른 세 백엔드(추천 +200ms, 강남 +500ms, 평점순 +900ms)를 조합한다. 전부 await한 뒤 렌더하면 구현은 단순하지만, 사용자는 가장 느린 데이터가 올 때까지 흰 화면을 본다. TTFB 자체가 base+900ms 밑으로 내려갈 수 없다."
      observe={[
        'ttfb ≈ apiDelay + 900ms — 가장 느린 섹션이 첫 바이트를 인질로 잡는다',
        'stream:section-1/2/3이 사실상 같은 시각에 몰려 찍힌다 (한 덩어리로 도착)',
        'fcp/lcp도 통째로 뒤로 밀린다 — 스냅샷에 중간 단계(부분 콘텐츠)가 없다',
        'to-be와 같은 apiDelay로 놓고 ttfb·fcp·stream:section-N 분포를 비교',
      ]}
      wikiRef="05-streaming-ssr.md"
    >
      {SECTION_META.map((meta, i) => (
        <section className="section" key={meta.mark}>
          <h2>{meta.title}</h2>
          <p className="section-sub">{meta.sub}</p>
          <div className="card-grid">
            {sections[i].map((s) => (
              <SpaceCard key={s.id} space={s} />
            ))}
          </div>
          {/* 쌍 비교용 — to-be와 같은 이름. blocking에서는 세 마크가 한꺼번에 도착한다. */}
          <StreamMark name={meta.mark} />
        </section>
      ))}
    </DemoLayout>
  )
}
