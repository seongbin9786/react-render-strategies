import { useEffect, useState } from 'react'
import { generateSpaces, type StudySpace } from '@renderlab/mock-data'
import { perfStage } from '@renderlab/perf'

// 10,000행 — as-is/to-be 동일 데이터 (seed 고정 결정적 생성)
export const ROWS: StudySpace[] = generateSpaces(10000)

/** 행 내용 — as-is/to-be 완전 동일 마크업 (감싸는 래퍼만 다름) */
export function RowInner({ space, index }: { space: StudySpace; index: number }) {
  return (
    <>
      <span className="row-idx">{index + 1}</span>
      <span className="row-name">{space.name}</span>
      <span className="row-region">{space.region}</span>
      <span className="row-price">{space.pricePerHour.toLocaleString()}원/시간</span>
    </>
  )
}

/**
 * 첫 커밋이 페인트된 뒤 문서 전체 DOM 노드 수를 세고,
 * perfStage("content-rendered")를 as-is/to-be 동일 이름·동일 detail 포맷으로 기록한다.
 */
export function useDomCountStage(): number | null {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    let cancelled = false
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (cancelled) return
        const n = document.querySelectorAll('*').length
        setCount(n)
        perfStage('content-rendered', {
          detail: `10,000행 목록 커밋 완료 / 문서 DOM 노드 ${n.toLocaleString()}개`,
        })
      }),
    )
    return () => {
      cancelled = true
    }
  }, [])
  return count
}

/** 공용 메트릭 헤더 — DOM 노드 수를 크게 표시 */
export function DomCountCard({ count, note }: { count: number | null; note: string }) {
  return (
    <div className="card">
      <div className="metric-row big-metric">
        <span>
          현재 문서 DOM 노드 수(document.querySelectorAll("*").length):{' '}
          <span className="big-num">{count === null ? '측정 중…' : count.toLocaleString()}</span>
        </span>
      </div>
      <p className="hint">{note}</p>
    </div>
  )
}
