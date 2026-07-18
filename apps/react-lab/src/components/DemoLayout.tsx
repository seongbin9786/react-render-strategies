import type { ReactNode } from 'react'

function rewriteMirror(href: string): string {
  if (typeof window === 'undefined') return href
  try {
    const u = new URL(href)
    u.hostname = window.location.hostname
    return u.toString()
  } catch {
    return href
  }
}

export interface DemoLayoutProps {
  /** 데모 제목 */
  title: string
  /** 전략명 (예: "useTransition + useDeferredValue") */
  strategy: string
  /** as-is(문제 재현) | to-be(개선) | variant(변형) */
  kind: 'as-is' | 'to-be' | 'variant'
  /** 짝(반대편) 데모 링크 — SPA 내부는 "#/...", 별도 엔트리는 "./xxx.html" */
  pairHref: string
  /** 다른 프레임워크(next-lab/start-lab)의 대응 데모 절대 URL (있을 때만) */
  mirrorHref?: string
  /** 이 시나리오에서 왜 이 전략인지 2~4문장 */
  description: string
  /** 관찰 포인트 — 어떤 HUD 단계를 보고 무엇을 기대할지 */
  observe: string[]
  /** docs/wiki 참고 문서 파일명 */
  wikiRef: string
  children: ReactNode
}

/**
 * 모든 데모 페이지를 감싸는 공용 레이아웃.
 * 상단에 "무엇을/왜/어떻게 관찰하는지"를 눈에 띄는 정보 박스로 렌더해서
 * 데모를 처음 여는 사람도 HUD의 어느 숫자를 봐야 하는지 바로 알 수 있게 한다.
 */
export function DemoLayout({
  title,
  strategy,
  kind,
  pairHref,
  mirrorHref,
  description,
  observe,
  wikiRef,
  children,
}: DemoLayoutProps) {
  const pairLabel =
    kind === 'as-is' ? '개선판(to-be) 보기 →' : kind === 'to-be' ? '← 문제판(as-is) 보기' : '기준 데모 보기'
  return (
    <section>
      <div className={`demo-info kind-${kind}`}>
        <div className="demo-info-head">
          <span className={`badge badge-${kind}`}>{kind.toUpperCase()}</span>
          <h1>{title}</h1>
          <span className="strategy-chip">{strategy}</span>
        </div>
        <p className="demo-desc">{description}</p>
        <div className="observe-title">👀 관찰 포인트 (우하단 PerfHUD를 펼쳐서 보세요)</div>
        <ul className="observe">
          {observe.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <div className="demo-links">
          <a className="pair-link" href={pairHref}>
            {pairLabel}
          </a>
          {mirrorHref && (
            // CSR 전용 앱이라 렌더 시점에 바로 재작성해도 hydration 불일치가 없다.
            // localhost 하드코딩 URL을 현재 접속 호스트네임으로 바꿔 LAN/웹뷰에서도 살아있게 한다.
            <a href={rewriteMirror(mirrorHref)} target="_blank" rel="noreferrer">
              다른 프레임워크의 대응 데모 ↗
            </a>
          )}
          <span className="wiki-ref">📚 wiki: {wikiRef}</span>
        </div>
      </div>
      <div className="demo-body">{children}</div>
    </section>
  )
}
