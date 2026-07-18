// @renderlab/perf의 "RN WebView 메시지 포맷"(docs/PERF_API.md)을 따르는 타입과 안전 파서.
// perf 패키지 소스는 브라우저 전용(DOM 타입 의존)이라 RN 타입체크에 직접 import하지 않고
// 계약 포맷을 여기에 미러링한다. 포맷이 바뀌면 PERF_API.md와 함께 갱신할 것.

export interface PerfEntryMsg {
  name: string
  /** 탐색 시작(performance.timeOrigin) 기준 경과 ms */
  t: number
  detail?: string
  updating?: boolean
}

export interface PerfMessage {
  type: 'renderlab-perf'
  app: string
  url: string
  apiDelay: number
  final: boolean
  entries: PerfEntryMsg[]
}

/**
 * WebView onMessage로 들어온 원문을 안전하게 파싱한다.
 * JSON이 아니거나, type이 다르거나, entries 형식이 깨져 있으면 null.
 * 형식이 이상한 entry는 개별적으로 걸러낸다 (전체를 버리지 않음).
 */
export function parsePerfMessage(raw: unknown): PerfMessage | null {
  if (typeof raw !== 'string' || raw.length === 0) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const m = data as Record<string, unknown>
  if (m.type !== 'renderlab-perf' || !Array.isArray(m.entries)) return null

  const entries: PerfEntryMsg[] = []
  for (const e of m.entries as unknown[]) {
    if (typeof e !== 'object' || e === null) continue
    const r = e as Record<string, unknown>
    if (typeof r.name !== 'string' || typeof r.t !== 'number' || !Number.isFinite(r.t)) continue
    entries.push({
      name: r.name,
      t: r.t,
      detail: typeof r.detail === 'string' ? r.detail : undefined,
      updating: r.updating === true,
    })
  }
  entries.sort((a, b) => a.t - b.t)

  return {
    type: 'renderlab-perf',
    app: typeof m.app === 'string' ? m.app : 'app',
    url: typeof m.url === 'string' ? m.url : '',
    apiDelay: typeof m.apiDelay === 'number' && Number.isFinite(m.apiDelay) ? m.apiDelay : 0,
    final: m.final === true,
    entries,
  }
}

/** 저장된 실행 기록 1건 (메모리 보관 — 앱 재시작 시 사라진다). */
export interface PerfRun {
  id: string
  /** 목록 표시용 이름: 데모 제목 */
  label: string
  app: string
  url: string
  apiDelay: number
  savedAt: number
  /** final 메시지를 받은 뒤 저장되었는지 (측정 완결 여부) */
  final: boolean
  entries: PerfEntryMsg[]
}

export interface PerfSummary {
  fcp?: number
  lcp?: number
  hydrated?: number
}

export function summarize(entries: PerfEntryMsg[]): PerfSummary {
  const by = (n: string) => entries.find((e) => e.name === n)
  return { fcp: by('fcp')?.t, lcp: by('lcp')?.t, hydrated: by('hydrated')?.t }
}

export function fmtMs(t: number | undefined): string {
  if (t === undefined || !Number.isFinite(t)) return '—'
  return t >= 1000 ? `${(t / 1000).toFixed(2)}s` : `${Math.round(t)}ms`
}

/** +/− 부호가 붙는 차이 표기 (비교 화면용) */
export function fmtDiff(d: number): string {
  const sign = d > 0 ? '+' : d < 0 ? '−' : '±'
  return sign + fmtMs(Math.abs(d))
}

export function fmtClock(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 웹 HUD와 같은 계열의 단계 색상 — 두 화면을 오가며 볼 때 인지 부하를 줄인다. */
export function stageColor(name: string): string {
  const fixed: Record<string, string> = {
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
  if (fixed[name]) return fixed[name]
  if (name.startsWith('stream:')) return '#4f8ef7'
  return '#bf5af2'
}
