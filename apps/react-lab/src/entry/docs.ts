// 코드 하이라이트 문서 뷰어의 문서들 — 우리가 작성한 정적 콘텐츠만 사용한다.
// (marked 렌더 결과를 dangerouslySetInnerHTML로 넣는 것이 허용되는 이유)

export interface Doc {
  id: string
  title: string
  summary: string
  body: string
}

export const DOCS: Doc[] = [
  {
    id: 'code-splitting',
    title: '번들 분할이 왜 필요한가',
    summary: 'CSR에서 초기 JS 총량은 곧 "빈 화면의 길이"다. 안 쓰는 코드를 초기 번들에서 빼는 법.',
    body: `# 번들 분할이 왜 필요한가

CSR 앱에서 사용자는 **JS 다운로드 → 파싱/평가 → 렌더**가 모두 끝나야 화면을 본다.
즉 초기 번들 크기는 곧 빈 화면(white screen)의 길이다.

> 이 문서 뷰어의 as-is는 marked + highlight.js(전체 언어)를 엔트리에서 정적 import한다.
> 뷰어를 열지 않아도 그 코드 전부를 다운로드/평가한 뒤에야 첫 화면이 뜬다.

## 정적 import — 전부 초기 번들에 포함

\`\`\`typescript
// as-is: 쓰지 않을 수도 있는 무거운 라이브러리가 초기 경로에 들어간다
import { marked } from 'marked'
import hljs from 'highlight.js' // 190+ 언어 전부 포함

export function Viewer({ md }: { md: string }) {
  return <div dangerouslySetInnerHTML={{ __html: marked.parse(md) }} />
}
\`\`\`

## dynamic import — 클릭 시점에 로드

\`\`\`typescript
// to-be: 뷰어 청크는 "하이라이트 보기"를 누른 순간에야 네트워크를 탄다
const Viewer = React.lazy(() => import('./viewer-lazy'))

// viewer-lazy.ts 안에서는 코어 + 필요한 언어만 등록한다
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
hljs.registerLanguage('javascript', javascript)
\`\`\`

## 판단 기준

- 첫 화면에 반드시 필요한 코드인가? 아니면 특정 인터랙션 이후에만 필요한가?
- 분할하면 "클릭 → 사용 가능"에 네트워크 왕복이 생긴다. HUD의 editor-requested → editor-ready 간격이 그 비용이다.
`,
  },
  {
    id: 'csr-tradeoff',
    title: 'CSR의 트레이드오프',
    summary: '서버 없이 어디서나 배포되는 대신, 첫 화면과 SEO를 JS에 전부 의존한다.',
    body: `# CSR의 트레이드오프

CSR(Client-Side Rendering)은 서버가 빈 HTML 셸만 주고, 화면 전부를 브라우저 JS가 그린다.

## 장점

- 정적 호스팅/웹뷰 어디서나 배포 가능 — 서버 런타임이 필요 없다
- 라우트 전환이 전부 클라이언트에서 일어나 앱처럼 느껴진다

## 단점

\`\`\`html
<!-- 서버가 주는 것의 전부. FCP는 JS 로드+평가+렌더 이후로 밀린다 -->
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
\`\`\`

- 첫 화면이 번들 크기에 비례해 늦어진다 → 그래서 이 랩의 번들 분할 데모가 존재한다
- HUD의 hydrated는 SSR의 수화가 아니라 "첫 mount 완료"다 — 그 전까지는 빈 화면이다

## 이 랩에서 확인할 것

\`\`\`javascript
// bundle-as-is.html vs bundle-to-be.html에서 각각 실행해 비교해 보라
performance.getEntriesByType('resource')
  .filter((r) => r.name.endsWith('.js'))
  .reduce((sum, r) => sum + r.transferSize, 0)
\`\`\`
`,
  },
  {
    id: 'measure',
    title: '측정 없이 최적화 없다',
    summary: '체감이 아니라 숫자로: 이 랩의 HUD 단계들을 읽는 법.',
    body: `# 측정 없이 최적화 없다

최적화는 "느낌"이 아니라 계측으로 검증한다. 이 랩의 PerfHUD가 모든 페이지에서 수집하는 단계:

| 단계 | 의미 |
| --- | --- |
| fcp | 처음으로 뭔가 화면에 뜬 시각 |
| js-eval | 클라이언트 번들 평가 시작 |
| hydrated | (CSR에서는) 첫 mount 완료 |
| long-tasks | 50ms+ 메인스레드 블로킹 누적 |
| worst-interaction | 최악 입력 반응(INP 근사) |

## 커스텀 단계 — 쌍끼리 같은 이름

\`\`\`typescript
import { perfStage } from '@renderlab/perf'

// 번들 데모: as-is/to-be가 완전히 같은 이름을 쓴다
perfStage('editor-requested', { detail: '하이라이트 보기 클릭' })
perfStage('editor-ready', { detail: '뷰어 렌더 + 하이라이트 완료' })
\`\`\`

as-is에서는 editor-requested → editor-ready가 거의 0ms(코드가 이미 번들에 있으므로),
to-be에서는 청크 다운로드+평가 시간만큼 벌어진다. 대신 to-be는 초기 js-eval~fcp가 훨씬 빠르다.
**어느 쪽이 이득인지는 "뷰어를 여는 사용자 비율"이 결정한다** — 이것이 번들 분할의 본질이다.
`,
  },
]
