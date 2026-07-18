import { useEffect, useState } from 'react'
import type { StudySpace } from '@renderlab/mock-data'
import { getApiDelay, perfStage } from '@renderlab/perf'
import { DemoLayout } from '../../components/DemoLayout'
import { fetchSpaces } from '../../lib/api'
import { EMPTY_RESULTS, RegionSections, WF_BASE_DELAY, WF_COUNT, WF_REGIONS, type WfResults } from './shared'

/**
 * to-be: Promise.all(병렬) + render-as-you-fetch(요청 선시작).
 * 이 모듈은 lazy 라우트 청크라서 "라우트 진입 = 모듈 평가" 시점에 아래 startAll()이 즉시 실행된다.
 * 즉 컴포넌트가 마운트되기를 기다리지 않고, 코드가 로드되는 순간 3개 요청이 동시에 나간다.
 */
function startAll(): Promise<StudySpace[]>[] {
  const delay = WF_BASE_DELAY + getApiDelay() // ?apiDelay=(HUD 프리셋) 합산 — PERF_API.md 계약
  perfStage('data-requested', {
    detail: `3개 지역 병렬 요청 시작 (각 ${delay}ms 지연, 모듈 로드 시점 선시작)`,
    snapshot: false,
  })
  const promises = WF_REGIONS.map((region, i) =>
    fetchSpaces({ region, count: WF_COUNT, delay }).then((list) => {
      perfStage(`fetch-${i + 1}-done`, { detail: `${region} ${list.length}건 수신` })
      return list
    }),
  )
  void Promise.all(promises).then(() => {
    perfStage('all-done', { detail: '3개 지역 모두 수신 완료' })
  })
  return promises
}

// 모듈 평가 = 라우트 청크 로드 시점. 렌더보다 먼저 요청을 시작한다 (render-as-you-fetch).
// 재측정은 HUD "재측정"(새로고침) 또는 네트워크 프리셋 버튼으로 — 페이지가 다시 로드되며 재시작된다.
const initialPromises = startAll()

export default function WaterfallToBe() {
  const [results, setResults] = useState<WfResults>(EMPTY_RESULTS)

  useEffect(() => {
    let alive = true
    initialPromises.forEach((p, i) => {
      p.then((list) => {
        if (!alive) return
        setResults((prev) => {
          const next = [...prev]
          next[i] = list
          return next
        })
      }).catch(() => {
        /* 데모: 실패 시 스켈레톤 유지 */
      })
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <DemoLayout
      title="지역별 목록 — 병렬 fetch + 요청 선시작"
      strategy="Promise.all + render-as-you-fetch (모듈 로드 시점 선시작)"
      kind="to-be"
      pairHref="#/waterfall/as-is"
      description="같은 3개 지역·같은 API·같은 지연이지만, 세 요청을 동시에 보내고(Promise.all) 요청 시작 시점도 컴포넌트 마운트가 아니라 라우트 청크가 로드되는 순간으로 앞당겼다(render-as-you-fetch). 전체 대기는 가장 느린 요청 1개 분량으로 줄어든다."
      observe={[
        'fetch-1/2/3-done이 HUD 타임라인에서 거의 같은 시각(병렬)에 찍힌다 — as-is의 계단과 비교',
        'all-done ≈ 지연 × 1 — as-is의 1/3 수준. ?apiDelay=800로 올리면 격차가 더 벌어진다',
        'data-requested가 hydrated(첫 mount)보다 먼저 찍힌다 — 렌더를 기다리지 않았다는 증거',
        '화면: 스켈레톤 3섹션이 거의 동시에 채워진다 (as-is는 위에서부터 순서대로)',
      ]}
      wikiRef="08-client-rendering-optimizations.md"
    >
      <RegionSections results={results} />
    </DemoLayout>
  )
}
