// ssr: true — loader와 컴포넌트 모두 서버에서 실행되는 완전한 SSR.
import { createFileRoute } from '@tanstack/react-router'
import { getSpaces } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { ModeNav, SelectiveContent, SelectivePending } from '../../components/SelectiveSsr'
import { apiDelayDeps, validateApiDelaySearch } from '../../lib/search'

export const Route = createFileRoute('/selective-ssr/full')({
  ssr: true,
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
      title="Selective SSR — ssr: true (full SSR)"
      strategy="라우트 단위 SSR 제어 (Start 고유)"
      kind="variant"
      pairHref="/selective-ssr/data-only"
      pairLabel="다음 모드: data-only →"
      description="TanStack Start는 라우트마다 ssr 옵션으로 서버가 할 일을 고를 수 있습니다(Selective SSR — Start 고유 기능). ssr: true는 loader 실행과 컴포넌트 렌더를 모두 서버에서 수행합니다. 첫 HTML에 콘텐츠가 포함되어 SEO·첫 화면에 유리하지만, loader(여기선 400ms+apiDelay)가 끝나야 응답이 시작되므로 TTFB가 그만큼 밀립니다. 콘텐츠가 중요한 공개 페이지에 적합합니다."
      observe={[
        'ttfb가 400ms+apiDelay 뒤 — 서버가 loader를 기다린 값',
        'fcp 시점에 이미 실제 카드 20장 (소스 보기에 목록 있음)',
        'content-rendered는 hydration 직후 — HTML로 이미 그려진 것을 커밋만 확인',
        'data-only/spa 모드와 ttfb·fcp·content-rendered 순서를 비교',
      ]}
      wikiRef="09-selective-ssr-and-router-caching.md"
    >
      <ModeNav current="/selective-ssr/full" />
      <SelectiveContent spaces={spaces} mode="full SSR" />
    </DemoLayout>
  )
}
