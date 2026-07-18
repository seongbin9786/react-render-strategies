// as-is: 컴포넌트 useEffect에서 클라이언트 fetch (전형적 CSR 데이터 로딩).
// SSR HTML에는 스켈레톤만 있고, 데이터는 hydration 후에야 요청된다.
// → HTML에 "호점"(스터디스페이스 이름)이 없어야 한다.
import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getApiDelay, perfStage } from '@renderlab/perf'
import type { StudySpace } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SkeletonGrid, SpaceCard } from '../../components/SpaceCard'
import { validateApiDelaySearch } from '../../lib/search'

export const Route = createFileRoute('/loader-vs-client/as-is')({
  validateSearch: validateApiDelaySearch,
  component: Page,
})

function Page() {
  const [spaces, setSpaces] = useState<StudySpace[] | null>(null)
  const requested = useRef(false)
  const rendered = useRef(false)

  useEffect(() => {
    // StrictMode(dev)의 이중 effect로 인한 중복 계측/요청 방지
    if (requested.current) return
    requested.current = true
    const delay = getApiDelay()
    perfStage('data-requested', { detail: `GET /api/spaces?count=40&delay=${delay} (hydration 후에야 시작)` })
    fetch(`/api/spaces?count=40&delay=${delay}`)
      .then((r) => r.json())
      .then((data: StudySpace[]) => {
        perfStage('data-received', { detail: `목록 ${data.length}건 수신` })
        setSpaces(data)
      })
  }, [])

  useEffect(() => {
    if (!spaces || rendered.current) return
    rendered.current = true
    perfStage('content-rendered', { detail: `카드 ${spaces.length}장 렌더 완료 (커밋 후)` })
  }, [spaces])

  return (
    <DemoLayout
      title="스터디스페이스 목록 — 클라이언트 fetch (CSR)"
      strategy="CSR — useEffect + fetch"
      kind="as-is"
      pairHref="/loader-vs-client/to-be"
      mirrorHref="http://localhost:3000/csr-vs-ssr/as-is"
      description="React SPA에서 가장 흔한 패턴입니다. 서버는 빈 스켈레톤만 보내고, 데이터 요청은 JS 다운로드 → hydration이 끝난 뒤에야 시작됩니다. 즉 '문서 왕복 + JS 로드 + API 왕복'이 직렬로 이어져 콘텐츠가 가장 늦게 뜹니다. 소스 보기(HTML)에는 목록 데이터가 전혀 없습니다."
      observe={[
        'data-requested가 hydrated 이후에야 찍히는 것 — 요청 시작 자체가 늦다',
        'content-rendered가 fcp보다 한참 뒤 — 첫 페인트는 스켈레톤일 뿐',
        'HUD 프리셋으로 apiDelay를 800/2000ms로 키우면 격차가 그대로 content-rendered에 더해짐',
        '단계별 스냅샷(📷): fcp 시점은 회색 카드, content-rendered 시점에야 실제 카드',
      ]}
      wikiRef="02-csr.md"
    >
      {spaces ? (
        <div className="grid">
          {spaces.map((s) => (
            <SpaceCard key={s.id} space={s} />
          ))}
        </div>
      ) : (
        <SkeletonGrid count={40} note="클라이언트에서 /api/spaces 요청 중… (SSR HTML은 이 스켈레톤까지만)" />
      )}
    </DemoLayout>
  )
}
