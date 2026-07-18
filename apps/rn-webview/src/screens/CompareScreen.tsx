// 기록 비교 화면.
// 저장된 실행 기록에서 2개(A/B)를 선택하면 단계별로 나란히 비교한다.
// 공통 단계는 Δms 차이(B − A)를 표시한다. 용도: 웹 vs 웹뷰, as-is vs to-be,
// apiDelay/스로틀 프로파일 간 비교.
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { fmtClock, fmtDiff, fmtMs, stageColor, type PerfRun } from '../types'
import { C } from '../theme'

interface Props {
  runs: PerfRun[]
  onBack: () => void
  onDeleteRun: (id: string) => void
}

interface CompareRow {
  name: string
  a?: number
  b?: number
}

function buildRows(a: PerfRun, b: PerfRun): CompareRow[] {
  const map = new Map<string, CompareRow>()
  for (const e of a.entries) {
    if (!map.has(e.name)) map.set(e.name, { name: e.name })
    const row = map.get(e.name)!
    if (row.a === undefined) row.a = e.t // 같은 이름이 여러 번이면 첫 발생 기준
  }
  for (const e of b.entries) {
    if (!map.has(e.name)) map.set(e.name, { name: e.name })
    const row = map.get(e.name)!
    if (row.b === undefined) row.b = e.t
  }
  return [...map.values()].sort(
    (x, y) => Math.min(x.a ?? Infinity, x.b ?? Infinity) - Math.min(y.a ?? Infinity, y.b ?? Infinity),
  )
}

