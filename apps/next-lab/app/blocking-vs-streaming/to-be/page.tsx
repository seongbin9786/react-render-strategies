// TO-BE: Streaming SSR — 셸(헤더 + 스켈레톤 3개)을 즉시 흘려보내고,
// 각 섹션은 Suspense 경계 안에서 준비되는 대로 청크로 이어 보낸다.
// curl 응답에서 __rlStreamMark 인라인 스크립트가 섹션마다 뒤따라오는 것을 볼 수 있다.

import { Suspense } from 'react'
import { StreamMark } from '@renderlab/perf'
import { parseDelay, type StudySpace } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SpaceCard, SkeletonGrid } from '../../components/SpaceCard'
import { SECTION_META, getRecommended, getGangnam, getTopRated } from '../../lib/sections'

// 섹션별 async 서버 컴포넌트 — as-is와 완전히 같은 데이터 함수/지연을 쓴다.
async function Section({ load, mark }: { load: Promise<StudySpace[]>; mark: string }) {
  const spaces = await load
  return (
    <>
      <div className="card-grid">
        {spaces.map((s) => (
          <SpaceCard key={s.id} space={s} />
        ))}
      </div>
      {/* 이 청크가 브라우저 HTML 파서에 도달한 순간이 stream:section-N으로 찍힌다 */}
      <StreamMark name={mark} />
    </>
  )
}

export default async function StreamingToBePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const base = parseDelay(sp.apiDelay)
  const loaders = [getRecommended(base), getGangnam(base), getTopRated(base)]

  return (
    <DemoLayout
      title="홈 대시보드 — 셸 먼저, 섹션은 준비되는 대로 스트리밍"
      strategy="Streaming SSR — Suspense 경계 단위 청크 전송"
      kind="to-be"
      pairHref="/blocking-vs-streaming/as-is"
      mirrorHref="http://localhost:3001/blocking-vs-deferred/to-be"
      description="as-is와 같은 세 데이터 소스(+200/+500/+900ms)를 쓰지만, 각 섹션을 Suspense로 감싸 준비된 순서대로 HTML 청크를 스트리밍한다. 셸과 스켈레톤은 데이터와 무관하게 즉시 도착하므로 TTFB/FCP가 데이터 지연에서 풀려나고, 화면은 스켈레톤→섹션1→섹션2→섹션3 순으로 채워진다."
      observe={[
        'ttfb/fcp가 apiDelay와 거의 무관하게 빠르다 — 셸이 먼저 나가기 때문',
        'stream:section-1 → 2 → 3이 약 300~400ms 간격의 계단으로 찍힌다 (as-is에서는 한 점에 몰림)',
        '스냅샷 필름스트립에서 스켈레톤 → 부분 콘텐츠 → 완성의 시각 단계를 확인',
        '모든 마크는 hydration 이전, HTML 파서 도달 시점이다 (StreamMark 인라인 스크립트)',
      ]}
      wikiRef="05-streaming-ssr.md"
    >
      {SECTION_META.map((meta, i) => (
        <section className="section" key={meta.mark}>
          {/* 섹션 제목은 셸의 일부 — 즉시 렌더 */}
          <h2>{meta.title}</h2>
          <p className="section-sub">{meta.sub}</p>
          <Suspense fallback={<SkeletonGrid count={12} />}>
            <Section load={loaders[i]} mark={meta.mark} />
          </Suspense>
        </section>
      ))}
    </DemoLayout>
  )
}
