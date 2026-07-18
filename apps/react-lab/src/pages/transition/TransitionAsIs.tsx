import { useEffect, useState } from 'react'
import { DemoLayout } from '../../components/DemoLayout'
import { filterItems } from './data'
import { ItemList, useFilterAppliedStage, useKeyToPaint } from './shared'

/**
 * as-is: 입력 상태와 20,000행 리스트가 "같은 동기 렌더"에 묶여 있다.
 * 키 하나 누를 때마다 React가 리스트 전체를 다시 렌더한 뒤에야 입력 글자가 화면에 그려지므로
 * 타이핑이 눈에 띄게 버벅인다.
 */
export default function TransitionAsIs() {
  const [text, setText] = useState('')
  const { mark, measure, el } = useKeyToPaint()

  // 매 렌더마다 20,000개 전체를 다시 필터링 + 전체 리스트 재렌더 (이것이 문제의 핵심)
  const filtered = filterItems(text)

  useFilterAppliedStage(filtered.length)
  useEffect(() => {
    measure() // 이번 커밋(입력+리스트가 한 덩어리)이 페인트된 시점까지 측정
    // eslint 없음: measure는 안정 함수
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DemoLayout
      title="검색 필터 — 동기 렌더에 묶인 입력"
      strategy="동기 렌더 (전략 없음)"
      kind="as-is"
      pairHref="#/transition/to-be"
      description="20,000개 아이템을 입력값으로 즉시 필터링한다. 입력 상태 갱신과 무거운 리스트 렌더가 하나의 동기 렌더로 묶여 있어, 리스트 렌더(수백 ms)가 끝나야 입력 글자가 화면에 나타난다. 사용자는 '키보드가 씹힌다'고 느낀다."
      observe={[
        'worst-interaction — 타이핑 중 수백 ms까지 치솟는다 (to-be와 비교)',
        'long-tasks — 키 입력마다 50ms+ 작업이 쌓여 개수/총량이 빠르게 늘어난다',
        'filter-applied — 결과 건수는 to-be와 동일해야 공정 비교다 (같은 데이터, 같은 필터)',
        '화면의 "입력 반응 지연(keydown→paint)" 숫자 — 리스트 렌더 시간만큼 커진다',
      ]}
      wikiRef="08-client-rendering-optimizations.md"
    >
      <div className="card">
        <input
          className="demo-input"
          value={text}
          placeholder="지역/이름으로 검색 (예: 강남, 부스, 라운지)…"
          onKeyDown={mark}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="metric-row big-metric">
          <span>
            입력 반응 지연(keydown→paint): <span className="big-num" ref={el}>–</span>
          </span>
          <span className="hint">결과 {filtered.length.toLocaleString()}건 / 전체 20,000건</span>
        </div>
      </div>
      <div className="tr-list">
        <ItemList items={filtered} />
      </div>
    </DemoLayout>
  )
}
