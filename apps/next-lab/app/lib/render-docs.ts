import { Marked } from 'marked'
import hljs from 'highlight.js' // 전체 import — 모든 언어 포함 (의도적으로 무겁다)
import type { DemoDoc } from './docs'

// 마크다운 → HTML(+hljs 하이라이트) 렌더러.
// rsc-payload 쌍의 핵심: 이 모듈을 "어디서 실행하느냐"가 유일한 차이다.
//  - as-is: 'use client' 페이지가 import → marked + highlight.js 전체가 클라이언트 번들에 포함
//  - to-be: 서버 컴포넌트가 import → 클라이언트 번들에 하이라이터가 전혀 실리지 않음

const marked = new Marked({
  gfm: true,
})

marked.use({
  renderer: {
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
      const value = hljs.highlight(text, { language }).value
      return `<pre><code class="hljs language-${language}">${value}</code></pre>`
    },
  },
})

export interface RenderedDoc {
  id: number
  title: string
  html: string
}

/** 문서 1건을 HTML로 렌더 (동기 — 클라이언트에서 실행하면 메인스레드를 그만큼 점유한다) */
export function renderDocHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string
}

export function renderDocs(docs: DemoDoc[]): RenderedDoc[] {
  return docs.map((d) => ({ id: d.id, title: d.title, html: renderDocHtml(d.markdown) }))
}
