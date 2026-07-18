'use client'
import { useEffect, useRef } from 'react'
import { perfStage } from './core'

/**
 * 이 컴포넌트가 클라이언트에서 마운트된 시점을 단계로 기록한다.
 * 지연 로딩된 섹션/컴포넌트의 "실제 사용 가능 시점" 표시에 사용.
 * 주의: 스트리밍 SSR에서 HTML 도착 시점은 <StreamMark>로 잡아야 한다 (이건 hydration 이후 발화).
 */
export function StageMark({ name, detail }: { name: string; detail?: string }) {
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    perfStage(name, { detail })
  }, [name, detail])
  return null
}
