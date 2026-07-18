// as-is: loader가 세 데이터셋을 전부 await → SSR 전체가 가장 느린 데이터에 블록.
// 첫 바이트(ttfb)조차 base+900ms 이후에나 나간다.
import { createFileRoute } from '@tanstack/react-router'
import { getSpaces } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SECTIONS, Section } from '../../components/StreamSections'
import { apiDelayDeps, validateApiDelaySearch } from '../../lib/search'

export const Route = createFileRoute('/blocking-vs-deferred/as-is')({
  validateSearch: validateApiDelaySearch,
  loaderDeps: ({ search }) => apiDelayDeps(search),
  loader: async ({ deps }) => {
    // 세 요청을 병렬로 던지긴 하지만, 전부 끝날 때까지 응답 자체를 시작하지 못한다.
    const [s1, s2, s3] = await Promise.all(
      SECTIONS.map((s) => getSpaces({ delay: deps.apiDelay + s.extra, count: 12, region: s.region })),
    )
    return { s1, s2, s3 }
  },
  component: Page,
})

function Page() {
  const { s1, s2, s3 } = Route.useLoaderData()
  const data = [s1, s2, s3]
  return (
    <DemoLayout
      title="세 섹션 홈 — 블로킹 SSR (전부 await)"
      strategy="블로킹 loader SSR"
      kind="as-is"
      pairHref="/blocking-vs-deferred/to-be"
      mirrorHref="http://localhost:3000/blocking-vs-streaming/as-is"
      description="느린 데이터셋 세 개(+200/+500/+900ms)를 loader에서 전부 await하는 흔한 구현입니다. 가장 빠른 섹션도 가장 느린 섹션(+900ms)을 기다려야 하고, 그동안 서버는 첫 바이트조차 보내지 못해 사용자는 백지를 봅니다. 화면은 '한 번에 완성'되지만 그 시점이 통째로 늦습니다."
      observe={[
        'ttfb가 apiDelay+900ms 뒤로 밀림 — 그 전까지 브라우저는 완전 백지',
        'stream:section-1/2/3이 거의 같은 시각에 몰려 찍힘 (한 덩어리 HTML)',
        'fcp도 ttfb 이후 — 스켈레톤조차 못 보여준다',
        'to-be(deferred)와 단계 이름이 같으니 HUD 타임라인을 나란히 비교',
      ]}
      wikiRef="05-streaming-ssr.md"
    >
      {SECTIONS.map((meta, i) => (
        <Section key={meta.index} meta={meta} spaces={data[i]} />
      ))}
    </DemoLayout>
  )
}
