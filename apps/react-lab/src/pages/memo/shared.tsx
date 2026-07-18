import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { generateSpaces, type StudySpace } from '@renderlab/mock-data'

// 카드 500개 — 모듈 레벨 상수라서 as-is/to-be 모두 "객체 참조까지 동일한" 데이터를 쓴다.
// (to-be의 memo가 props 얕은 비교를 통과하려면 space 참조가 안정적이어야 한다.)
export const CARDS: StudySpace[] = generateSpaces(500)

/** 이번 커밋에서 몇 개의 카드가 실제로 렌더 함수를 실행했는지 세는 계측용 카운터 */
export interface Tally {
  renders: number
}

interface CardProps {
  space: StudySpace
  tally: Tally
  onPick: (name: string) => void
}

/**
 * 카드 1장. 렌더될 때마다:
 *  1) tally.renders++ (페이지 상단의 "이번 입력으로 리렌더된 카드 수" 집계)
 *  2) 자기 렌더 카운트 표시
 *  3) 배경 플래시 (리렌더가 눈에 보이게)
 * as-is는 이 컴포넌트를 그대로, to-be는 memo(CardView)를 쓴다 — 마크업은 완전히 동일.
 */
export function CardView({ space, tally, onPick }: CardProps) {
  tally.renders++ // 계측용 부수효과 (StrictMode 미사용 전제 — main.tsx 주석 참고)
  const renders = useRef(0)
  renders.current++
  const el = useRef<HTMLDivElement | null>(null)

  // deps 없는 useLayoutEffect = "이 컴포넌트가 리렌더된 모든 커밋"에서 실행 → 플래시 재시작
  useLayoutEffect(() => {
    const node = el.current
    if (!node) return
    node.classList.remove('card-flash')
    void node.offsetWidth // reflow로 애니메이션 리셋
    node.classList.add('card-flash')
  })

  return (
    <div ref={el} className="mcard" onClick={() => onPick(space.name)}>
      <div className="mcard-name">{space.name}</div>
      <div className="mcard-meta">
        {space.region} · {space.pricePerHour.toLocaleString()}원
      </div>
      <div className="mcard-count">렌더 {renders.current}회</div>
    </div>
  )
}

export const MemoCardView = memo(CardView)

/**
 * memo 데모 본문 — as-is/to-be가 동일한 화면 구성을 쓰도록 공용화.
 * memoized=false: 카드 비(非)memo + onPick을 렌더마다 새로 만드는 인라인 함수 (전형적 as-is)
 * memoized=true : memo(CardView) + useCallback으로 안정화한 onPick
 */
export function MemoBoard({ memoized }: { memoized: boolean }) {
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const tally = useRef<Tally>({ renders: 0 }).current
  const lastTally = useRef(0)
  const countEl = useRef<HTMLSpanElement | null>(null)

  // 부모가 커밋될 때마다 "직전 커밋에서 렌더된 카드 수"를 집계해 DOM에 직접 쓴다.
  // (setState로 표시하면 그 자체가 추가 렌더를 만들어 숫자를 오염시키므로)
  useEffect(() => {
    const delta = tally.renders - lastTally.current
    lastTally.current = tally.renders
    if (countEl.current) countEl.current.textContent = delta.toLocaleString()
  })

  const stablePick = useCallback((name: string) => setPicked(name), [])
  const Card = memoized ? MemoCardView : CardView
  // as-is: 렌더마다 새 함수 → 설령 memo를 붙여도 깨질 props. to-be: useCallback으로 안정.
  const onPick = memoized ? stablePick : (name: string) => setPicked(name)

  return (
    <>
      <div className="card">
        <input
          className="demo-input"
          value={text}
          placeholder="여기에 타이핑 — 카드가 주황색으로 깜빡이면 리렌더된 것"
          onChange={(e) => setText(e.target.value)}
        />
        <div className="metric-row big-metric">
          <span>
            이번 입력으로 리렌더된 카드 수: <span className="big-num" ref={countEl}>–</span>
            <span className="hint"> / 500</span>
          </span>
          {picked && <span className="hint">마지막 클릭: {picked}</span>}
        </div>
        <p className="hint">
          카드를 클릭해도 같은 원리다 — 부모 상태(picked)가 바뀔 때 몇 장이 리렌더되는지 보라. 입력창의 글자 수:{' '}
          {text.length}
        </p>
      </div>
      <div className="mgrid">
        {CARDS.map((s) => (
          <Card key={s.id} space={s} tally={tally} onPick={onPick} />
        ))}
      </div>
    </>
  )
}
