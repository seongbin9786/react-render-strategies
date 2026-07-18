// cache-preload 쌍(as-is/to-be)이 공유하는 목록/상세 화면.
// 두 편은 동일한 화면·동일한 loader 지연이고, 라우트 캐시(staleTime/gcTime)와
// Link preload 옵션만 다르다.
import { Link } from '@tanstack/react-router'
import { StageMark } from '@renderlab/perf'
import type { StudySpace } from '@renderlab/mock-data'
import { SpaceCard } from './SpaceCard'

export function SpaceLinkGrid({
  spaces,
  side,
  preload,
}: {
  spaces: StudySpace[]
  side: 'as-is' | 'to-be'
  /** to-be에서만 'intent' — 호버/터치 순간 loader를 미리 실행 */
  preload: 'intent' | false
}) {
  return (
    <>
      <div className="grid">
        {spaces.map((s) =>
          side === 'as-is' ? (
            <Link
              key={s.id}
              className="card-link"
              to="/cache-preload/as-is/$id"
              params={{ id: String(s.id) }}
              search={(prev: Record<string, unknown>) => prev}
              preload={preload}
            >
              <SpaceCard space={s} />
            </Link>
          ) : (
            <Link
              key={s.id}
              className="card-link"
              to="/cache-preload/to-be/$id"
              params={{ id: String(s.id) }}
              search={(prev: Record<string, unknown>) => prev}
              preload={preload}
            >
              <SpaceCard space={s} />
            </Link>
          ),
        )}
      </div>
      <StageMark name="content-rendered" detail={`목록 ${spaces.length}건 커밋 완료`} />
    </>
  )
}

export function SpaceDetail({ space, backSide }: { space: StudySpace | undefined; backSide: 'as-is' | 'to-be' }) {
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
          <dd>{space.pricePerHour.toLocaleString()}원</dd>
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
      <p style={{ marginTop: 14 }}>
        {backSide === 'as-is' ? (
          <Link className="btn btn-ghost" to="/cache-preload/as-is" search={(prev: Record<string, unknown>) => prev}>
            ← 목록으로 (뒤로가기도 loader 재실행!)
          </Link>
        ) : (
          <Link
            className="btn btn-ghost"
            to="/cache-preload/to-be"
            search={(prev: Record<string, unknown>) => prev}
            preload="intent"
          >
            ← 목록으로 (캐시가 살아있어 즉시)
          </Link>
        )}
      </p>
      <StageMark name="detail-rendered" detail={`${space.name} 상세 커밋 완료`} />
    </>
  )
}

export function ListPending() {
  return (
    <div className="page">
      <p className="loading-note">목록 loader 실행 중… (300ms + apiDelay)</p>
      <div className="grid">
        {Array.from({ length: 20 }, (_, i) => (
          <div className="skeleton-card" key={i} aria-hidden>
            <div className="sk sk-thumb" />
            <div className="sk sk-line" />
            <div className="sk sk-line short" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DetailPending() {
  return (
    <div className="page">
      <p className="loading-note">상세 loader 실행 중… (500ms + apiDelay)</p>
      <div className="skeleton-card" style={{ maxWidth: 560 }} aria-hidden>
        <div className="sk sk-thumb" style={{ height: 120 }} />
        <div className="sk sk-line" />
        <div className="sk sk-line" />
        <div className="sk sk-line short" />
      </div>
    </div>
  )
}
