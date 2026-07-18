'use client'
// prefetch-cache 쌍(as-is/to-be)이 공유하는 클라이언트 조각들.
// 두 편은 동일한 화면·동일한 데이터 지연이고, 차이는 Link의 prefetch 옵션과
// 상세 세그먼트의 loading.tsx 유무뿐이다. (staleTimes는 next.config 전역 설정)
import Link from 'next/link'
import { useEffect } from 'react'
import { StageMark } from '@renderlab/perf'
import type { StudySpace } from '@renderlab/mock-data'
import { SpaceCard } from './SpaceCard'
import { markNavDone, markNavStart } from '../lib/nav-perf'

type Side = 'as-is' | 'to-be'

/** apiDelay를 전환 후에도 유지하기 위한 쿼리스트링 (서버 컴포넌트가 delay를 알고 만들어 넘긴다). */
function qs(apiDelay: number): string {
  return apiDelay > 0 ? `?apiDelay=${apiDelay}` : ''
}

/**
 * 목록 카드 그리드. as-is는 prefetch={false}로 뷰포트 프리페치를 끄고,
 * to-be는 prefetch를 지정하지 않아 기본 동작(뷰포트 진입 시 loading.tsx 셸까지 프리페치)을 쓴다.
 */
export function SpaceLinkGrid({ spaces, side, apiDelay }: { spaces: StudySpace[]; side: Side; apiDelay: number }) {
  return (
    <>
      <div className="card-grid">
        {spaces.map((s) => {
          const href = `/prefetch-cache/${side}/${s.id}${qs(apiDelay)}`
          return (
            <Link
              key={s.id}
              className="card-link"
              href={href}
              prefetch={side === 'as-is' ? false : undefined}
              onClick={() => markNavStart(href)}
            >
              <SpaceCard space={s} />
            </Link>
          )
        })}
      </div>
      <StageMark name="content-rendered" detail={`목록 ${spaces.length}건 커밋 완료`} />
    </>
  )
}

/** 상세 → 목록 복귀 링크. 이 클릭도 SPA 전환이므로 spa-nav:start를 기록한다. */
export function BackToListLink({ side, apiDelay }: { side: Side; apiDelay: number }) {
  const href = `/prefetch-cache/${side}${qs(apiDelay)}`
  return (
    <p style={{ marginTop: 14 }}>
      <Link
        className="back-link"
        href={href}
        prefetch={side === 'as-is' ? false : undefined}
        onClick={() => markNavStart(href)}
      >
        {side === 'as-is' ? '← 목록으로 (프리페치·로딩 셸 없음)' : '← 목록으로 (Router Cache가 살아있으면 즉시)'}
      </Link>
    </p>
  )
}

/** 도착 페이지의 콘텐츠 마운트 시점에 spa-nav:done(경과 ms)을 기록한다. */
export function NavDoneMark({ label }: { label: string }) {
  useEffect(() => {
    markNavDone(label)
  }, [label])
  return null
}
