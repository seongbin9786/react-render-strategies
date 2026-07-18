import { NextRequest, NextResponse } from 'next/server'
import { getSpaces, parseDelay } from '@renderlab/mock-data'

// 스터디스페이스 목록 API — CSR 데모(클라이언트 fetch)가 사용한다.
// ?delay= 로 백엔드 지연을 시뮬레이션 (HUD의 apiDelay가 이 값으로 전달됨).

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const delay = parseDelay(sp.get('delay'))
  const countRaw = Number(sp.get('count'))
  const count = Number.isFinite(countRaw) && countRaw > 0 ? Math.min(Math.round(countRaw), 200) : 60
  const region = sp.get('region') ?? undefined

  const spaces = await getSpaces({ delay, count, region })

  return NextResponse.json(spaces, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