export function CompareScreen({ runs, onBack, onDeleteRun }: Props) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (id: string) => {
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id)
      if (cur.length >= 2) return [cur[1], id] // 가장 오래된 선택을 밀어낸다
      return [...cur, id]
    })
  }

  // 삭제된 기록의 id가 selected에 남으면 A/B 슬롯·(n/2) 카운터가 어긋난다
  const deleteRun = (id: string) => {
    setSelected((cur) => cur.filter((x) => x !== id))
    onDeleteRun(id)
  }

  const runA = runs.find((r) => r.id === selected[0])
  const runB = runs.find((r) => r.id === selected[1])
  const rows = runA && runB ? buildRows(runA, runB) : []

  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={{ paddingVertical: 4, paddingRight: 6 }}>
          <Text style={s.backText}>‹ 목록</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.title}>기록 비교</Text>
          <Text style={s.subtitle}>기록 2개를 선택하면 단계별로 나란히 비교합니다</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        {runs.length === 0 && (
          <View style={s.card}>
            <Text style={s.emptyTitle}>저장된 기록이 없습니다</Text>
            <Text style={s.emptyText}>
              데모를 연 뒤 하단 perf 패널에서 "기록 저장"을 누르면 여기에 쌓입니다. 같은 데모를 Mac 브라우저와 이
              웹뷰에서 각각 측정해 비교해 보세요. (기록은 메모리에만 보관되어 앱을 재시작하면 사라집니다)
            </Text>
          </View>
        )}

        {/* ── 기록 목록 ── */}
        {runs.map((r) => {
          const idx = selected.indexOf(r.id)
          const mark = idx === 0 ? 'A' : idx === 1 ? 'B' : null
          return (
            <TouchableOpacity key={r.id} style={[s.runRow, mark !== null && s.runRowSelected]} onPress={() => toggle(r.id)}>
              <View style={[s.selBadge, mark === 'A' && { backgroundColor: C.accent }, mark === 'B' && { backgroundColor: C.purple }]}>
                <Text style={s.selBadgeText}>{mark ?? '·'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.runTitle} numberOfLines={1}>
                  {r.label}
                </Text>
                <Text style={s.runMeta} numberOfLines={1}>
                  {r.app} · {r.url} · delay {r.apiDelay}ms · {fmtClock(r.savedAt)}
                  {r.final ? '' : ' · (final 이전 저장)'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteRun(r.id)} style={s.delBtn} hitSlop={8}>
                <Text style={{ color: C.red, fontSize: 11, fontWeight: '700' }}>삭제</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )
        })}

        {/* ── 비교 표 ── */}
        {runA && runB && (
          <View style={[s.card, { marginTop: 16, padding: 0, overflow: 'hidden' }]}>
            <View style={s.compareHead}>
              <Text style={s.compareHeadText}>
                <Text style={{ color: C.accent, fontWeight: '800' }}>A</Text> {runA.label} (delay {runA.apiDelay}ms)
                {'\n'}
                <Text style={{ color: C.purple, fontWeight: '800' }}>B</Text> {runB.label} (delay {runB.apiDelay}ms)
              </Text>
              <Text style={s.compareHint}>Δ = B − A. 음수(초록)면 B가 그만큼 빠른 것입니다.</Text>
            </View>

            <View style={[s.tRow, s.tHeader]}>
              <Text style={[s.tName, s.tHeaderText]}>단계</Text>
              <Text style={[s.tCell, s.tHeaderText]}>A</Text>
              <Text style={[s.tCell, s.tHeaderText]}>B</Text>
              <Text style={[s.tCell, s.tHeaderText]}>Δ(B−A)</Text>
            </View>
            {rows.map((row) => {
              const common = row.a !== undefined && row.b !== undefined
              const diff = common ? row.b! - row.a! : 0
              const diffColor = !common ? C.dim : diff < -1 ? C.green : diff > 1 ? C.red : C.dim
              return (
                <View key={row.name} style={s.tRow}>
                  <Text style={[s.tName, { color: stageColor(row.name) }]} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text style={s.tCell}>{fmtMs(row.a)}</Text>
                  <Text style={s.tCell}>{fmtMs(row.b)}</Text>
                  <Text style={[s.tCell, { color: diffColor, fontWeight: '700' }]}>{common ? fmtDiff(diff) : '—'}</Text>
                </View>
              )
            })}
            <Text style={s.tableFoot}>
              한쪽에만 있는 단계(—)는 전략 차이로 그 단계 자체가 없는 경우입니다 (예: CSR에는 stream:* 없음).
            </Text>
          </View>
        )}

        {runs.length > 0 && !(runA && runB) && (
          <Text style={s.pickHint}>위 목록에서 기록 2개를 탭해 A/B로 선택하세요. ({selected.length}/2)</Text>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backText: { color: C.accent, fontSize: 15, fontWeight: '700' },
  title: { color: C.headerText, fontSize: 16, fontWeight: '700' },
  subtitle: { color: C.headerDim, fontSize: 11, marginTop: 2 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 6 },
  emptyText: { fontSize: 12, color: C.dim, lineHeight: 18 },
  runRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  runRowSelected: { borderColor: C.accent, backgroundColor: '#f2f7ff' },
  selBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#d4d4da',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  runTitle: { fontSize: 13, fontWeight: '600', color: C.text },
  runMeta: { fontSize: 10, color: C.dim, marginTop: 2 },
  delBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  compareHead: { padding: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: '#fafafc' },
  compareHeadText: { fontSize: 12, color: C.text, lineHeight: 19 },
  compareHint: { fontSize: 10, color: C.dim, marginTop: 6 },
  tRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    gap: 6,
  },
  tHeader: { backgroundColor: '#f0f0f4' },
  tHeaderText: { fontWeight: '800', color: C.dim, fontSize: 10 },
  tName: { flex: 1.5, fontSize: 12, fontVariant: ['tabular-nums'] },
  tCell: { flex: 0.8, fontSize: 12, textAlign: 'right', color: C.text, fontVariant: ['tabular-nums'] },
  tableFoot: { fontSize: 10, color: C.dim, padding: 12, lineHeight: 15 },
  pickHint: { fontSize: 12, color: C.dim, textAlign: 'center', marginTop: 14 },
})
