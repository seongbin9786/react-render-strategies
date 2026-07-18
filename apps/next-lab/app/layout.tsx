import type { Metadata } from 'next'
import Link from 'next/link'
import { PerfHUD, HydrationMarker, STREAM_BOOTSTRAP } from '@renderlab/perf'
import './globals.css'

export const metadata: Metadata = {
  title: 'next-lab — Next.js 렌더링 전략 실험실',
  description:
    'Next.js 15 App Router의 렌더링 전략(CSR/SSR/스트리밍/SSG/ISR/RSC)을 as-is/to-be 쌍으로 체감·계측하는 학습용 랩',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* StreamMark(스트리밍 청크 도착 계측)가 동작하려면 문서 최상단에 인라인되어야 한다.
            우리가 작성한 정적 상수만 주입하므로 안전하다. */}
        <script dangerouslySetInnerHTML={{ __html: STREAM_BOOTSTRAP }} />
      </head>
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            renderlab <span className="brand-app">/ next-lab</span>
          </Link>
          <nav>
            <Link href="/csr-vs-ssr/as-is">CSR vs SSR</Link>
            <Link href="/blocking-vs-streaming/as-is">Blocking vs Streaming</Link>
            <Link href="/rendering-modes">SSR·SSG·ISR</Link>
            <Link href="/rsc-payload/as-is">RSC Payload</Link>
            <Link href="/prefetch-cache/as-is">Prefetch·Router Cache</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          renderlab · 모든 데모 우하단의 PerfHUD로 단계 타임라인과 스냅샷을 확인하세요. 같은 시나리오의 TanStack Start
          구현은 <a href="http://localhost:3001">start-lab(:3001)</a>에 있습니다.
        </footer>
        <HydrationMarker />
        <PerfHUD app="next-lab" />
      </body>
    </html>
  )
}
