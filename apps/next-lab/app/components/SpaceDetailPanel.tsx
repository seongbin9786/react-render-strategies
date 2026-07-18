import { type StudySpace } from '@renderlab/mock-data'

// prefetch-cache 상세 화면 — 서버/클라이언트 공용 (훅 없음).
// start-lab의 cache-preload 상세(SpaceDetail)와 같은 구성으로 맞춰 미러 비교가 공정하게 되도록 한다.

export function SpaceDetailPanel({ space }: { space: StudySpace | undefined }) {
  if (!space) {
    return <p className="loading-note">해당 스페이스를 찾을 수 없습니다.</p>
  }
  const hue = (space.id * 47) % 360
  return (
    <>
      <div
        className="detail-hero"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 65% 35%))`,
        }}
      >
        <h2>{space.name}</h2>
        <div className="sub">
          {space.region} · {space.kind} · ★ {space.rating.toFixed(1)}
        </div>
      </div>
      <div className="detail-panel">
        <dl>
          <dt>시간당 요금</dt>
          <dd>{space.pricePerHour.toLocaleString('ko-KR')}원</dd>
          <dt>잔여 좌석</dt>
          <dd>
            {space.seatsAvailable} / {space.capacity}석
          </dd>
          <dt>태그</dt>
          <dd>{space.tags.join(', ') || '없음'}</dd>
          <dt>소개</dt>
          <dd style={{ fontWeight: 400 }}>{space.description}</dd>
        </dl>
      </div>
    </>
  )
}
