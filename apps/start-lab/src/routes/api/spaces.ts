// Start의 서버 라우트(server route)로 만든 GET JSON 엔드포인트.
// 웹뷰/외부 측정용 — next-lab의 /api/spaces와 동일 스펙 (delay/count/region, no-store).
// 클라이언트 fetch 데모(loader-vs-client/as-is)도 이 엔드포인트를 쓴다.
import { createServerFileRoute } from '@tanstack/react-start/server'
import { getSpaces, parseDelay } from '@renderlab/mock-data'

export const ServerRoute = createServerFileRoute('/api/spaces').methods({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const delay = parseDelay(url.searchParams.get('delay'), 0)
    const countRaw = Number(url.searchParams.get('count'))
    const count = Number.isFinite(countRaw) && countRaw > 0 ? Math.min(Math.round(countRaw), 200) : 60
    const region = url.searchParams.get('region') ?? undefined

    const spaces = await getSpaces({ delay, count, region })

    return new Response(JSON.stringify(spaces), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  },
})
