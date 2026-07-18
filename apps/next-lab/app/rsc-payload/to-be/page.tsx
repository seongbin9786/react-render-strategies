// TO-BE: 같은 문서 30건을 "서버 컴포넌트"에서 marked + highlight.js로 렌더해
// 완성된 HTML만 전송한다. 클라이언트 번들에는 하이라이터가 전혀 실리지 않는다.
// RSC의 핵심 가치: 무거운 표시용 의존성을 서버에 남긴다.

import { StreamMark, StageMark } from '@renderlab/perf'
import { parseDelay } from '@renderlab/mock-data'
import { getDocs } from '../../lib/docs'
import { renderDocs } from '../../lib/render-docs' // ← 서버에서만 실행 — 클라이언트 번들 미포함
import { DemoLayout } from '../../components/DemoLayout'

const COUNT = 30

// 빌드 출력(next build)에서 확인한 First Load JS 실측치.
// 번들이 바뀌면 npm run build 후 이 표를 갱신한다.
const MEASURED = {
  asIs: '431 kB (페이지 청크 320 kB)',
  toBe: '111 kB (페이지 청크 204 B)',
}

export default async function RscPayloadToBePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const delay = parseDelay(sp.apiDelay)
  const raw = await getDocs({ delay, count: COUNT })
  const docs = renderDocs(raw) // 서버에서 파싱·하이라이트 완료

  return (
    <DemoLayout
      title="이용 가이드 문서 30건 — 서버에서 파싱·하이라이트"
      strategy="서버 컴포넌트 렌더 — marked + highlight.js는 서버에만 존재"
      kind="to-be"
      pairHref="/rsc-payload/as-is"
      description="as-is와 완전히 같은 문서 30건, 같은 marked + highlight.js 코드지만 실행 위치가 서버 컴포넌트다. 브라우저는 하이라이트가 끝난 HTML을 받기만 하므로 First Load JS에서 파서·하이라이터가 통째로 빠지고, 30건 파싱 비용도 사용자 기기에서 사라진다. 대신 HTML/RSC 페이로드는 커진다 — JS 번들 대 마크업의 트레이드오프를 눈으로 확인하자."
      observe={[
        'js-eval → hydrated 간격이 as-is보다 짧다 — 번들에서 marked/hljs가 빠졌기 때문',
        'long-tasks가 as-is 대비 크게 줄어든다 — 파싱이 서버에서 끝났다',
        'stream:content(HTML 파서 도달)가 hydration 이전에 찍힌다 — 콘텐츠는 JS 없이도 이미 완성',
        `First Load JS 실측치 — as-is: ${MEASURED.asIs} vs to-be: ${MEASURED.toBe} (아래 표)`,
      ]}
      wikiRef="06-rsc.md"
    >
      <div className="note">
        <h3>First Load JS 실측치 (next build 출력)</h3>
        <ul>
          <li>
            /rsc-payload/as-is (클라이언트 렌더): <b>{MEASURED.asIs}</b>
          </li>
          <li>
            /rsc-payload/to-be (서버 렌더): <b>{MEASURED.toBe}</b>
          </li>
        </ul>
        같은 화면인데 클라이언트가 내려받는 JS 크기가 이만큼 다르다. 차이의 대부분이 highlight.js 전체 언어팩 +
        marked이다.
      </div>
      <section className="section">
        <h2>가이드 문서 {COUNT}건</h2>
        <p className="section-sub">이 문서들은 서버에서 하이라이트까지 끝난 HTML로 도착했다.</p>
        <div className="doc-list">
          {docs.map((d) => (
            // 자체 생성한 결정적 mock 마크다운의 렌더 결과만 주입한다 (외부/사용자 입력 없음).
            <article key={d.id} className="doc" dangerouslySetInnerHTML={{ __html: d.html }} />
          ))}
        </div>
        <StreamMark name="content" />
        <StageMark name="content-rendered" detail={`문서 ${COUNT}건 hydrate 완료 (서버 렌더 HTML은 이미 표시된 상태)`} />
      </section>
    </DemoLayout>
  )
}
