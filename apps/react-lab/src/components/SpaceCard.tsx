import type { StudySpace } from '@renderlab/mock-data'

/** waterfall 데모 공용 스터디스페이스 카드 — as-is/to-be가 완전히 동일한 화면을 쓰게 한다. */
export function SpaceCard({ space }: { space: StudySpace }) {
  return (
    <div className="space-card">
      <div className="chip" style={{ background: space.color }}>
        {space.name}
      </div>
      <div className="body">
        {space.kind} · ★{space.rating} · {space.pricePerHour.toLocaleString()}원/시간
        <br />
        잔여 {space.seatsAvailable}/{space.capacity}석
      </div>
    </div>
  )
}

/** 데이터 도착 전의 회색 스켈레톤 카드 그리드 */
export function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="space-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  )
}
