'use client'

// AS-IS: 마크다운 파서(marked) + 하이라이터(highlight.js 전체 언어팩)를
// 클라이언트 번들에 실어, 문서 30개를 브라우저에서 파싱/하이라이트한다.
// 번들이 무거워져 js-eval → hydrated 간격이 벌어지고, 파싱 작업이 long-tasks로 잡힌다.

import { useEffect, useState } from 'react'
import { getApiDelay, perfStage } from '@renderlab/perf'
import { getDocs } from '../../lib/docs'
import { renderDocs, type RenderedDoc } from '../../lib/render-docs' // ← marked + hljs 전체가 이 페이지 번들에 포함된다
import { DemoLayout } from '../../components/DemoLayout'

const COUNT = 30

function SkeletonDocs() {
  return (
    <div className="doc-list">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="doc skeleton-doc" aria-hidden="true">
          <div className="skeleton-block line-lg" style={{ marginBottom: 12 }} />
          <div className="skeleton-block line-sm" style={{ marginBottom: 8 }} />
          <div className="skeleton-block line-sm" style={{ marginBottom: 8 }} />
          <div className="skeleton-block line-xs" />
        </div>
      ))}
    </div>
  )
}

export default function RscPayloadAsIsPage() {
  const [docs, setDocs] = useState<RenderedDoc[] | null>(null)

  useEffect(() => {
    let cancelled = false
    perfStage('data-requested', { detail: `문서 ${COUNT}건 로드 시작 (delay=${getApiDelay()}ms)` })
    getDocs({ delay: getApiDelay(), count: COUNT }).then((raw) => {
      if (cancelled) return
      perfStage('data-received', { detail: `마크다운 ${raw.length}건 수신 — 이제 클라이언트에서 파싱/하이라이트` })
      // 메인스레드에서 동기 실행 — 이 비용이 long-tasks로 HUD에 잡힌다.
      const rendered = renderDocs(raw)
      setDocs(rendered)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (docs) {
      perfStage('content-rendered', { detail: `문서 ${docs.length}건 렌더 커밋 완료 (클라이언트 파싱)` })
    }
  }, [docs])

  return (
    <DemoLayout
      title="이용 가이드 문서 30건 — 클라이언트에서 파싱·하이라이트"
      strategy="클라이언트 렌더 — 'use client' + marked + highlight.js 전체 import"
      kind="as-is"
      pairHref="/rsc-payload/to-be"
      description="마크다운 문서 뷰어를 통째로 클라이언트 컴포넌트로 만들었다. marked와 highlight.js(전체 언어팩)가 First Load JS에 포함되어 다운로드·파싱·실행 비용을 모든 방문자가 지불하고, 문서 30건의 파싱·하이라이트도 사용자의 메인스레드에서 돈다. 표시용(읽기 전용) 콘텐츠인데도 무거운 라이브러리가 번들에 실리는 전형적인 안티패턴."
      observe={[
        'js-eval → hydrated 간격이 to-be보다 크다 — 하이라이터까지 포함된 번들 평가 비용',
        'data-received → content-rendered 사이가 클라이언트 파싱 구간 — long-tasks가 여기서 쌓인다',
        '빌드 출력의 First Load JS를 to-be와 비교 (to-be 페이지에 실측치 표 있음)',
        'DevTools Network에서 이 페이지 청크 크기를 직접 확인해 보자',
      ]}
      wikiRef="06-rsc.md"
    >
      <section className="section">
        <h2>가이드 문서 {COUNT}건</h2>
        <p className="section-sub">로딩 중에는 스켈레톤 — 파싱이 끝나야 문서가 나타난다.</p>
        {docs ? (
          <div className="doc-list">
            {docs.map((d) => (
              // 자체 생성한 결정적 mock 마크다운의 렌더 결과만 주입한다 (외부/사용자 입력 없음).
              <article key={d.id} className="doc" dangerouslySetInnerHTML={{ __html: d.html }} />
            ))}
          </div>
        ) : (
          <SkeletonDocs />
        )}
      </section>
    </DemoLayout>
  )
}
