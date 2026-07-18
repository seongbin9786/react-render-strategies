// to-be 상세: staleTime 60초 — 호버 프리로드가 이 loader를 미리 실행해 두면
// 클릭 시점엔 fresh 캐시가 있어 즉시 전환된다.
// 데이터는 createServerFn()으로 감싼 서버 함수(RPC)로 가져온다 — ../-detail-server-fn.ts 참고.
import { createFileRoute } from '@tanstack/react-router'
import { DemoLayout } from '../../../components/DemoLayout'
import { DetailPending, SpaceDetail } from '../../../components/CachePreload'
import { apiDelayDeps, validateApiDelaySearch } from '../../../lib/search'
import { fetchSpaceDetail } from '../-detail-server-fn'

export const Route = createFileRoute('/cache-preload/to-be/$id')({
  validateSearch: validateApiDelaySearch,
  loaderDeps: ({ search }) => apiDelayDeps(search),
  loader: async ({ params, deps }) => ({
    space: await fetchSpaceDetail({ data: { id: Number(params.id), apiDelay: deps.apiDelay } }),
  }),
  staleTime: 60_000,
  pendingComponent: DetailPending,
  component: Page,
})

function Page() {
  const { space } = Route.useLoaderData()
  const { id } = Route.useParams()
  return (
    <DemoLayout
      title={`상세 #${id} — staleTime 60s + preload=intent`}
      strategy="라우터 캐시 + 인텐트 프리로드"
      kind="to-be"
      pairHref={`/cache-preload/as-is/${id}`}
      description="as-is와 같은 500ms+apiDelay loader지만, 목록에서 호버하는 순간 이미 실행이 시작됐습니다. staleTime 60초 동안은 같은 상세로 다시 들어와도 loader를 건너뜁니다. '느린 API를 그대로 두고도' 체감 전환 비용을 0에 수렴시키는 라우터 캐시의 효과를 확인하세요."
      observe={[
        '호버 후 클릭했다면 spa-nav 간격이 수 ms (프리로드 덕분)',
        '같은 상세 재방문(60초 내)은 loader 스킵 — spa-nav 즉시',
        'as-is 상세와 detail-rendered 도달 시간을 비교',
      ]}
      wikiRef="09-selective-ssr-and-router-caching.md"
    >
      <SpaceDetail space={space} backSide="to-be" />
    </DemoLayout>
  )
}
