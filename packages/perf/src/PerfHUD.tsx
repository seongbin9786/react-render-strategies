'use client'
// 렌더링 단계 타임라인 + 단계별 화면 스냅샷 필름스트립 + 네트워크 프리셋 오버레이 HUD.
// 모든 랩 앱의 모든 데모 페이지에 부착된다. SSR에서는 아무것도 렌더하지 않는다.
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { getApiDelay, getPerfEntries, getPerfReport, perfInit, perfPrint, subscribePerf } from './core'
import type { PerfEntry } from './core'

const NET_PRESETS = [
  { label: '0ms', value: 0, desc: 'API 지연 없음' },
  { label: '200ms', value: 200, desc: '보통 모바일' },
  { label: '800ms', value: 800, desc: '느린 3G 수준' },
  { label: '2000ms', value: 2000, desc: '매우 열악' },
]

const FIXED_COLORS: Record<string, string> = {
  'nav-start': '#8e8e93',
  ttfb: '#4f8ef7',
  fcp: '#34c759',
  lcp: '#30b0c7',
  'dom-content-loaded': '#a2845e',
  load: '#a2845e',
  'js-eval': '#ff9f0a',
  hydrated: '#ff9f0a',
  'long-tasks': '#ff453a',
  'worst-interaction': '#ff453a',
}

function colorOf(name: string): string {
  if (FIXED_COLORS[name]) return FIXED_COLORS[name]
  if (name.startsWith('stream:')) return '#4f8ef7'
  return '#bf5af2'
}

function fmt(ms: number): string {
  return ms >= 1000 ? (ms / 1000).toFixed(2) + 's' : Math.round(ms) + 'ms'
}

