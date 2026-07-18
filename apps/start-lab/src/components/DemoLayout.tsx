// 모든 데모 페이지를 감싸는 정보 박스 레이아웃.
// 어떤 전략(strategy)의 어느 편(kind)인지, 무엇을 관찰해야 하는지(observe),
// 반대편(pairHref)·다른 프레임워크 대응 데모(mirrorHref)·위키 문서(wikiRef)를 한눈에 보여준다.
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'

// mirrorHref는 localhost 기준 절대 URL이지만, RN WebView 등에서 LAN IP로 접속하면
// localhost는 그 기기 자신이라 끊어진다. 마운트 후 현재 호스트네임으로 재작성한다.
// (초기 렌더는 원본 그대로 → SSR/hydration 불일치 없음)
function useMirrorHref(href?: string): string | undefined {
  const [resolved, setResolved] = useState(href)
  useEffect(() => {
    if (!href) return
    try {
      const u = new URL(href)
      u.hostname = window.location.hostname
      setResolved(u.toString())
    } catch {
      setResolved(href)
    }
  }, [href])
  return resolved
}

export interface DemoLayoutProps {
  title: string
  /** 전략명 (예: "라우트 loader SSR") */
  strategy: string
  kind: 'as-is' | 'to-be' | 'variant'
  /** 짝(반대편) 데모 경로 — 전체 리로드로 이동해 처음부터 다시 측정한다 */
  pairHref: string
  /** 다른 프레임워크(next-lab)의 대응 데모 절대 URL */
  mirrorHref?: string
  /** 이 시나리오에서 왜 이 전략인지 2~4문장 */
  description: string
  /** 관찰 포인트 — 어떤 HUD 단계를 보고 무엇을 기대할지 */
  observe: string[]
  /** docs/wiki 파일명 */
  wikiRef: string
  pairLabel?: string
  children: ReactNode
}

const KIND_LABEL: Record<DemoLayoutProps['kind'], string> = {
  'as-is': 'as-is · 흔한 방식',
  'to-be': 'to-be · 개선 방식',
  variant: 'variant · 모드 비교',
}

export function DemoLayout(props: DemoLayoutProps) {
  const loc = useLocation()
  const mirrorHref = useMirrorHref(props.mirrorHref)
  // 현재 ?apiDelay= 프리셋을 유지한 채 짝 데모로 이동한다.
  const qs = loc.searchStr ? (loc.searchStr.startsWith('?') ? loc.searchStr : `?${loc.searchStr}`) : ''

  return (
    <div className="page">
      <div className={`demo-info kind-${props.kind}`}>
        <div>
          <span className={`badge badge-${props.kind}`}>{KIND_LABEL[props.kind]}</span>
          <span className="badge badge-strategy">전략: {props.strategy}</span>
          <span className="badge badge-wiki" title="관련 위키 문서">
            wiki: {props.wikiRef}
          </span>
        </div>
        <h1>{props.title}</h1>
        <p className="demo-desc">{props.description}</p>
        <div className="demo-observe">
          <b>관찰 포인트 — 우하단 PerfHUD를 펼쳐서 보세요</b>
          <ul>
            {props.observe.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
        <div className="demo-links">
          <a className="btn" href={props.pairHref + qs} title="전체 리로드로 이동해 처음부터 다시 측정합니다">
            {props.pairLabel ?? (props.kind === 'as-is' ? 'to-be(개선안) 보기 →' : '← as-is(비교 대상) 보기')}
          </a>
          {mirrorHref && (
            <a className="btn btn-ghost" href={mirrorHref} target="_blank" rel="noreferrer">
              next-lab 대응 데모 ↗
            </a>
          )}
          <Link className="btn btn-ghost" to="/">
            카탈로그로
          </Link>
        </div>
      </div>
      {props.children}
    </div>
  )
}
