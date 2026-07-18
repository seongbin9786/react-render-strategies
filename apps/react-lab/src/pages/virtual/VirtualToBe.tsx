import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { DemoLayout } from '../../components/DemoLayout'
import { DomCountCard, ROWS, RowInner, useDomCountStage } from './shared'

/**
 * to-be: @tanstack/react-virtual로 "보이는 행 + overscan"만 DOM으로 만든다.
 * 데이터·행 마크업·스크롤 영역 높이는 as-is와 완전히 동일하고, 렌더 전략만 다르다.
 */
export default function VirtualToBe() {
  const domCount = useDomCountStage()
  const parentRef = useRef<HTMLDivElement | null>(null)

  const virtualizer = useVirtualizer({
    count: ROWS.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44, // .vrow 높이와 일치
    overscan: 8,
  })

  return (
    <DemoLayout
      title="10,000행 리스트 — 가상화 렌더"
      strategy="@tanstack/react-virtual (windowing)"
      kind="to-be"
      pairHref="#/virtual/as-is"
      description="같은 10,000행이지만 뷰포트에 보이는 행(+overscan 8행)만 DOM으로 만든다. 전체 높이는 빈 컨테이너(총 높이 44px×10,000)로 유지해 스크롤바는 동일하게 동작하고, 스크롤할 때마다 보이는 창(window)에 해당하는 행만 갈아끼운다. DOM이 수십 개 수준으로 유지되므로 초기 렌더·스크롤·이후 상태 변화가 모두 가볍다."
      observe={[
        'long-tasks — 첫 커밋의 long task가 as-is 대비 급감하거나 사라진다',
        'content-rendered의 detail — DOM 노드 수가 수백 개 수준으로 표시된다',
        'HUD에 📷 스냅샷이 정상적으로 찍힌다 — DOM이 작아 캡처 한도(6,000노드) 안이기 때문',
        '스크롤 시 행이 재활용되는데도 as-is와 화면이 구분되지 않아야 한다 (같은 UI, 다른 전략)',
      ]}
      wikiRef="08-client-rendering-optimizations.md"
    >
      <DomCountCard
        count={domCount}
        note="보이는 행 + overscan 8행만 실제 DOM이다. as-is와 같은 스크롤 높이를 유지하려고 총 높이만큼의 빈 컨테이너 안에 행을 absolute 배치한다."
      />
      <div className="vlist" ref={parentRef}>
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((vi) => (
            <div
              key={vi.key}
              className="vrow"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 44,
                transform: `translateY(${vi.start}px)`,
              }}
            >
              <RowInner space={ROWS[vi.index]} index={vi.index} />
            </div>
          ))}
        </div>
      </div>
    </DemoLayout>
  )
}
