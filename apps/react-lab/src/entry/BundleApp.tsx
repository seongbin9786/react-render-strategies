import { Suspense, useState, type ComponentType } from 'react'
import { perfStage } from '@renderlab/perf'
import { DemoLayout } from '../components/DemoLayout'
import { DOCS, type Doc } from './docs'

interface BundleAppProps {
  kind: 'as-is' | 'to-be'
  title: string
  strategy: string
  pairHref: string
  description: string
  observe: string[]
  /** 문서 뷰어 구현체 — as-is는 정적 import판, to-be는 React.lazy판 */
  Viewer: ComponentType<{ doc: Doc }>
  /** 빌드 후 실측한 초기 JS 크기 문구 (bundle-sizes.ts) */
  sizeNote: string
}

/**
 * 번들 분할 데모의 공용 셸 — as-is/to-be가 완전히 동일한 UI/데이터/단계 이름을 쓰고
 * "뷰어 코드가 언제 로드되는가"만 다르게 한다.
 * 초기 화면: 문서 목록 + 첫 문서(마크다운 원문 일부)만. "하이라이트 보기"로 뷰어 오픈.
 */
export function BundleApp({ kind, title, strategy, pairHref, description, observe, Viewer, sizeNote }: BundleAppProps) {
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState(false)
  const doc = DOCS[current]

  const openViewer = () => {
    // 쌍 공통 커스텀 단계: editor-requested → (뷰어 준비 완료 시) editor-ready
    perfStage('editor-requested', { detail: '하이라이트 보기 클릭', snapshot: false })
    setOpen(true)
  }

  return (
    <>
      <header className="topbar">
        <a className="brand" href="./">
          renderlab · <em>react-lab</em>
        </a>
        <nav>
          <a href="./">← SPA 홈(카탈로그)</a>
          <a href="./bundle-as-is.html">bundle as-is</a>
          <a href="./bundle-to-be.html">bundle to-be</a>
        </nav>
      </header>
      <main className="container">
        <DemoLayout
          title={title}
          strategy={strategy}
          kind={kind}
          pairHref={pairHref}
          description={description}
          observe={observe}
          wikiRef="08-client-rendering-optimizations.md · 02-csr.md"
        >
          <div className="bundle-grid">
            <aside className="card doc-list">
              {DOCS.map((d, i) => (
                <button
                  key={d.id}
                  className={i === current ? 'active' : ''}
                  onClick={() => setCurrent(i)}
                  title={d.summary}
                >
                  {d.title}
                </button>
              ))}
            </aside>
            <section className="card doc-main">
              <h2>{doc.title}</h2>
              <p className="hint">{doc.summary}</p>
              {!open ? (
                <>
                  <pre className="doc-raw">{doc.body.slice(0, 420)}…</pre>
                  <button className="primary-btn" onClick={openViewer}>
                    하이라이트 보기
                  </button>
                  <p className="hint">
                    뷰어를 열기 전에는 마크다운 원문 일부만 보입니다. 버튼을 누르는 순간이{' '}
                    <code>editor-requested</code>, 하이라이트 완료가 <code>editor-ready</code>입니다.
                  </p>
                </>
              ) : (
                <Suspense fallback={<div className="skeleton doc-skeleton">뷰어 코드(청크) 로딩 중…</div>}>
                  <Viewer doc={doc} />
                </Suspense>
              )}
            </section>
          </div>
          <footer className="size-note">📦 빌드 실측 초기 JS: {sizeNote}</footer>
        </DemoLayout>
      </main>
    </>
  )
}
