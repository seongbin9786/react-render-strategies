import { generateSpaces } from '@renderlab/mock-data'

export interface Item {
  id: number
  label: string
  region: string
}

// 20,000개 아이템 — mock 이름 변형으로 결정적 생성 (seed 고정이라 항상 같은 목록).
// as-is/to-be가 완전히 동일한 배열 참조를 쓰도록 모듈 레벨에서 1회만 만든다.
export const ITEMS: Item[] = generateSpaces(20000).map((s) => ({
  id: s.id,
  label: `${s.name} · ${s.kind} · ★${s.rating}`,
  region: s.region,
}))

export function filterItems(query: string): Item[] {
  const q = query.trim()
  if (!q) return ITEMS
  return ITEMS.filter((it) => it.label.includes(q) || it.region.includes(q))
}
