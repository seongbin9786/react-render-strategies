// to-be 목록: staleTime 60초 + Link preload="intent".
// 호버 순간 상세 loader가 미리 실행되고, 한 번 본 데이터는 60초간 신선(fresh) 취급 →
// 클릭 즉시 전환, 뒤로가기 즉시.
import { createFileRoute } from '@tanstack/react-router'
import { getSpaces } from '@renderlab/mock-data'
import { DemoLayout } from '../../../components/DemoLayout'
import { ListPending, SpaceLinkGrid } from '../../../components/CachePreload'
import { apiDelayDeps, validateApiDelaySearch } from '../../../lib/search'

export const Route = createFileRoute('/cache-preload/to-be/')({
  validateSearch: validateApiDelaySearch,
  loaderDeps: ({ search }) => apiDelayDeps(search),
  loader: async ({ deps }) => ({
    spaces: await getSpaces({ delay: 300 + deps.apiDelay, count: 20 }),
  }),
  // 60초 동안은 fresh — 다시 방문해도 loader를 건너뛰고 즉시 렌더.
  staleTime: 60_000,
  pendingComponent: ListPending,
  component: Page,
})

function Page() {
  const { spaces } = Route.useLoaderData()
  return (
    <DemoLayout
      title="목록 → 상세 — staleTime 60s + preload=intent"
      strategy="라우터 캐시 + 인텐트 프리로드"
      kind="to-be"
      pairHref="/cache-preload/as-is"
      description="as-is와 완전히 동일한 화면·동일한 loader 지연이지만, 라우트에 staleTime 60초를 주고 카드 Link에 preload='intent'를 켰습니다. 사용자가 카드에 마우스를 올리는(의도를 보이는) 순간 상세 loader가 미리 실행되므로, 클릭 시점엔 이미 데이터가 캐시에 있습니다. 한 번 본 목록/상세는 60초간 loader 없이 즉시 렌더됩니다."
      observe={[
        'spa-nav:start → spa-nav:done 간격이 수 ms — 클릭 시점엔 데이터가 이미 있음',
        '뒤로가기(목록 복귀) 즉시 — staleTime 안이라 loader 스킵',
        '호버만 하고 클릭하지 않아도 프리로드는 이미 발생(네트워크 탭에서 확인 가능)',
        'as-is와 같은 동선에서 spa-nav 소요 시간 차이를 비교',
      ]}
      wikiRef="09-selective-ssr-and-router-caching.md"
    >
      <div className="experiment">
        <b>실험해보기</b>
        <ol>
          <li>
            카드에 <b>마우스를 올리고 0.5초 뒤 클릭</b> → 전환이 즉시 (호버 순간 프리로드 완료)
          </li>
          <li>
            다른 카드를 <b>호버 없이 바로 클릭</b>(키보드나 빠른 클릭) → 500ms+apiDelay 대기가 그대로 보임
          </li>
          <li>상세에서 뒤로가기 → 목록이 즉시 (60초 캐시). 60초 뒤 다시 오가면 loader 재실행</li>
        </ol>
      </div>
      <SpaceLinkGrid spaces={spaces} side="to-be" preload="intent" />
    </DemoLayout>
  )
}
