// to-be: loader가 세 Promise를 await 없이 그대로 반환(deferred).
// 셸+스켈레톤이 즉시 스트리밍되고, 섹션은 준비되는 순서대로 흘러들어온다.
// curl로 받아보면 __rlStreamMark 인라인 스크립트가 섹션마다 뒤따라 붙는다.
import { Suspense } from 'react'
import { Await, createFileRoute } from '@tanstack/react-router'
import { getSpaces } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SECTIONS, Section, SectionSkeleton } from '../../components/StreamSections'
import { apiDelayDeps, validateApiDelaySearch } from '../../lib/search'

export const Route = createFileRoute('/blocking-vs-deferred/to-be')({
  validateSearch: validateApiDelaySearch,
  loaderDeps: ({ search }) => apiDelayDeps(search),
  loader: ({ deps }) => {
    // await 하지 않는다! Promise가 loaderData로 직렬화되어 스트리밍된다 (deferred).
    const [p1, p2, p3] = SECTIONS.map((s) =>
      getSpaces({ delay: deps.apiDelay + s.extra, count: 12, region: s.region }),
    )
    return { p1, p2, p3 }
  },
  component: Page,
})

function Page() {
  const { p1, p2, p3 } = Route.useLoaderData()
  const promises = [p1, p2, p3]
  return (
    <DemoLayout
      title="세 섹션 홈 — deferred loader + Await 스트리밍"
      strategy="deferred 스트리밍 SSR"
      kind="to-be"
      pairHref="/blocking-vs-deferred/as-is"
      mirrorHref="http://localhost:3000/blocking-vs-streaming/to-be"
      description="loader가 Promise를 await 없이 반환하면 Start가 응답을 즉시 시작하고, 각 Promise가 완료될 때마다 해당 Suspense 경계의 HTML을 이어서 스트리밍합니다. 사용자는 셸과 스켈레톤을 먼저 보고, 빠른 섹션(+200ms)부터 순서대로 채워지는 것을 봅니다. as-is와 데이터·화면 구성은 완전히 동일하고 '언제 보내느냐'만 다릅니다."
      observe={[
        'ttfb·fcp가 apiDelay와 무관하게 즉시 — 셸은 데이터를 기다리지 않는다',
        'stream:section-1 → 2 → 3이 +200/+500/+900ms 간격으로 계단식으로 찍힘',
        '단계별 스냅샷(📷)에서 섹션이 하나씩 채워지는 과정 확인',
        'as-is와 비교: 완성 시점(section-3)은 비슷하지만 "보이기 시작"이 압도적으로 빠름',
      ]}
      wikiRef="05-streaming-ssr.md"
    >
      {SECTIONS.map((meta, i) => (
        <Suspense key={meta.index} fallback={<SectionSkeleton meta={meta} />}>
          <Await promise={promises[i]}>{(spaces) => <Section meta={meta} spaces={spaces} />}</Await>
        </Suspense>
      ))}
    </DemoLayout>
  )
}
