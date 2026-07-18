// to-be: 라우트 loader에서 서버가 데이터를 await — isomorphic loader SSR.
// 첫 HTML에 목록이 포함되고("호점" 있음), SPA 전환 시엔 같은 loader가 클라이언트에서 실행된다.
import { createFileRoute } from '@tanstack/react-router'
import { StageMark, StreamMark } from '@renderlab/perf'
import { getSpaces } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SpaceCard } from '../../components/SpaceCard'
import { apiDelayDeps, validateApiDelaySearch } from '../../lib/search'

export const Route = createFileRoute('/loader-vs-client/to-be')({
  validateSearch: validateApiDelaySearch,
  loaderDeps: ({ search }) => apiDelayDeps(search),
  loader: async ({ deps }) => ({
    spaces: await getSpaces({ delay: deps.apiDelay, count: 40 }),
  }),
  component: Page,
})

function Page() {
  const { spaces } = Route.useLoaderData()
  return (
    <DemoLayout
      title="스터디스페이스 목록 — 라우트 loader SSR"
      strategy="isomorphic 라우트 loader"
      kind="to-be"
      pairHref="/loader-vs-client/as-is"
      mirrorHref="http://localhost:3000/csr-vs-ssr/to-be"
      description="TanStack Start의 라우트 loader는 첫 요청에선 서버에서 실행되어 데이터가 포함된 HTML을 내려보내고, SPA 전환에선 같은 코드가 클라이언트에서 실행됩니다(isomorphic). as-is와 달리 'JS 로드 후 API 왕복' 없이 첫 응답에 콘텐츠가 실려 오므로, fcp≈콘텐츠 표시 시점이 됩니다. 소스 보기를 하면 40개 목록이 HTML에 그대로 보입니다."
      observe={[
        'stream:content — HTML 파서가 콘텐츠에 도달한 시점(hydration 이전!)에 이미 목록 존재',
        'content-rendered(hydration 후 커밋)와 as-is의 content-rendered를 비교 — 격차가 API 왕복만큼 벌어짐',
        'apiDelay를 키우면 서버 렌더가 그만큼 늦어져 ttfb가 밀리는 것(트레이드오프)도 확인',
        'as-is와 동일한 데이터·동일한 카드 그리드 — 전략만 다르다',
      ]}
      wikiRef="03-ssr.md"
    >
      <div className="grid">
        {spaces.map((s) => (
          <SpaceCard key={s.id} space={s} />
        ))}
      </div>
      {/* HTML 파서 도달 시점(hydration 이전) 기록 */}
      <StreamMark name="content" />
      {/* as-is와 동일한 단계 이름으로 커밋 완료 시점 기록 */}
      <StageMark name="content-rendered" detail={`카드 ${spaces.length}장 — SSR HTML에 포함되어 도착`} />
    </DemoLayout>
  )
}
