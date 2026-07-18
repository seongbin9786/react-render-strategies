// as-is 상세: 캐시 없음 — 같은 상세를 다시 열어도 500ms+apiDelay를 매번 기다린다.
// 데이터는 createServerFn()으로 감싼 서버 함수(RPC)로 가져온다 — ../-detail-server-fn.ts 참고.
import { createFileRoute } from '@tanstack/react-router'
import { DemoLayout } from '../../../components/DemoLayout'
import { DetailPending, SpaceDetail } from '../../../components/CachePreload'
import { apiDelayDeps, validateApiDelaySearch } from '../../../lib/search'
import { fetchSpaceDetail } from '../-detail-server-fn'

export const Route = createFileRoute('/cache-preload/as-is/$id')({
  validateSearch: validateApiDelaySearch,
  loaderDeps: ({ search }) => apiDelayDeps(search),
  loader: async ({ params, deps }) => ({
    space: await fetchSpaceDetail({ data: { id: Number(params.id), apiDelay: deps.apiDelay } }),
  }),
  staleTime: 0,
  gcTime: 0,
  pendingComponent: DetailPending,
  component: Page,
})

function Page() {
  const { space } = Route.useLoaderData()
  const { id } = Route.useParams()
  return (
    <DemoLayout
      title={`상세 #${id} — 캐시·프리로드 없음`}
      strategy="라우터 캐시 미사용"
      kind="as-is"
      pairHref={`/cache-preload/to-be/${id}`}
      description="상세 loader(500ms+apiDelay)를 클릭 후에야 실행합니다. 캐시가 없으므로 방금 봤던 상세로 다시 들어와도 똑같이 기다립니다. HUD의 spa-nav:done에 찍히는 소요 ms가 곧 사용자가 느낀 전환 지연입니다."
      observe={[
        'spa-nav:start → spa-nav:done 간격 ≈ 500ms+apiDelay',
        '목록으로 돌아가면(아래 버튼) 목록 loader도 다시 300ms+apiDelay',
        'detail-rendered 단계가 전환마다 매번 새로 찍힘',
      ]}
      wikiRef="09-selective-ssr-and-router-caching.md"
    >
      <SpaceDetail space={space} backSide="as-is" />
    </DemoLayout>
  )
}
