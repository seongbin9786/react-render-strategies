// blocking-vs-deferred 쌍이 공유하는 섹션 정의 + 섹션 렌더 컴포넌트.
// 쌍은 동일한 데이터(base+200/+500/+900ms, 12건씩)·동일한 마크업이어야 공정 비교가 된다.
import { StreamMark } from '@renderlab/perf'
import type { StudySpace } from '@renderlab/mock-data'
import { SkeletonCard, SpaceCard } from './SpaceCard'

export const SECTIONS = [
  { index: 1, title: '추천 스페이스 — 강남', region: '강남', extra: 200 },
  { index: 2, title: '신규 오픈 — 홍대', region: '홍대', extra: 500 },
  { index: 3, title: '인기 프리미엄 — 성수', region: '성수', extra: 900 },
] as const

export type SectionMeta = (typeof SECTIONS)[number]

export function Section({ meta, spaces }: { meta: SectionMeta; spaces: StudySpace[] }) {
  return (
    <section className="stream-section">
      <h2>
        {meta.title} <span className="note">+{meta.extra}ms 데이터</span>
      </h2>
      <div className="grid">
        {spaces.map((s) => (
          <SpaceCard key={s.id} space={s} />
        ))}
      </div>
      {/* 이 섹션의 HTML이 파서에 도달한 시점(hydration 이전).
          블로킹 SSR에서는 셋이 몰려 찍히고, deferred 스트리밍에서는 준비 순서대로 찍힌다. */}
      <StreamMark name={`section-${meta.index}`} />
    </section>
  )
}

export function SectionSkeleton({ meta }: { meta: SectionMeta }) {
  return (
    <section className="stream-section" aria-hidden>
      <h2>
        {meta.title} <span className="note">+{meta.extra}ms 데이터 대기 중…</span>
      </h2>
      <div className="grid">
        {Array.from({ length: 12 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  )
}
