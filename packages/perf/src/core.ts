// @renderlab/perf — 프레임워크 공용 렌더링 성능 계측 코어.
// 브라우저 전용이며, SSR(서버) 중 호출은 전부 안전한 no-op이다.

export interface PerfEntry {
  name: string
  /** 탐색 시작(performance.timeOrigin) 기준 경과 ms */
  t: number
  detail?: string
  /** 해당 단계 시점의 DOM 스냅샷(script/HUD 제거된 HTML). RN 전송에서는 제외된다. */
  snapshot?: string
  /** true면 같은 이름 엔트리를 갱신한다 (lcp 후보, long-tasks 누적 등) */
  updating?: boolean
}

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'
const MAX_SNAPSHOT = 800_000
const MAX_SNAPSHOT_COUNT = 14
const MAX_DOM_NODES_FOR_SNAPSHOT = 6000
// 중복 기록을 막아야 하는 1회성 자동 단계
const ONCE_NAMES = new Set(['nav-start', 'ttfb', 'fcp', 'dom-content-loaded', 'load', 'js-eval', 'hydrated'])

const state = {
  app: 'app',
  entries: [] as PerfEntry[],
  listeners: new Set<() => void>(),
  captureSnapshots: true,
  snapshotCount: 0,
  initialized: false,
  finalized: false,
}

function notify() {
  state.listeners.forEach((l) => {
    try {
      l()
    } catch {
      /* ignore */
    }
  })
}

export function subscribePerf(listener: () => void): () => void {
  state.listeners.add(listener)
  return () => {
    state.listeners.delete(listener)
  }
}

export function getPerfEntries(): PerfEntry[] {
  return [...state.entries].sort((a, b) => a.t - b.t)
}

export function getPerfApp(): string {
  return state.app
}

/** ?apiDelay= 쿼리에서 API 인위 지연(ms)을 읽는다. HUD 네트워크 프리셋이 이 값을 바꾼다. */
export function getApiDelay(): number {
  if (!isBrowser) return 0
  const raw = new URLSearchParams(window.location.search).get('apiDelay')
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 15000) : 0
}

/** RN WebView·클립보드 전송용 요약 (스냅샷 제외) */
export function getPerfReport() {
  return {
    type: 'renderlab-perf' as const,
    app: state.app,
    url: isBrowser ? location.pathname + location.search : '',
    apiDelay: getApiDelay(),
    entries: getPerfEntries().map(({ snapshot, ...rest }) => rest),
  }
}

function domSnapshot(): string | undefined {
  try {
    if (document.getElementsByTagName('*').length > MAX_DOM_NODES_FOR_SNAPSHOT) return undefined
    const clone = document.documentElement.cloneNode(true) as HTMLElement
    clone
      .querySelectorAll('script, #renderlab-hud, #renderlab-hud-overlay, iframe[data-renderlab]')
      .forEach((n) => n.remove())
    const html = '<!doctype html>' + clone.outerHTML
    if (html.length > MAX_SNAPSHOT) return undefined
    return html
  } catch {
    return undefined
  }
}

function sanitizeRawSnapshot(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  try {
    const doc = new DOMParser().parseFromString(raw, 'text/html')
    doc.querySelectorAll('script, #renderlab-hud, #renderlab-hud-overlay, iframe[data-renderlab]').forEach((n) => n.remove())
    const html = '<!doctype html>' + doc.documentElement.outerHTML
    return html.length > MAX_SNAPSHOT ? undefined : html
  } catch {
    return undefined
  }
}

function scheduleSnapshot(entry: PerfEntry) {
  if (!isBrowser || !state.captureSnapshots) return
  if (state.snapshotCount >= MAX_SNAPSHOT_COUNT) return
  state.snapshotCount++
  // 페인트가 반영된 뒤의 화면 상태를 찍기 위해 rAF 두 번 뒤에 캡처한다.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const snap = domSnapshot()
      if (snap) {
        entry.snapshot = snap
        notify()
      } else {
        state.snapshotCount--
      }
    }),
  )
}

