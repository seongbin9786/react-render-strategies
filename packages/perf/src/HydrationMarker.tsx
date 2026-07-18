'use client'
import { useEffect } from 'react'
import { perfStage } from './core'

// 모듈 평가 시점 ≈ 클라이언트 번들 실행 시작 (hydration 준비 단계).
// 이 파일은 클라이언트 번들에서 앱 코드와 함께 평가되므로 근사치로 유효하다.
if (typeof window !== 'undefined') {
  perfStage('js-eval', { snapshot: false, detail: '클라이언트 JS 번들 평가 시작' })
}

let hydratedOnce = false

/** 루트 레이아웃에 한 번 넣는다. React hydration(또는 CSR mount) 완료 시점을 기록한다. */
export function HydrationMarker() {
  useEffect(() => {
    if (hydratedOnce) return
    hydratedOnce = true
    perfStage('hydrated', { detail: 'React hydration/mount 완료 — 이 시점부터 인터랙션 가능' })
  }, [])
  return null
}
