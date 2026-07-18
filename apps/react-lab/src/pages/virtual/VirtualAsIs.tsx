import { DemoLayout } from '../../components/DemoLayout'
import { DomCountCard, ROWS, RowInner, useDomCountStage } from './shared'

/**
 * as-is: 10,000행을 전부 실제 DOM으로 만든다.
 * 보이는 건 화면 높이만큼(십수 행)뿐인데 4만 개 이상의 노드를 만들고 유지한다.
 */
export default function VirtualAsIs() {
  const domCount = useDomCountStage()

  return (
    <DemoLayout
      title="10,000행 리스트 — 전체 DOM 렌더"
      strategy="전체 렌더 (가상화 없음)"
      kind="as-is"
      pairHref="#/virtual/to-be"
      description="10,000행을 한 번에 전부 DOM으로 만든다. 스크롤 영역에 실제로 보이는 행은 십수 개뿐이지만, React는 10,000개 컴포넌트를 렌더하고 브라우저는 그만큼의 노드를 레이아웃/페인트/메모리에 유지해야 한다. 초기 렌더가 길고, 이후의 어떤 상태 변화도 무거워진다."
      observe={[
        'long-tasks — 첫 커밋에서 수백 ms급 long task가 찍힌다 (to-be와 비교)',
        'content-rendered의 detail — DOM 노드 수가 4만 개 이상으로 표시된다',
        'HUD에 📷 스냅샷이 거의 없다 — DOM 6,000노드 초과라 측정 오염 방지를 위해 캡처가 생략된 것. 이 "생략 자체"가 DOM이 크다는 증거다',
        '스크롤을 빠르게 흔들어 보라 — 반응이 to-be보다 무겁다',
      ]}
      wikiRef="08-client-rendering-optimizations.md"
    >
      <DomCountCard
        count={domCount}
        note="행 하나가 노드 5개(래퍼 1 + span 4)이므로 10,000행 ≈ 50,000+ 노드. 스냅샷 한도(6,000노드)를 훌쩍 넘어 HUD 필름스트립이 비는 것이 정상이다."
      />
      <div className="vlist">
        {ROWS.map((s, i) => (
          <div key={s.id} className="vrow">
            <RowInner space={s} index={i} />
          </div>
        ))}
      </div>
    </DemoLayout>
  )
}