interface PushOpts {
  detail?: string
  snapshot?: boolean
  updating?: boolean
  rawSnapshot?: string
}

function push(name: string, t: number, opts?: PushOpts) {
  if (!isBrowser) return
  if (opts?.updating) {
    const existing = state.entries.find((e) => e.name === name)
    if (existing) {
      existing.t = t
      if (opts.detail) existing.detail = opts.detail
      notify()
      postToRN()
      return
    }
  } else if (ONCE_NAMES.has(name) && state.entries.some((e) => e.name === name)) {
    return
  }
  const entry: PerfEntry = { name, t, detail: opts?.detail, updating: opts?.updating }
  state.entries.push(entry)
  if (opts?.rawSnapshot) {
    entry.snapshot = sanitizeRawSnapshot(opts.rawSnapshot)
    if (entry.snapshot) state.snapshotCount++
  } else if (opts?.snapshot !== false) {
    scheduleSnapshot(entry)
  }
  notify()
  postToRN()
}

/**
 * 커스텀 단계를 기록한다. 예: perfStage('data-received', { detail: '목록 40건' })
 * as-is/to-be 쌍에서는 반드시 동일한 단계 이름을 써서 비교 가능하게 한다.
 */
export function perfStage(name: string, opts?: { detail?: string; snapshot?: boolean }) {
  if (!isBrowser) return
  try {
    performance.mark(`renderlab:${name}`)
  } catch {
    /* ignore */
  }
  push(name, performance.now(), opts)
}

// ---------------------------------------------------------------------------
// RN WebView 브리지: window.ReactNativeWebView가 있으면 단계 갱신을 전송한다.
// 메시지 포맷: { type:'renderlab-perf', app, url, apiDelay, final, entries:[{name,t,detail}] }
// ---------------------------------------------------------------------------
let rnPostScheduled = false
function postToRN(final = false) {
  if (!isBrowser) return
  const rn = (window as unknown as { ReactNativeWebView?: { postMessage(msg: string): void } }).ReactNativeWebView
  if (!rn?.postMessage) return
  if (rnPostScheduled && !final) return
  rnPostScheduled = true
  setTimeout(
    () => {
      rnPostScheduled = false
      try {
        rn.postMessage(JSON.stringify({ ...getPerfReport(), final }))
      } catch {
        /* ignore */
      }
    },
    final ? 0 : 250,
  )
}

/** 콘솔에 단계 테이블을 출력한다 (load 후 자동 1회 + HUD 버튼). */
export function perfPrint() {
  if (!isBrowser) return
  const list = getPerfEntries()
  let prev = 0
  const rows = list.map((e) => {
    const row = {
      단계: e.name,
      '시각(ms)': Math.round(e.t),
      'Δ이전(ms)': Math.round(e.t - prev),
      설명: e.detail ?? '',
    }
    prev = e.t
    return row
  })
  console.log(`%c[renderlab:${state.app}] ${location.pathname}${location.search}`, 'font-weight:bold;color:#4f8ef7')
  console.table(rows)
}

// ---------------------------------------------------------------------------
// 스트리밍 SSR 계측: 청크가 "HTML 파서에 도달한 시점"은 hydration 이전이므로
// 인라인 스크립트로만 잡을 수 있다. 앱 루트 <head>에 STREAM_BOOTSTRAP을 인라인하고,
// 스트리밍되는 섹션에 <StreamMark name="..."/>을 넣는다.
// ---------------------------------------------------------------------------
export const STREAM_BOOTSTRAP =
  'window.__rlStream=window.__rlStream||[];' +
  'window.__rlStreamMark=window.__rlStreamMark||function(n){var s=null;try{s=document.documentElement.outerHTML}catch(e){}' +
  'window.__rlStream.push({n:n,t:performance.now(),h:s})};'

const STREAM_DETAIL = '스트리밍 청크 도착 (HTML 파서 실행 시점, hydration 이전)'

