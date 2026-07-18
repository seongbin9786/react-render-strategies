// 모든 데모 라우트가 공유하는 ?apiDelay= 검색 파라미터 스키마.
// PerfHUD의 네트워크 프리셋 버튼이 이 쿼리를 바꿔서 재측정한다.
// - 서버(loader)에서는 validateSearch → loaderDeps 로 전달받아 데이터 함수 delay에 더한다.
// - 클라이언트 fetch는 @renderlab/perf의 getApiDelay()를 쓴다.
import { parseDelay } from '@renderlab/mock-data'

export interface ApiDelaySearch {
  apiDelay?: number
}

export function validateApiDelaySearch(search: Record<string, unknown>): ApiDelaySearch {
  const n = parseDelay(search.apiDelay, 0)
  return n > 0 ? { apiDelay: n } : {}
}

/** loaderDeps: ({ search }) => apiDelayDeps(search) — apiDelay가 바뀌면 로더를 다시 실행한다. */
export function apiDelayDeps(search: ApiDelaySearch): { apiDelay: number } {
  return { apiDelay: search.apiDelay ?? 0 }
}
