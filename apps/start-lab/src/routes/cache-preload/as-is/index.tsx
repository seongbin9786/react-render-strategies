// as-is 목록: 라우터 캐시를 전혀 쓰지 않는 구성.
// staleTime 0(기본) + gcTime 0(캐시 즉시 폐기) + preload 없음 →
// 목록↔상세를 오갈 때마다 loader가 매번 재실행되어 모든 전환이 느리다.
import { createFileRoute } from '@tanstack/react-router'
import { getSpaces } from '@renderlab/mock-data'
import { DemoLayout } from '../../../components/DemoLayout'
import { ListPending, SpaceLinkGrid } from '../../../components/CachePreload'
import { apiDelayDeps, validateApiDelaySearch } from '../../../lib/search'

export const Route = createFileRoute('/cache-preload/as-is/')({
  validateSearch: validateApiDelaySearch,
  loaderDeps: ({ search }) => apiDelayDeps(search),
  loader: async ({ deps }) => ({
    spaces: await getSpaces({ delay: 300 + deps.apiDelay, count: 20 }),
  }),
  // 캐시 없음: 데이터를 항상 stale 취급(staleTime 0)하고 떠나는 즉시 버린다(gcTime 0).
  staleTime: 0,
  gcTime: 0,
  pendingComponent: ListPending,
  component: Page,
})

function Page() {
  const { spaces } = Route.useLoaderData()
  return (
    <DemoLayout
      title="목록 → 상세 — 캐시·프리로드 없음"
      strategy="라우터 캐시 미사용"
      kind="as-is"
      pairHref="/cache-preload/to-be"
      description="라우터 캐시를 끈 구성입니다(staleTime 0 + gcTime 0 — 기본 gcTime(이 버전 1.131.x 런타임 기본 5분, 공식 문서 표기는 30분)이 남아 있으면 stale 데이터라도 화면에 먼저 보여주기 때문에, '매번 기다리는' 전형적 경험을 재현하려고 캐시를 완전히 껐습니다). 카드를 클릭하면 상세 loader(500ms+apiDelay)를 통째로 기다리고, 목록으로 돌아와도 목록 loader(300ms+apiDelay)를 다시 기다립니다."
      observe={[
        '카드 클릭 → spa-nav:start와 spa-nav:done 사이가 500ms+apiDelay',
        '뒤로가기(목록 복귀)도 300ms+apiDelay — 이미 봤던 화면인데 또 기다림',
        '전환마다 스켈레톤(pendingComponent)이 다시 보임',
        'to-be에서 같은 동선을 반복해 spa-nav 소요 시간을 비교',
      ]}
      wikiRef="09-selective-ssr-and-router-caching.md"
    >
      <SpaceLinkGrid spaces={spaces} side="as-is" preload={false} />
    </DemoLayout>
  )
}
