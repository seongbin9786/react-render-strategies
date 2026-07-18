// cache-preload 상세 데이터 페치를 createServerFn()으로 감싼 서버 함수.
// ('-' 접두사 파일은 라우트 생성에서 제외된다 — 라우트가 아닌 공용 모듈.)
//
// 왜 server function인가 (wiki 11 '서버 전용 코드' 행의 실물 사례):
// - handler 본문은 서버 번들에만 포함되고, 클라이언트 번들에는 RPC 스텁만 남는다.
// - 첫 로드(SSR)에서는 loader가 서버에서 돌므로 함수를 직접 호출하고,
//   SPA 내비게이션에서는 loader가 클라이언트에서 돌지만 이 함수만 서버로
//   fetch(RPC)된다 — validator 덕에 인자·반환 타입이 끝까지 추론된다.
// - Next의 서버 컴포넌트/'use server'(컴포넌트 경계 = 서버 경계)와 달리,
//   Start는 "함수 하나"가 서버 경계다.
import { createServerFn } from '@tanstack/react-start'
import { getSpaceById } from '@renderlab/mock-data'

export const fetchSpaceDetail = createServerFn({ method: 'GET' })
  .validator((data: { id: number; apiDelay: number }) => data)
  .handler(({ data }) => getSpaceById(data.id, { delay: 500 + data.apiDelay }))
