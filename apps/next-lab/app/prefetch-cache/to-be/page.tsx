// TO-BE 목록: Link 기본 prefetch(뷰포트 진입 시 프리페치) + 상세 loading.tsx + staleTimes.dynamic 60.
// as-is와 완전히 같은 화면·같은 데이터 지연이지만, 클라이언트 내비게이션 레이어를 전부 켠 구성.
import { getSpaces, parseDelay } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SpaceLinkGrid, NavDoneMark } from '../../components/PrefetchCache'

const COUNT = 20

export default async function PrefetchToBeListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const delay = parseDelay(sp.apiDelay)
  const spaces = await getSpaces({ delay: 300 + delay, count: COUNT })

  return (
    <DemoLayout
      title="목록 → 상세 — 기본 prefetch + loading.tsx + staleTimes 60s"
      strategy="뷰포트 프리페치 + 프리페치된 로딩 셸 + Router Cache 재사용"
      kind="to-be"
      pairHref="/prefetch-cache/as-is"
      mirrorHref="http://localhost:3001/cache-preload/to-be"
      description="as-is와 동일한 화면·동일한 데이터 지연이지만 세 가지를 켰습니다. ① Link 기본 prefetch — 뷰포트에 들어온 카드 링크는 상세의 loading.tsx 셸까지 미리 받아 둡니다(동적 라우트라 데이터까지는 아님 — 데이터까지 원하면 prefetch={true}). ② 상세 세그먼트 loading.tsx — 클릭 즉시 프리페치된 로딩 셸로 전환되어 화면이 바로 반응합니다. ③ next.config의 experimental.staleTimes.dynamic: 60 — 동적 페이지의 Router Cache 재사용 시간을 기본값 0초에서 60초로 올린 것으로, 기본값에서는 Link 전환마다 서버에 RSC를 다시 요청하지만 60초 동안은 한 번 방문한 목록/상세를 캐시에서 즉시 재사용합니다(뒤로가기·재방문 즉시)."
      observe={[
        '클릭 즉시 loading-shell 단계가 찍히며 화면이 스켈레톤으로 바로 반응 — as-is의 무반응 구간과 비교',
        '한 번 봤던 상세 재클릭·← 목록으로 복귀(60초 내)는 spa-nav:start → done이 수 ms — Router Cache 재사용',
        '실험 절차 ①: 목록 로드 직후 DevTools Network에서 ?_rsc= 프리페치 요청들을 확인 → 카드에 호버했다가(뷰포트 프리페치는 이미 완료) 클릭 → 로딩 셸이 즉시 뜨고 spa-nav:done은 데이터 왕복(500ms+apiDelay) 후',
        '실험 절차 ②: 새 시크릿 창에서 페이지가 뜨자마자(프리페치가 끝나기 전) 카드를 즉시 클릭 → 프리페치가 안 끝난 링크는 as-is처럼 반응이 늦는 것을 비교',
        '실험 절차 ③: 같은 카드를 두 번 클릭 — 첫 번째는 500ms+apiDelay, 두 번째(60초 내)는 즉시. 60초 뒤 다시 클릭하면 재요청',
      ]}
      wikiRef="09-selective-ssr-and-router-caching.md"
    >
      <div className="experiment">
        <b>실험해보기 — 프리페치 후 클릭 vs 즉시 클릭</b>
        <ol>
          <li>
            페이지 로드 후 1~2초 기다리면 뷰포트의 카드 링크들이 프리페치된다(Network 탭의 <code>?_rsc=</code> 요청).
            이제 <b>아무 카드나 클릭</b> → 로딩 셸이 즉시 뜬다(클릭 반응 0에 수렴).
          </li>
          <li>
            시크릿 창을 새로 열고 목록이 <b>뜨자마자 즉시 클릭</b>(프리페치 완료 전) → 셸 전환이 늦어 as-is에
            가까워진다.
          </li>
          <li>
            상세에서 <b>← 목록으로</b> → 60초 내에는 목록이 즉시(Router Cache). 같은 상세를 60초 내 재클릭해도 즉시.
          </li>
        </ol>
      </div>
      <section className="section">
        <h2>스터디스페이스 목록 {COUNT}건 (목록 데이터 300ms+apiDelay)</h2>
        <p className="section-sub">
          화면·데이터는 as-is와 동일. 달라진 것은 Link의 prefetch 기본값, 상세의 loading.tsx, 그리고 staleTimes뿐.
        </p>
        <SpaceLinkGrid spaces={spaces} side="to-be" apiDelay={delay} />
      </section>
      <NavDoneMark label="to-be 목록" />
    </DemoLayout>
  )
}
