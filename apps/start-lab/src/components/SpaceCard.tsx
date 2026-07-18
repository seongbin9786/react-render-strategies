// 스터디스페이스 카드 + 스켈레톤. 모든 데모가 동일한 카드로 렌더해야 공정 비교가 된다.
import type { StudySpace } from '@renderlab/mock-data'

export function SpaceCard({ space }: { space: StudySpace }) {
  const hue = (space.id * 47) % 360
  return (
    <div className="card">
      <div
        className="card-thumb"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 65% 35%))`,
        }}
      >
        {space.name}
      </div>
      <div className="card-body">
        <div className="row1">
          <span>
            {space.region} · {space.kind}
          </span>
          <span>★ {space.rating.toFixed(1)}</span>
        </div>
        <div className="meta">
          시간당 {space.pricePerHour.toLocaleString()}원 · 잔여 {space.seatsAvailable}/{space.capacity}석
        </div>
        <div className="card-tags">
          {space.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden>
      <div className="sk sk-thumb" />
      <div className="sk sk-line" />
      <div className="sk sk-line short" />
    </div>
  )
}

export function SkeletonGrid({ count, note }: { count: number; note?: string }) {
  return (
    <div>
      {note && <p className="loading-note">{note}</p>}
      <div className="grid">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
