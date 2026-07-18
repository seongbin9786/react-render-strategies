// TO-BE 상세: 동적 렌더링 + loading.tsx(프리페치된 로딩 셸) + staleTimes.dynamic 60.
// 데이터 지연(500ms+apiDelay)은 as-is와 완전히 동일 — 달라진 건 전환 경험뿐이다.
import { StageMark } from '@renderlab/perf'
import { getSpaceById, parseDelay } from '@renderlab/mock-data'
import { DemoLayout } from '../../../components/DemoLayout'
import { SpaceDetailPanel } from '../../../components/SpaceDetailPanel'
import { BackToListLink, NavDoneMark } from '../../../components/PrefetchCache'

// 요청 단위 동적 렌더 강제 — 기본 prefetch는 이 라우트를 loading.tsx 셸까지만 미리 받아 둔다.
export const dynamic = 'force-dynamic'

export default async function PrefetchToBeDetailPage({
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
      title={`상세 #${id} — prefetch + loading.tsx + staleTimes`}
      strategy="뷰포트 프리페치 + 프리페치된 로딩 셸 + Router Cache 재사용"
      kind="to-be"
      pairHref={`/prefetch-cache/as-is/${id}`}
      mirrorHref={`http://localhost:3001/cache-preload/to-be/${id}`}
      description="as-is와 같은 500ms+apiDelay 데이터지만, 목록의 뷰포트 프리페치가 이 세그먼트의 loading.tsx 셸을 미리 받아 두어 클릭 즉시 로딩 셸이 떴습니다. staleTimes.dynamic 60초 동안은 이 상세의 RSC 페이로드가 Router Cache에 남아, 재방문·뒤로가기 시 서버 왕복 없이 즉시 렌더됩니다."
      observe={[
        '첫 방문: spa-nav:start → loading-shell(즉시) → spa-nav:done(500ms+apiDelay 후) 순서를 타임라인에서 확인',
        '60초 내 재방문: loading-shell 없이 spa-nav:done까지 수 ms — Router Cache 재사용',
        '← 목록으로 복귀도 60초 내에는 즉시. as-is 상세와 spa-nav:done의 소요 ms를 쌍으로 비교',
      ]}
      wikiRef="09-selective-ssr-and-router-caching.md"
    >
      <section className="section">
        <SpaceDetailPanel space={space} />
        <BackToListLink side="to-be" apiDelay={delay} />
      </section>
      <NavDoneMark label={`to-be 상세 #${id}`} />
      <StageMark name="content-rendered" detail={`${space?.name ?? `#${id}`} 상세 커밋 완료`} />
    </DemoLayout>
  )
}
