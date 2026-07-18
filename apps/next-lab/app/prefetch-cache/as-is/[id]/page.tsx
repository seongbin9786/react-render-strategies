// AS-IS 상세: 동적 렌더링 + 프리페치 없음 + loading.tsx 없음.
// 목록에서 클릭한 "뒤에야" 이 페이지의 데이터(500ms+apiDelay)를 서버가 렌더하기 시작한다.
import { StageMark } from '@renderlab/perf'
import { getSpaceById, parseDelay } from '@renderlab/mock-data'
import { DemoLayout } from '../../../components/DemoLayout'
import { SpaceDetailPanel } from '../../../components/SpaceDetailPanel'
import { BackToListLink, NavDoneMark } from '../../../components/PrefetchCache'

// 요청 단위 동적 렌더 강제 — 상세는 매 요청 서버에서 새로 렌더된다.
export const dynamic = 'force-dynamic'

export default async function PrefetchAsIsDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const sp = await searchParams
  const delay = parseDelay(sp.apiDelay)
  const space = await getSpaceById(Number(id), { delay: 500 + delay })

  return (
    <DemoLayout
      title={`상세 #${id} — 프리페치 없음`}
      strategy="Link prefetch={false} + 상세 loading.tsx 없음"
      kind="as-is"
      pairHref={`/prefetch-cache/to-be/${id}`}
      mirrorHref={`http://localhost:3001/cache-preload/as-is/${id}`}
      description="이 상세의 데이터(500ms+apiDelay)는 목록에서 클릭한 뒤에야 서버에서 렌더되기 시작했습니다. 프리페치도, 프리페치된 로딩 셸(loading.tsx)도 없으므로 HUD의 spa-nav:done에 찍힌 소요 ms가 곧 '클릭하고 아무 반응 없이 기다린' 시간입니다. (staleTimes는 전역 설정이라 60초 내 같은 상세 재방문은 as-is에서도 캐시를 탈 수 있습니다.)"
      observe={[
        'spa-nav:start → spa-nav:done 간격 ≈ RTT + 500ms + apiDelay (처음 방문한 상세 기준)',
        '전환 중 로딩 셸 단계(loading-shell)가 없다 — to-be와 타임라인을 비교',
        '← 목록으로 클릭도 spa-nav로 계측된다. 60초 내에는 Router Cache(전역 staleTimes) 때문에 즉시일 수 있고, 60초 뒤에는 목록 300ms+apiDelay를 다시 기다린다',
      ]}
      wikiRef="09-selective-ssr-and-router-caching.md"
    >
      <section className="section">
        <SpaceDetailPanel space={space} />
        <BackToListLink side="as-is" apiDelay={delay} />
      </section>
      <NavDoneMark label={`as-is 상세 #${id}`} />
      <StageMark name="content-rendered" detail={`${space?.name ?? `#${id}`} 상세 커밋 완료`} />
    </DemoLayout>
  )
}
