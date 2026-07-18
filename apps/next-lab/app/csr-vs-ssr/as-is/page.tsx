'use client'

// AS-IS: CSR — 서버는 빈 셸(스켈레톤)만 주고, 데이터는 hydration 이후
// 클라이언트 fetch로 가져온다. curl로 이 페이지를 받으면 목데이터 텍스트가
// 전혀 없다(스켈레톤뿐) — 콘텐츠가 클라이언트에서 온다는 증거.

import { useEffect, useState } from 'react'
import { getApiDelay, perfStage } from '@renderlab/perf'
import type { StudySpace } from '@renderlab/mock-data'
import { DemoLayout } from '../../components/DemoLayout'
import { SpaceCard, SkeletonGrid } from '../../components/SpaceCard'

const COUNT = 40

export default function CsrAsIsPage() {
  const [spaces, setSpaces] = useState<StudySpace[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    perfStage('data-requested', { detail: `/api/spaces 호출 시작 (count=${COUNT}, delay=${getApiDelay()}ms)` })
    fetch('/api/spaces?count=' + COUNT + '&delay=' + getApiDelay())
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json() as Promise<StudySpace[]>
      })
      .then((data) => {
        if (cancelled) return
        perfStage('data-received', { detail: `목록 ${data.length}건 수신` })
        setSpaces(data)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(String(e))
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 데이터가 화면에 커밋된 "다음" effect에서 기록 — 실제 표시 시점에 가장 가깝다.
  useEffect(() => {
    if (spaces) {
      perfStage('content-rendered', { detail: `카드 ${spaces.length}건 렌더 커밋 완료` })
    }
  }, [spaces])

  return (
    <DemoLayout
      title="스터디스페이스 목록 — 클라이언트에서 데이터 가져오기"
      strategy="CSR — useEffect + fetch('/api/spaces')"
      kind="as-is"
      pairHref="/csr-vs-ssr/to-be"
      mirrorHref="http://localhost:3001/loader-vs-client/as-is"
      description="목록 데이터를 hydration 이후 클라이언트에서 fetch한다. 서버는 즉시 응답하므로 TTFB는 빠르지만, 사용자는 [빈 셸 → JS 다운로드/실행 → fetch 왕복]을 전부 기다린 뒤에야 실제 콘텐츠를 본다. SPA에서 흔한 기본형이며, 데이터 지연이 그대로 체감 지연에 더해진다."
      observe={[
        'ttfb/fcp는 빠르다 — 서버가 스켈레톤만 즉시 주기 때문',
        'data-requested가 hydrated 이후에야 시작된다 (JS 실행 전에는 요청 자체가 불가능)',
        'content-rendered = hydrated + fetch 왕복 + apiDelay. HUD에서 apiDelay를 800ms로 올리면 그만큼 늦어진다',
        'lcp가 content-rendered 근처까지 밀리는 것을 스냅샷 필름스트립으로 확인',
      ]}
      wikiRef="02-csr.md"
    >
      <section className="section">
        <h2>전체 목록 {COUNT}건</h2>
        <p className="section-sub">
          로딩 중에는 회색 스켈레톤 {COUNT}개가 보인다. 데이터 도착 시점은 HUD의 data-received 단계로 확인.
        </p>
        {error && <div className="note">데이터 로드 실패: {error}</div>}
        {spaces ? (
          <div className="card-grid">
            {spaces.map((s) => (
              <SpaceCard key={s.id} space={s} />
            ))}
          </div>
        ) : (
          <SkeletonGrid count={COUNT} />
        )}
      </section>
    </DemoLayout>
  )
}
