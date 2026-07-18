import { DemoLayout } from '../../components/DemoLayout'
import { MemoBoard } from './shared'

/**
 * to-be: React.memo(CardView) + 안정 props.
 * memo는 props 얕은 비교로 리렌더를 건너뛰므로, 다음 세 가지가 함께 갖춰져야 효과가 난다:
 *  1) 카드 데이터(space)가 렌더마다 새로 만들어지지 않을 것 (모듈 레벨 상수)
 *  2) 콜백(onPick)이 useCallback으로 안정화될 것
 *  3) 계측 객체(tally)가 useRef로 안정화될 것
 */
export default function MemoToBe() {
  return (
    <DemoLayout
      title="카드 500장 — memo로 리렌더 0장"
      strategy="React.memo + 안정 props (useCallback/모듈 상수)"
      kind="to-be"
      pairHref="#/memo/as-is"
      description="같은 카드 500장이지만 memo(CardView)와 안정 props를 썼다. 키 입력으로 부모가 리렌더돼도 카드 props(space·onPick·tally)의 참조가 전부 그대로이므로 얕은 비교를 통과해 카드 렌더가 전부 생략된다. 입력 비용은 '부모 1개 + memo 비교 500회'로 줄어든다."
      observe={[
        '화면의 "이번 입력으로 리렌더된 카드 수" — 키 입력마다 0이 찍힌다 (첫 mount만 500)',
        '타이핑해도 카드가 깜빡이지 않는다 — 리렌더가 실제로 일어나지 않았다는 뜻',
        'worst-interaction — as-is보다 낮게 유지된다',
        '단, memo 비교 자체도 공짜는 아니다 — props가 매번 바뀌는 컴포넌트에는 붙여도 낭비',
      ]}
      wikiRef="08-client-rendering-optimizations.md"
    >
      <MemoBoard memoized={true} />
    </DemoLayout>
  )
}
