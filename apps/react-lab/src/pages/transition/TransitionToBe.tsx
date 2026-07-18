import { useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react'
import { DemoLayout } from '../../components/DemoLayout'
import { filterItems } from './data'
import { ItemList, useFilterAppliedStage, useKeyToPaint } from './shared'

/**
 * to-be: 입력 갱신(urgent)과 리스트 갱신(transition)을 분리한다.
 *  - startTransition(() => setQuery(v)): 리스트용 상태 갱신을 "중단 가능한" 렌더로 격하
 *  - useDeferredValue(query): 리스트가 항상 한 박자 늦은 값으로 렌더되어도 됨을 명시
 *  - ItemList는 memo이므로 urgent 렌더(입력 글자만 갱신)에서는 스킵된다
 * 결과: 리스트가 여전히 수백 ms 걸려도 입력 글자는 즉시 페인트된다.
 */
export default function TransitionToBe() {
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const deferredQuery = useDeferredValue(query)
  const { mark, measure, el } = useKeyToPaint()

  // deferredQuery가 바뀌는 transition 렌더에서만 재계산/재렌더된다.
  const filtered = useMemo(() => filterItems(deferredQuery), [deferredQuery])
  // 리스트가 아직 옛 결과를 보여주는 중이면 dim 처리 (시각적 "부분 콘텐츠" 단계)
  const stale = isPending || deferredQuery !== text

  useFilterAppliedStage(filtered.length)
  useEffect(() => {
    measure() // urgent 커밋(입력 글자만) 직후의 페인트까지 측정 — 리스트를 기다리지 않는다
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DemoLayout
      title="검색 필터 — 전환으로 분리된 입력"
      strategy="useTransition + useDeferredValue + memo"
      kind="to-be"
      pairHref="#/transition/as-is"
      description="같은 20,000개 아이템·같은 필터지만, 리스트 갱신을 transition으로 격하해 입력 렌더와 분리했다. React가 리스트 렌더를 백그라운드에서 진행하다가 새 키 입력이 오면 중단하고 입력부터 그린다. 리스트가 갱신되는 동안에는 이전 결과를 dim 처리해 '처리 중'임을 보여준다."
      observe={[
        'worst-interaction — as-is보다 확연히 낮게 유지된다 (입력이 리스트를 기다리지 않음)',
        'long-tasks — 리스트 렌더 자체는 여전히 무거우므로 완전히 사라지진 않는다 (트레이드오프)',
        'filter-applied — as-is와 동일한 결과 건수 (같은 데이터, 같은 필터임을 확인)',
        '화면의 "입력 반응 지연(keydown→paint)" 숫자 — 리스트와 무관하게 수~수십 ms에 머문다',
      ]}
      wikiRef="08-client-rendering-optimizations.md"
    >
      <div className="card">
        <input
          className="demo-input"
          value={text}
          placeholder="지역/이름으로 검색 (예: 강남, 부스, 라운지)…"
          onKeyDown={mark}
          onChange={(e) => {
            const v = e.target.value
            setText(v) // urgent: 입력 글자는 즉시
            startTransition(() => setQuery(v)) // transition: 리스트는 중단 가능하게
          }}
        />
        <div className="metric-row big-metric">
          <span>
            입력 반응 지연(keydown→paint): <span className="big-num" ref={el}>–</span>
          </span>
          <span className="hint">결과 {filtered.length.toLocaleString()}건 / 전체 20,000건</span>
          {stale && <span className="pending-tag">리스트 갱신 중… (이전 결과 dim 표시)</span>}
        </div>
      </div>
      <div className={`tr-list${stale ? ' list-dim' : ''}`}>
        <ItemList items={filtered} />
      </div>
    </DemoLayout>
  )
}