const S: Record<string, CSSProperties> = {
  root: {
    position: 'fixed',
    right: 12,
    bottom: 12,
    zIndex: 2147483000,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    color: '#f2f2f7',
    textAlign: 'left',
    lineHeight: 1.45,
  },
  pill: {
    background: 'rgba(20,20,24,0.92)',
    border: '1px solid #3a3a3f',
    borderRadius: 20,
    padding: '7px 14px',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    whiteSpace: 'nowrap',
  },
  panel: {
    width: 560,
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: '68vh',
    overflowY: 'auto',
    background: 'rgba(18,18,22,0.96)',
    border: '1px solid #3a3a3f',
    borderRadius: 12,
    padding: 14,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  h: { margin: '0 0 8px', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sub: { color: '#98989d', fontSize: 11, margin: '10px 0 6px', fontWeight: 700, letterSpacing: 0.3 },
  row: { display: 'grid', gridTemplateColumns: '150px 58px 58px 1fr', gap: 8, alignItems: 'center', padding: '2px 0' },
  btn: {
    background: '#2c2c31',
    border: '1px solid #48484d',
    borderRadius: 6,
    color: '#f2f2f7',
    padding: '3px 9px',
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'inherit',
  },
  track: { position: 'relative', height: 8, background: '#2c2c31', borderRadius: 4 },
  thumbBox: {
    width: 132,
    height: 88,
    overflow: 'hidden',
    borderRadius: 6,
    border: '1px solid #48484d',
    background: '#fff',
    position: 'relative',
    flexShrink: 0,
  },
}

export function PerfHUD({ app, defaultOpen = false }: { app?: string; defaultOpen?: boolean }) {
  useState(() => {
    perfInit({ app })
    return 0
  })
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(defaultOpen)
  const [preview, setPreview] = useState<PerfEntry | null>(null)
  const [copied, setCopied] = useState(false)
  const [, force] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    setMounted(true)
    const unsub = subscribePerf(() => {
      cancelAnimationFrame(raf.current)
      raf.current = requestAnimationFrame(() => force((v) => v + 1))
    })
    return () => {
      unsub()
      cancelAnimationFrame(raf.current)
    }
  }, [])

  if (!mounted) return null

  const entries = getPerfEntries()
  const maxT = Math.max(100, ...entries.map((e) => e.t))
  const by = (n: string) => entries.find((e) => e.name === n)
  const snaps = entries.filter((e) => e.snapshot)
  const delay = getApiDelay()

  const pillText = [
    `⏱ ${entries.length}단계`,
    by('fcp') && `FCP ${fmt(by('fcp')!.t)}`,
    by('lcp') && `LCP ${fmt(by('lcp')!.t)}`,
    by('hydrated') && `수화 ${fmt(by('hydrated')!.t)}`,
  ]
    .filter(Boolean)
    .join(' · ')

  const setNet = (v: number) => {
    const u = new URL(location.href)
    if (v === 0) u.searchParams.delete('apiDelay')
    else u.searchParams.set('apiDelay', String(v))
    location.href = u.toString()
  }

  const copy = () => {
    navigator.clipboard?.writeText(JSON.stringify(getPerfReport(), null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  let prev = 0

  return (
    <div id="renderlab-hud" style={S.root}>
      {!open && (
        <div style={S.pill} onClick={() => setOpen(true)} title="펼쳐서 단계별 타임라인 보기">
          {pillText}
        </div>
      )}
      {open && (
        <div style={S.panel}>
          <div style={S.h}>
            <span>
              renderlab · {getPerfReport().app} <span style={{ color: '#98989d', fontWeight: 400 }}>{location.pathname}</span>
            </span>
            <span style={{ display: 'flex', gap: 6 }}>
              <button style={S.btn} onClick={() => location.reload()} title="새로고침하여 다시 측정">
                재측정
              </button>
              <button style={S.btn} onClick={copy}>
                {copied ? '복사됨 ✓' : 'JSON 복사'}
              </button>
              <button style={S.btn} onClick={() => perfPrint()}>
                콘솔 출력
              </button>
              <button style={S.btn} onClick={() => setOpen(false)}>
                접기
              </button>
            </span>
          </div>

          <div style={S.sub}>단계 타임라인 (탐색 시작 기준, Δ는 직전 단계와의 간격)</div>
          {entries.map((e) => {
            const d = e.t - prev
            prev = e.t
            return (
              <div key={e.name + e.t} style={S.row} title={e.detail}>
                <span style={{ color: colorOf(e.name), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.snapshot ? '📷 ' : ''}
                  {e.name}
                  {e.updating ? ' ↻' : ''}
                </span>
                <span style={{ textAlign: 'right' }}>{fmt(e.t)}</span>
                <span style={{ textAlign: 'right', color: '#98989d' }}>+{fmt(Math.max(0, d))}</span>
                <span style={S.track}>
                  <span
                    style={{
                      position: 'absolute',
                      left: `calc(${Math.min(100, (e.t / maxT) * 100)}% - 4px)`,
                      top: -1,
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: colorOf(e.name),
                      cursor: e.snapshot ? 'pointer' : 'default',
                    }}
                    onClick={() => e.snapshot && setPreview(e)}
                  />
                </span>
              </div>
            )
          })}
          <div style={{ color: '#98989d', fontSize: 11, marginTop: 6 }}>
            마우스를 올리면 단계 설명이 뜹니다. 스냅샷 캡처는 약간의 오버헤드가 있어 대형 DOM에서는 생략됩니다.
          </div>

          {snaps.length > 0 && (
            <>
              <div style={S.sub}>단계별 화면 상태 (클릭하면 크게 보기 — script 제거된 당시 DOM)</div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                {snaps.map((e) => (
                  <div key={'snap' + e.name + e.t} style={{ cursor: 'pointer' }} onClick={() => setPreview(e)}>
                    <div style={S.thumbBox}>
                      <iframe
                        data-renderlab="1"
                        sandbox=""
                        srcDoc={e.snapshot}
                        style={{
                          width: 1000,
                          height: 666,
                          border: 0,
                          transform: 'scale(0.132)',
                          transformOrigin: 'top left',
                          pointerEvents: 'none',
                          background: '#fff',
                        }}
                        title={e.name}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: '#c7c7cc', textAlign: 'center', marginTop: 2 }}>
                      {e.name} · {fmt(e.t)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={S.sub}>네트워크 (API 인위 지연 — 현재 {delay}ms)</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {NET_PRESETS.map((p) => (
              <button
                key={p.value}
                style={{
                  ...S.btn,
                  borderColor: delay === p.value ? '#4f8ef7' : '#48484d',
                  color: delay === p.value ? '#4f8ef7' : '#f2f2f7',
                }}
                title={p.desc}
                onClick={() => setNet(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ color: '#98989d', fontSize: 11, marginTop: 6 }}>
            버튼은 ?apiDelay= 쿼리로 <b>API 응답만</b> 지연시킵니다. HTML/JS/CSS 전송까지 포함한 전체 회선 스로틀은 DevTools
            Network 탭 또는 루트의 "npm run throttle" 프록시를 사용하세요.
          </div>
        </div>
      )}

      {preview && (
        <div
          id="renderlab-hud-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.78)',
            zIndex: 2147483001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 10,
          }}
          onClick={() => setPreview(null)}
        >
          <div style={{ color: '#fff', fontSize: 14 }}>
            📷 <b>{preview.name}</b> · {fmt(preview.t)} 시점의 화면 — {preview.detail ?? ''} (클릭하여 닫기)
          </div>
          {(() => {
            const s = Math.min((window.innerWidth * 0.88) / 1100, (window.innerHeight * 0.76) / 733)
            return (
              <div
                style={{
                  width: 1100 * s,
                  height: 733 * s,
                  overflow: 'hidden',
                  borderRadius: 8,
                  background: '#fff',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
                }}
              >
                <iframe
                  data-renderlab="1"
                  sandbox=""
                  srcDoc={preview.snapshot}
                  style={{ width: 1100, height: 733, border: 0, transform: `scale(${s})`, transformOrigin: 'top left' }}
                  title={preview.name}
                />
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