/**
 * 자동 계측 초기화 (멱등). PerfHUD가 자동으로 호출하므로 보통 직접 부를 일은 없다.
 * 수집: nav-start, ttfb, fcp, lcp, dom-content-loaded, load, long-tasks, worst-interaction, stream:*
 */
export function perfInit(config?: { app?: string; captureSnapshots?: boolean }) {
  if (config?.app) state.app = config.app
  if (config?.captureSnapshots !== undefined) state.captureSnapshots = config.captureSnapshots
  if (!isBrowser || state.initialized) return
  state.initialized = true

  push('nav-start', 0, { snapshot: false, detail: '탐색 시작 (performance.timeOrigin)' })

  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (nav && nav.responseStart > 0) {
    push('ttfb', nav.responseStart, { snapshot: false, detail: '첫 응답 바이트 도착 (서버 처리 + 네트워크 왕복)' })
  }

  // 스트리밍 마크 백로그 처리 + 이후 마크는 직접 수신
  const w = window as unknown as {
    __rlStream?: Array<{ n: string; t: number; h?: string | null }>
    __rlStreamMark?: (n: string) => void
  }
  for (const m of w.__rlStream ?? []) {
    push(`stream:${m.n}`, m.t, { detail: STREAM_DETAIL, snapshot: false, rawSnapshot: m.h ?? undefined })
  }
  w.__rlStreamMark = (n: string) => push(`stream:${n}`, performance.now(), { detail: STREAM_DETAIL })

  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.name === 'first-contentful-paint') {
          push('fcp', e.startTime, { detail: '첫 콘텐츠 페인트 — 사용자가 "뭔가 떴다"를 인지' })
        }
      }
    }).observe({ type: 'paint', buffered: true })
  } catch {
    /* unsupported */
  }

  try {
    new PerformanceObserver((list) => {
      const last = list.getEntries().at(-1)
      if (last) {
        push('lcp', last.startTime, {
          updating: true,
          snapshot: false,
          detail: '최대 콘텐츠 페인트 (후보 갱신됨) — 체감 로딩 완료의 핵심 지표',
        })
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    /* unsupported */
  }

  let longTaskTotal = 0
  let longTaskCount = 0
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        longTaskTotal += e.duration
        longTaskCount++
      }
      push('long-tasks', performance.now(), {
        updating: true,
        snapshot: false,
        detail: `50ms+ 작업 ${longTaskCount}개 / 총 ${Math.round(longTaskTotal)}ms — 메인스레드 블로킹(hydration·대량 렌더 비용)`,
      })
    }).observe({ type: 'longtask', buffered: true })
  } catch {
    /* unsupported */
  }

  let worstInteraction = 0
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.duration > worstInteraction) {
          worstInteraction = e.duration
          push('worst-interaction', performance.now(), {
            updating: true,
            snapshot: false,
            detail: `최악 인터랙션 ${Math.round(e.duration)}ms (INP 근사) — 입력 반응성`,
          })
        }
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 40 } as PerformanceObserverInit)
  } catch {
    /* unsupported */
  }

  const finalize = () => {
    if (state.finalized) return
    state.finalized = true
    const nav2 = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav2) {
      if (nav2.domContentLoadedEventEnd > 0) {
        push('dom-content-loaded', nav2.domContentLoadedEventEnd, {
          snapshot: false,
          detail: 'HTML 파싱 + 동기 스크립트 완료',
        })
      }
      if (nav2.loadEventEnd > 0) {
        push('load', nav2.loadEventEnd, { detail: '모든 리소스(이미지·CSS 포함) 로드 완료' })
      }
    }
    setTimeout(() => {
      perfPrint()
      postToRN(true)
    }, 1200)
  }
  if (document.readyState === 'complete') {
    setTimeout(finalize, 0)
  } else {
    window.addEventListener('load', () => setTimeout(finalize, 0), { once: true })
  }
}
