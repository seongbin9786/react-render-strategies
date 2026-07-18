import type { StudySpace } from '@renderlab/mock-data'

/**
 * vite dev/preview 서버의 GET /api/spaces 미들웨어(vite.config.ts)를 호출한다.
 * delay(ms)는 서버 쪽 인위 지연 — 데모는 여기에 getApiDelay()(HUD의 ?apiDelay= 프리셋)를 합산해 전달한다.
 */
export async function fetchSpaces(params: { region?: string; count?: number; delay?: number }): Promise<StudySpace[]> {
  const q = new URLSearchParams()
  if (params.region) q.set('region', params.region)
  if (params.count) q.set('count', String(params.count))
  if (params.delay && params.delay > 0) q.set('delay', String(params.delay))
  const res = await fetch(`/api/spaces?${q.toString()}`)
  if (!res.ok) throw new Error(`API 오류: ${res.status}`)
  return (await res.json()) as StudySpace[]
}
