// ssr: false — 이 라우트는 서버에서 loader도 컴포넌트 렌더도 하지 않는다 (순수 SPA).
// 서버는 셸만 보내고, loader는 hydration 후 클라이언트에서 실행된다.
import { createFileRoute } from '@tanstack/react-router'
import { getSpaces } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { ModeNav, SelectiveContent, SelectivePending } from '../../components/SelectiveSsr'
import { apiDelayDeps, validateApiDelaySearch } from '../../lib/search'

export const Route = createFileRoute('/selective-ssr/spa')({
  ssr: false,
  validateSearch: validateApiDelaySearch,
  loaderDeps: ({ search }) => apiDelayDeps(search),
  loader: async ({ deps }) => ({
    spaces: await getSpaces({ delay: 400 + deps.apiDelay, count: 20 }),
  }),
  pendingComponent: SelectivePending,
  component: Page,
})

function Page() {
  const { spaces } = Route.useLoaderData()
  return (
    <DemoLayout
      title="Selective SSR — ssr: false (SPA)"
      strategy="라우트 단위 SSR 제어 (Start 고유)"
      kind="variant"
      pairHref="/selective-ssr/full"
      pairLabel="처음 모드: full →"
      description="ssr: false는 이 라우트를 완전한 클라이언트 렌더로 만듭니다. 서버는 데이터를 기다리지 않고 셸만 즉시 보내므로 TTFB는 셋 중 가장 빠르지만, loader(400ms+apiDelay)가 hydration 후에야 클라이언트에서 실행되어 콘텐츠는 가장 늦게 뜹니다. 소스 보기에는 목록이 없습니다. 로그인 뒤 대시보드처럼 SEO가 무의미하고 상호작용이 중요한 라우트에 적합합니다."
      observe={[
        'ttfb·fcp가 즉시 — 서버는 loader를 기다리지 않는다',
        'content-rendered는 hydrated + 400ms+apiDelay 뒤 — 셋 중 가장 늦음',
        'full과 정반대의 트레이드오프: TTFB ↔ 콘텐츠 표시 시점',
        'HUD 스냅샷: fcp 시점은 스켈레톤, content-rendered 시점에 카드',
      ]}
      wikiRef="09-selective-ssr-and-router-caching.md"
    >
      <ModeNav current="/selective-ssr/spa" />
      <SelectiveContent spaces={spaces} mode="SPA(ssr:false)" />
    </DemoLayout>
  )
}
