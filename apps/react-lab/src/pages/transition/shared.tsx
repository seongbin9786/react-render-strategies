import { memo, useEffect, useRef } from 'react'
import { perfStage } from '@renderlab/perf'
import type { Item } from './data'

/** 리스트 본문 — as-is/to-be 동일 마크업. to-be에서는 memo가 의미(부모의 urgent 렌더 스킵)를 가진다. */
export const ItemList = memo(function ItemList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map((it) => (
        <li key={it.id}>
          <span>{it.label}</span>
          <em>{it.region}</em>
        </li>
      ))}
    </ul>
  )
})

/**
 * keydown → 다음 paint까지의 지연을 실측해 화면에 숫자로 표시한다.
 * setState로 표시하면 그 자체가 또 렌더를 만들므로, DOM 텍스트에 직접 쓴다.
 * 사용법: onKeyDown에서 mark(), 리스트가 커밋되는 렌더의 effect에서 measure().
 */
export function useKeyToPaint() {
  const keyT = useRef(0)
  const el = useRef<HTMLSpanElement | null>(null)
  const mark = () => {
    keyT.current = performance.now()
  }
  const measure = () => {
    if (!keyT.current) return
    const t0 = keyT.current
    keyT.current = 0
    // rAF 2회 뒤 ≈ 이번 커밋이 실제로 페인트된 직후
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (el.current) el.current.textContent = `${Math.round(performance.now() - t0)}ms`
      }),
    )
  }
  return { mark, measure, el }
}

/**
 * 필터 결과가 안정된 뒤(마지막 변경 후 400ms) perfStage("filter-applied")를 기록한다.
 * 키 입력마다 찍으면 HUD가 도배되므로 디바운스한다. as-is/to-be가 동일 이름·동일 detail 포맷을 쓴다.
 */
export function useFilterAppliedStage(resultCount: number) {
  useEffect(() => {
    const id = setTimeout(() => {
      perfStage('filter-applied', { detail: `결과 ${resultCount.toLocaleString()}건`, snapshot: false })
    }, 400)
    return () => clearTimeout(id)
  }, [resultCount])
}
