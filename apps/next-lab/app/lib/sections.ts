import { getSpaces, type StudySpace } from '@renderlab/mock-data'

// blocking-vs-streaming 쌍이 공유하는 섹션 데이터.
// as-is/to-be가 "완전히 같은 데이터 + 같은 지연"을 쓰게 하여 전략만 비교되게 한다.
// base는 ?apiDelay= 쿼리값(ms). 섹션별 추가 지연은 백엔드 응답 속도 차이를 시뮬레이션한다.

export const SECTION_META = [
  { mark: 'section-1', title: '오늘의 추천', extra: 200, sub: '추천 12건 · 지연 base+200ms' },
  { mark: 'section-2', title: '강남 지역 인기', extra: 500, sub: '강남 12건 · 지연 base+500ms' },
  { mark: 'section-3', title: '평점 높은 순', extra: 900, sub: '평점순 12건 · 지연 base+900ms' },
] as const

/** 섹션 1 — 추천 12건 (base + 200ms) */
export function getRecommended(base: number): Promise<StudySpace[]> {
  return getSpaces({ delay: base + 200, count: 12 })
}

/** 섹션 2 — 강남 지역 12건 (base + 500ms) */
export function getGangnam(base: number): Promise<StudySpace[]> {
  return getSpaces({ delay: base + 500, count: 12, region: '강남' })
}

/** 섹션 3 — 평점순 12건 (base + 900ms) */
export async function getTopRated(base: number): Promise<StudySpace[]> {
  const list = await getSpaces({ delay: base + 900, count: 60 })
  return [...list].sort((a, b) => b.rating - a.rating).slice(0, 12)
}
