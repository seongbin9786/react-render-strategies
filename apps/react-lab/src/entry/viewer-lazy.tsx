import { useEffect, useMemo, useRef } from 'react'
import { marked } from 'marked'
// to-be의 핵심: 코어 + 실제로 쓰는 언어 3개만 등록한다.
// 이 모듈 자체가 React.lazy(dynamic import)로만 로드되므로,
// marked/hljs는 "하이라이트 보기"를 누르기 전까지 네트워크를 타지 않는다.
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import { perfStage } from '@renderlab/perf'
import type { Doc } from './docs'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml) // html 코드 펜스용

/** 문서 뷰어 (lazy판) — 마크업/동작은 as-is의 viewer-static과 완전히 동일 */
export default function ViewerLazy({ doc }: { doc: Doc }) {
  const ref = useRef<HTMLDivElement | null>(null)
  // DOCS는 우리가 작성한 정적 콘텐츠 상수 — 외부/사용자 입력이 아니므로 innerHTML 사용이 허용된다.
  const html = useMemo(() => marked.parse(doc.body, { async: false }), [doc])

  useEffect(() => {
    ref.current?.querySelectorAll('pre code').forEach((el) => hljs.highlightElement(el as HTMLElement))
    perfStage('editor-ready', { detail: `"${doc.title}" 렌더 + 하이라이트 완료` })
  }, [doc])

  return <div ref={ref} className="doc-view" dangerouslySetInnerHTML={{ __html: html }} />
}
