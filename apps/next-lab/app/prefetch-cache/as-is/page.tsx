// AS-IS 목록: Link prefetch={false} — 클라이언트 내비게이션 레이어를 활용하지 않는 구성.
// 뷰포트 프리페치가 없으므로 카드를 "클릭한 뒤에야" 상세의 RSC 왕복(500ms+apiDelay)이 시작되고,
// as-is 상세 세그먼트에는 loading.tsx도 없어 응답이 올 때까지 화면이 목록에 멈춘 채 아무 피드백이 없다.
import { getSpaces, parseDelay } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SpaceLinkGrid, NavDoneMark } from '../../components/PrefetchCache'

const COUNT = 20

export default async function PrefetchAsIsListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const delay = parseDelay(sp.apiDelay)
  const spaces = await getSpaces({ delay: 300 + delay, count: COUNT })

  return (
    <DemoLayout
      title="목록 → 상세 — 프리페치 없음"
      strategy="Link prefetch={false} + 상세 loading.tsx 없음"
      kind="as-is"
      pairHref="/prefetch-cache/to-be"
      mirrorHref="http://localhost:3001/cache-preload/as-is"
      description="이 데모의 as-is는 prefetch={false}로 카드 Link의 프리페치를 끈 것입니다(상세 세그먼트에 loading.tsx도 없음). 카드를 클릭한 뒤에야 상세의 서버 왕복(500ms+apiDelay)이 시작되고, RSC 응답이 도착할 때까지 화면은 목록에 멈춘 채 아무 반응이 없습니다. 주의: next.config의 experimental.staleTimes(dynamic 60초)는 앱 전역 설정이라 이 as-is에도 적용됩니다 — 그래서 60초 안에 이미 방문한 상세/목록으로 되돌아가는 전환은 as-is에서도 Router Cache를 타고 즉시일 수 있습니다. '캐시 없는 매번 대기'를 보고 싶으면 처음 가는 카드를 클릭하거나 60초 뒤에 다시 오가세요."
      observe={[
        '처음 가는 카드 클릭 → spa-nav:start와 spa-nav:done 사이 ≈ RTT + 500ms + apiDelay (HUD 프리셋으로 apiDelay를 올리면 그대로 늘어남)',
        '클릭 후 상세가 뜰 때까지 시각 피드백이 전혀 없다 — 프리페치된 로딩 셸이 없어 화면이 목록에 멈춰 있음',
        '실험 절차: 목록 로드 직후 DevTools Network를 열면 ?_rsc= 프리페치 요청이 하나도 없다 → 아무 카드나 즉시 클릭 → 클릭 순간에야 RSC 요청이 시작됨을 확인',
        'to-be에서 같은 동선(뷰포트/호버 프리페치 후 클릭)을 반복해 spa-nav 소요 시간과 클릭 직후 반응을 비교',
      ]}
      wikiRef="09-selective-ssr-and-router-caching.md"
    >
      <section className="section">
        <h2>스터디스페이스 목록 {COUNT}건 (목록 데이터 300ms+apiDelay)</h2>
        <p className="section-sub">
          카드를 클릭하면 상세로 SPA 전환합니다. 클릭→표시 체감 시간은 HUD의 spa-nav:start → spa-nav:done 간격으로
          확인하세요.
        </p>
        <SpaceLinkGrid spaces={spaces} side="as-is" apiDelay={delay} />
      </section>
      <NavDoneMark label="as-is 목록" />
    </DemoLayout>
  )
}
