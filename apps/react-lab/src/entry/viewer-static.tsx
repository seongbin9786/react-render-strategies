import { useEffect, useMemo, useRef } from 'react'
import { marked } from 'marked'
// as-is의 핵심: highlight.js "전체 언어 등록판"을 정적 import.
// 뷰어를 한 번도 열지 않는 사용자도 이 코드를 전부 다운로드/평가하게 된다.
import hljs from 'highlight.js'
import { perfStage } from '@renderlab/perf'
import type { Doc } from './docs'

/** 문서 뷰어 (정적 import판) — 마크업/동작은 to-be의 viewer-lazy와 완전히 동일 */
export function ViewerStatic({ doc }: { doc: Doc }) {
  const ref = useRef<HTMLDivElement | null>(null)
  // DOCS는 우리가 작성한 정적 콘텐츠 상수 — 외부/사용자 입력이 아니므로 innerHTML 사용이 허용된다.
  const html = useMemo(() => marked.parse(doc.body, { async: false }), [doc])

  useEffect(() => {
    ref.current?.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el as HTMLElement))
    perfStage('editor-ready', { detail: `"${doc.title}" 렌더 + 하이라이트 완료` })
  }, [doc])

  return <div ref={ref} className="doc-view" dangerouslySetInnerHTML={{ __html: html }} />
}
