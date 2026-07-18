'use client'
import { useEffect, useState } from 'react'

// 다른 프레임워크(start-lab 등)의 대응 데모 링크.
// mirrorHref는 localhost 기준 절대 URL로 들어오지만, RN WebView나 다른 기기에서
// LAN IP로 접속한 경우 localhost는 그 기기 자신을 가리켜 끊어진다.
// 마운트 후 현재 접속 호스트네임으로 재작성한다 (포트는 mirrorHref의 것을 유지).
export function MirrorLink({ href, label }: { href: string; label: string }) {
  const [resolved, setResolved] = useState(href)
  useEffect(() => {
    try {
      const u = new URL(href)
      u.hostname = window.location.hostname
      setResolved(u.toString())
    } catch {
      /* href가 절대 URL이 아니면 그대로 둔다 */
    }
  }, [href])
  return (
    <a href={resolved} target="_blank" rel="noreferrer">
      {label}
    </a>
  )
}
