// ssr: 'data-only' — loader는 서버에서 실행하되, 컴포넌트 마크업은 서버에서 렌더하지 않는다.
// 데이터는 dehydration 페이로드(스크립트)로 실려 오고, 화면은 클라이언트가 그린다.
import { createFileRoute } from '@tanstack/react-router'
import { getSpaces } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { ModeNav, SelectiveContent, SelectivePending } from '../../components/SelectiveSsr'
import { apiDelayDeps, validateApiDelaySearch } from '../../lib/search'

export const Route = createFileRoute('/selective-ssr/data-only')({
  ssr: 'data-only',
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
      title="Selective SSR — ssr: 'data-only'"
      strategy="라우트 단위 SSR 제어 (Start 고유)"
      kind="variant"
      pairHref="/selective-ssr/spa"
      pairLabel="다음 모드: spa →"
      description="ssr: 'data-only'는 loader만 서버에서 실행하고 컴포넌트는 서버에서 렌더하지 않습니다. 실측 확인: 첫 HTML의 본문에는 카드 마크업이 없지만, loader 결과가 dehydration 스크립트 페이로드에 실려 오므로 클라이언트는 API 재왕복 없이 hydration 직후 바로 그립니다. '데이터 왕복은 아끼고 싶지만 서버 렌더 비용(큰 마크업, 브라우저 전용 라이브러리)은 피하고 싶은' 라우트에 유리합니다."
      observe={[
        'ttfb는 여전히 400ms+apiDelay 뒤 — loader가 서버에서 돌기 때문 (full과 동일)',
        'fcp 시점 화면은 스켈레톤/셸 — 본문 마크업이 HTML에 없음',
        'content-rendered가 hydrated 직후 — 추가 API 왕복 없이 페이로드의 데이터로 즉시 렌더',
        'as-is CSR(loader-vs-client/as-is)과 달리 data-requested/data-received 단계 자체가 없음',
      ]}
      wikiRef="09-selective-ssr-and-router-caching.md"
    >
      <ModeNav current="/selective-ssr/data-only" />
      <SelectiveContent spaces={spaces} mode="data-only" />
    </DemoLayout>
  )
}
