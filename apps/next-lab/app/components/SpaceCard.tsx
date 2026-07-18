import { spaceImage, type StudySpace } from '@renderlab/mock-data'

// 스터디스페이스 카드 — 모든 데모가 같은 카드를 쓰므로 전략 간 화면이 공정하게 비교된다.
// 서버/클라이언트 공용 (훅 없음).

export function SpaceCard({ space }: { space: StudySpace }) {
  return (
    <article className="card">
      {/* 외부 네트워크 없는 결정적 SVG data URI — LCP 후보 */}
      <img src={spaceImage(space)} alt={space.name} width={640} height={360} />
      <div className="card-body">
        <h3>{space.name}</h3>
        <p className="card-meta">
          {space.region} · {space.kind} · ★ {space.rating.toFixed(1)}
        </p>
        <p className="card-desc">{space.description}</p>
        <p className="card-price">
          시간당 {space.pricePerHour.toLocaleString('ko-KR')}원 · 잔여 {space.seatsAvailable}/{space.capacity}석
        </p>
        <ul className="card-tags">
          {space.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}

/** 로딩 중 회색 스켈레톤 카드 — 시각 단계(스켈레톤 → 콘텐츠)를 뚜렷하게 만든다. */
export function SkeletonCard() {
  return (
    <div className="card skeleton" aria-hidden="true">
      <div className="skeleton-block thumb" />
      <div className="card-body">
        <div className="skeleton-block line-lg" />
        <div className="skeleton-block line-sm" />
        <div className="skeleton-block line-xs" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="card-grid">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
