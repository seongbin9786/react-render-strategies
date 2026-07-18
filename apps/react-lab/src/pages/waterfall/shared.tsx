import type { StudySpace } from '@renderlab/mock-data'
import { SkeletonGrid, SpaceCard } from '../../components/SpaceCard'

// as-is/to-be 공통: 같은 3개 지역, 같은 건수, 같은 기본 지연
export const WF_REGIONS = ['강남', '홍대', '성수'] as const
export const WF_COUNT = 6
export const WF_BASE_DELAY = 400 // 각 요청의 기본 백엔드 지연(ms). 여기에 ?apiDelay=가 합산된다.

export type WfResults = (StudySpace[] | null)[]

export const EMPTY_RESULTS: WfResults = [null, null, null]

/** 지역 섹션 3개 — 스켈레톤(회색 카드) → 데이터 도착 순서대로 채워지는 공용 화면 */
export function RegionSections({ results }: { results: WfResults }) {
  return (
    <>
      {WF_REGIONS.map((region, i) => {
        const list = results[i]
        return (
          <div className="wf-section" key={region}>
            <h3>
              {region} 스터디스페이스{' '}
              <span className="status">{list ? `${list.length}건 도착` : '요청 대기/진행 중…'}</span>
            </h3>
            {list ? (
              <div className="space-grid">
                {list.map((s) => (
                  <SpaceCard key={s.id} space={s} />
                ))}
              </div>
            ) : (
              <SkeletonGrid count={WF_COUNT} />
            )}
          </div>
        )
      })}
    </>
  )
}
