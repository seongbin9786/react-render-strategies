// 'use client' 없음 — 서버 컴포넌트(RSC)와 SSR 스트림 안에서 직접 렌더 가능해야 한다.
// 렌더 결과는 인라인 <script>이며, 브라우저 HTML 파서가 이 지점을 만나는 순간
// (hydration 이전!) STREAM_BOOTSTRAP이 시각 + DOM 스냅샷을 기록한다.
export function StreamMark({ name }: { name: string }) {
  // name은 데모 코드의 상수만 사용한다. 방어적으로 '<'를 이스케이프해 </script> 탈출을 차단.
  const safe = JSON.stringify(name).replace(/</g, '\\u003c')
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__rlStreamMark&&window.__rlStreamMark(${safe})`,
      }}
    />
  )
}
