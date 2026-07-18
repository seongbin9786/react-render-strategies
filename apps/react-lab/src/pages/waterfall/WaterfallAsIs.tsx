import { useEffect, useState } from 'react'
import { getApiDelay, perfStage } from '@renderlab/perf'
import { DemoLayout } from '../../components/DemoLayout'
import { fetchSpaces } from '../../lib/api'
import { EMPTY_RESULTS, RegionSections, WF_BASE_DELAY, WF_COUNT, WF_REGIONS, type WfResults } from './shared'

/**
 * as-is: fetch-on-render + 순차 실행 (요청 워터폴).
 * 마운트 후에야 첫 요청이 시작되고, 앞 요청이 끝나야 다음 요청이 나간다.
 * 전체 대기 시간 = 지연 × 3. HUD 워터폴에서 fetch-1/2/3-done이 계단 모양으로 찍힌다.
 */
export default function WaterfallAsIs() {
  const [results, setResults] = useState<WfResults>(EMPTY_RESULTS)

  useEffect(() => {
    let alive = true
    ;(async () => {
      // ?apiDelay=(HUD 프리셋)를 읽어 각 요청의 delay에 합산 — PERF_API.md 계약
      const delay = WF_BASE_DELAY + getApiDelay()
      perfStage('data-requested', {
        detail: `3개 지역 순차 요청 시작 (각 ${delay}ms 지연)`,
        snapshot: false,
      })
      for (let i = 0; i < WF_REGIONS.length; i++) {
        // 앞 요청을 await로 기다린 "다음에야" 다음 요청 시작 — 이것이 워터폴의 원인
        const list = await fetchSpaces({ region: WF_REGIONS[i], count: WF_COUNT, delay })
        if (!alive) return
        perfStage(`fetch-${i + 1}-done`, { detail: `${WF_REGIONS[i]} ${list.length}건 수신` })
        setResults((prev) => {
          const next = [...prev]
          next[i] = list
          return next
        })
      }
      perfStage('all-done', { detail: '3개 지역 모두 수신 완료' })
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <DemoLayout
      title="지역별 목록 — 순차 fetch 워터폴"
      strategy="fetch-on-render + 직렬 await (전략 없음)"
      kind="as-is"
      pairHref="#/waterfall/to-be"
      description="3개 지역 데이터를 각각 별도 API로 받아오는데, 앞 요청이 끝나야 다음 요청을 보낸다(직렬 await). 게다가 컴포넌트가 마운트된 뒤에야 첫 요청이 시작된다(fetch-on-render). 지연이 400ms면 전체 대기는 1,200ms+ — 요청 수에 비례해 늘어난다."
      observe={[
        'fetch-1-done → fetch-2-done → fetch-3-done이 HUD 타임라인에 계단(직렬)으로 찍힌다',
        'all-done ≈ 지연 × 3 — ?apiDelay=800로 올리면 차이가 3배로 벌어진다',
        'data-requested가 hydrated(첫 mount) 뒤에야 찍힌다 — 렌더를 기다렸다 요청한다는 뜻',
        '화면: 스켈레톤 3섹션이 위에서부터 하나씩 순서대로 채워진다',
      ]}
      wikiRef="08-client-rendering-optimizations.md"
    >
      <RegionSections results={results} />
    </DemoLayout>
  )
}
