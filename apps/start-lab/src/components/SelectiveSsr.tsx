// selective-ssr 3종(full / data-only / spa)이 공유하는 콘텐츠와 모드 내비게이션.
// 세 라우트는 동일한 loader(getSpaces delay=400+apiDelay, 20건)·동일한 화면이고
// 라우트 옵션 ssr: true | 'data-only' | false 만 다르다 — Start 고유 기능.
import { Link } from '@tanstack/react-router'
import { StageMark } from '@renderlab/perf'
import type { StudySpace } from '@renderlab/mock-data'
import { SkeletonGrid, SpaceCard } from './SpaceCard'

export const SELECTIVE_MODES = [
  { path: '/selective-ssr/full', label: 'ssr: true (full)' },
  { path: '/selective-ssr/data-only', label: "ssr: 'data-only'" },
  { path: '/selective-ssr/spa', label: 'ssr: false (spa)' },
] as const

export function ModeNav({ current }: { current: string }) {
  return (
    <div className="mode-nav">
      {SELECTIVE_MODES.map((m) => (
        <Link
          key={m.path}
          to={m.path}
          search={(prev: Record<string, unknown>) => prev}
          className={m.path === current ? 'active' : ''}
        >
          {m.label}
        </Link>
      ))}
    </div>
  )
}

export function SelectiveContent({ spaces, mode }: { spaces: StudySpace[]; mode: string }) {
  return (
    <>
      <div className="grid">
        {spaces.map((s) => (
          <SpaceCard key={s.id} space={s} />
        ))}
      </div>
      {/* 세 모드 모두 동일한 단계 이름 — 커밋 완료 시점 비교용 */}
      <StageMark name="content-rendered" detail={`카드 ${spaces.length}장 커밋 완료 (${mode})`} />
    </>
  )
}

export function SelectivePending() {
  return (
    <div className="page">
      <SkeletonGrid count={20} note="loader 실행 대기 중… (이 모드에서 loader가 어디서 도는지 관찰)" />
    </div>
  )
}
