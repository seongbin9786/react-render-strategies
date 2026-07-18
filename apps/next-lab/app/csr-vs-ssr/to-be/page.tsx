// TO-BE: SSR — async 서버 컴포넌트가 요청 처리 중에 데이터를 직접 가져와
// 완성된 HTML을 보낸다. curl로 받아도 목록 텍스트("○○ n호점")가 이미 들어 있다.
// 대신 데이터 지연(apiDelay)이 TTFB에 그대로 반영된다 — SSR의 비용.

import { StreamMark, StageMark } from '@renderlab/perf'
import { getSpaces, parseDelay } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SpaceCard } from '../../components/SpaceCard'

const COUNT = 40

export default async function SsrToBePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Next 15: searchParams는 Promise — await로 읽는 순간 이 라우트는 요청 단위 동적 렌더가 된다.
  const sp = await searchParams
  const delay = parseDelay(sp.apiDelay)
  const spaces = await getSpaces({ delay, count: COUNT })

  return (
    <DemoLayout
      title="스터디스페이스 목록 — 서버에서 데이터까지 렌더"
      strategy="SSR — async Server Component + getSpaces() 직접 호출"
      kind="to-be"
      pairHref="/csr-vs-ssr/as-is"
      mirrorHref="http://localhost:3001/loader-vs-client/to-be"
      description="as-is와 완전히 같은 화면이지만, 데이터를 서버 컴포넌트가 요청 처리 중에 직접 가져온다. 브라우저에 도착하는 HTML에 이미 카드 40건이 들어 있어 첫 페인트가 곧 콘텐츠다. 클라이언트 fetch 왕복과 그 사이의 스켈레톤 구간이 통째로 사라진다."
      observe={[
        'fcp 시점에 이미 카드가 보인다 — 스냅샷에서 스켈레톤 구간이 없다',
        'stream:content가 hydrated보다 앞선다 (HTML 파서가 콘텐츠에 도달한 시점, JS 실행 이전)',
        'apiDelay를 올리면 TTFB가 같이 늘어난다(SSR의 비용) — 서버가 데이터를 기다린 뒤에야 첫 바이트를 보내기 때문',
        'as-is와 같은 apiDelay로 놓고 content-rendered(≈hydrated 직후)를 쌍으로 비교',
      ]}
      wikiRef="03-ssr.md"
    >
      <section className="section">
        <h2>전체 목록 {COUNT}건</h2>
        <p className="section-sub">
          이 HTML은 서버에서 데이터가 채워진 채 도착했다. curl로 받아도 지점 이름이 그대로 보인다.
        </p>
        <div className="card-grid">
          {spaces.map((s) => (
            <SpaceCard key={s.id} space={s} />
          ))}
        </div>
        {/* 콘텐츠 말미: HTML 파서가 여기 도달한 시점(hydration 이전)을 기록 */}
        <StreamMark name="content" />
        {/* 쌍 비교용 — as-is의 content-rendered와 동일한 이름으로 클라이언트 커밋 시점도 기록 */}
        <StageMark name="content-rendered" detail={`카드 ${COUNT}건 hydrate 완료 (SSR HTML은 이미 표시된 상태)`} />
      </section>
    </DemoLayout>
  )
}
