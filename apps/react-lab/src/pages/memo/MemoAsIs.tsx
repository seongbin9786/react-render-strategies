import { DemoLayout } from '../../components/DemoLayout'
import { MemoBoard } from './shared'

/**
 * as-is: 부모(입력 상태 보유)가 리렌더되면 자식 카드 500장이 전부 같이 리렌더된다.
 * React의 기본 동작 — 부모가 렌더되면 자식도 렌더 (props가 같아도).
 */
export default function MemoAsIs() {
  return (
    <DemoLayout
      title="카드 500장 — 키 입력마다 전부 리렌더"
      strategy="기본 렌더 전파 (전략 없음)"
      kind="as-is"
      pairHref="#/memo/to-be"
      description="입력 상태를 가진 부모 아래에 카드 500장이 있다. React는 부모가 리렌더되면 props가 같아도 자식을 전부 다시 렌더하므로, 키 하나에 카드 500장이 리렌더된다. 카드마다 렌더 카운트가 올라가고 배경이 깜빡여서 낭비가 눈에 보인다."
      observe={[
        '화면의 "이번 입력으로 리렌더된 카드 수" — 키 입력마다 500이 찍힌다',
        '카드 전체가 매 키 입력마다 주황색으로 깜빡인다 (리렌더 시각화)',
        'worst-interaction / long-tasks — 카드 렌더 비용만큼 입력 반응이 무거워진다',
        'to-be와 화면·데이터가 완전히 동일한지 확인 (전략만 다른 공정 비교)',
      ]}
      wikiRef="08-client-rendering-optimizations.md"
    >
      <MemoBoard memoized={false} />
    </DemoLayout>
  )
}
