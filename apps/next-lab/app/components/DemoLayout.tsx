import Link from 'next/link'
import type { ReactNode } from 'react'
import { MirrorLink } from './MirrorLink'

// 서버/클라이언트 어느 트리에서든 쓸 수 있도록 훅 없이 작성한 공용 데모 프레임.
// 모든 데모 페이지는 이 컴포넌트로 감싸 "무엇을 왜 관찰하는지"를 상단에 노출한다.

export type DemoKind = 'as-is' | 'to-be' | 'variant'

interface DemoLayoutProps {
  title: string
  /** 전략명 (예: "CSR — 클라이언트 fetch") */
  strategy: string
  kind: DemoKind
  /** 반대편(짝) 데모 경로 */
  pairHref: string
  /** 다른 프레임워크(start-lab 등)의 대응 데모 절대 URL */
  mirrorHref?: string
  /** 이 시나리오에서 왜 이 전략인지 (2~4문장) */
  description: string
  /** 관찰 포인트 — 어떤 HUD 단계를 보고 무엇을 기대할지 */
  observe: string[]
  /** docs/wiki 파일명 */
  wikiRef: string
  children: ReactNode
}

const KIND_LABEL: Record<DemoKind, string> = {
  'as-is': 'AS-IS',
  'to-be': 'TO-BE',
  variant: 'VARIANT',
}

const PAIR_LABEL: Record<DemoKind, string> = {
  'as-is': '개선안(to-be) 보러가기 →',
  'to-be': '← 비교 기준(as-is) 보러가기',
  variant: '다음 모드 보러가기 →',
}

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
  return (
    <main className="demo">
      <section className={`demo-info kind-${kind}`}>
        <div>
          <span className={`badge badge-${kind}`}>{KIND_LABEL[kind]}</span>{' '}
          <span className="strategy">{strategy}</span>
        </div>
        <h1>{title}</h1>
        <p className="demo-desc">{description}</p>
        <div className="observe">
          <h2>관찰 포인트 — 우하단 PerfHUD를 펼쳐서 확인</h2>
          <ul>
            {observe.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
        <div className="demo-links">
          <Link className="pair-link" href={pairHref}>
            {PAIR_LABEL[kind]}
          </Link>
          {mirrorHref && <MirrorLink href={mirrorHref} label="start-lab의 대응 데모 ↗" />}
          <Link href="/">카탈로그로</Link>
          <span className="wiki-ref">문서: docs/wiki/{wikiRef}</span>
        </div>
      </section>
      {children}
    </main>
  )
}
