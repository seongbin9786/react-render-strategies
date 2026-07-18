// to-be 상세의 로딩 셸 — 기본 prefetch가 이 셸까지 미리 받아 두므로,
// 카드 클릭 순간 데이터 도착 전에 즉시 이 화면으로 전환된다. (as-is에는 이 파일이 없다)
import { StageMark } from '@renderlab/perf'

export default function DetailLoading() {
  return (
    <main className="demo">
      <p className="loading-note">상세 데이터 로딩 중… (500ms + apiDelay) — 프리페치된 loading.tsx 셸</p>
      <div className="card skeleton" style={{ maxWidth: 560 }} aria-hidden="true">
        <div className="skeleton-block thumb" />
        <div className="card-body">
          <div className="skeleton-block line-lg" />
          <div className="skeleton-block line-sm" />
          <div className="skeleton-block line-xs" />
        </div>
      </div>
      {/* 로딩 셸이 화면에 뜬 시점 — spa-nav:start 직후에 찍히는지 확인 (데모 고유 단계) */}
      <StageMark name="loading-shell" detail="프리페치된 로딩 셸 표시 (데이터 도착 전)" />
    </main>
  )
}
