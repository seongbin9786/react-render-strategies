// 설정 + 카탈로그 화면.
// 호스트 IP(개발 Mac의 LAN IP), 포트 프리셋, apiDelay 프리셋을 고르고
// 아래 카탈로그에서 데모를 탭하면 WebView 화면으로 넘어간다.
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import {
  API_DELAY_PRESETS,
  APP_LABELS,
  CATALOG_BY_APP,
  kindOf,
  PORT_PRESETS,
  type CatalogItem,
  type DemoKind,
} from '../catalog'
import { C } from '../theme'

export type PortMode = 'auto' | number

interface Props {
  host: string
  onHostChange: (v: string) => void
  portMode: PortMode
  onPortModeChange: (v: PortMode) => void
  apiDelay: number
  onApiDelayChange: (v: number) => void
  runsCount: number
  onOpenItem: (item: CatalogItem) => void
  onOpenCompare: () => void
}

const KIND_STYLE: Record<DemoKind, { bg: string; label: string }> = {
  'as-is': { bg: C.orange, label: 'as-is' },
  'to-be': { bg: C.green, label: 'to-be' },
  variant: { bg: C.purple, label: 'variant' },
}

export function SetupScreen(p: Props) {
  const effectivePort = (item: CatalogItem) => (p.portMode === 'auto' ? item.port : p.portMode)

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>renderlab · RN WebView Lab</Text>
        <Text style={s.subtitle}>같은 데모를 WebView에서 열어 Mac 브라우저와 단계별 성능을 비교합니다</Text>
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        {/* ── 접속 설정 ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>접속 설정</Text>

          <Text style={s.label}>호스트 (개발 Mac의 LAN IP)</Text>
          <TextInput
            style={s.input}
            value={p.host}
            onChangeText={p.onHostChange}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="예: 192.168.0.10"
            placeholderTextColor={C.dim}
          />
          <Text style={s.hint}>Expo hostUri에서 자동 감지된 값입니다. 폰과 Mac이 같은 Wi-Fi에 있어야 합니다.</Text>

          <Text style={s.label}>포트</Text>
          <View style={s.presetRow}>
            {PORT_PRESETS.map((pp) => {
              const active = p.portMode === pp.value
              return (
                <TouchableOpacity
                  key={String(pp.value)}
                  style={[s.preset, active && s.presetActive]}
                  onPress={() => p.onPortModeChange(pp.value)}
                >
                  <Text style={[s.presetText, active && s.presetTextActive]}>{pp.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
          {p.portMode === 4300 && (
            <Text style={s.hint}>
              throttle-proxy 경유: Mac에서 npm run throttle -- --target http://localhost:3000 --profile slow3g 처럼
              원하는 앱을 향해 프록시를 먼저 켜두세요. 모든 데모가 :4300으로 열립니다.
            </Text>
          )}

          <Text style={s.label}>API 지연 (apiDelay 쿼리, ms)</Text>
          <View style={s.presetRow}>
            {API_DELAY_PRESETS.map((d) => {
              const active = p.apiDelay === d
              return (
                <TouchableOpacity key={d} style={[s.preset, active && s.presetActive]} onPress={() => p.onApiDelayChange(d)}>
                  <Text style={[s.presetText, active && s.presetTextActive]}>{d}ms</Text>
                </TouchableOpacity>
              )
            })}
          </View>
          <Text style={s.hint}>데이터 API 응답만 인위 지연합니다. 페이지 안 HUD의 네트워크 프리셋과 같은 값입니다.</Text>
        </View>

        {/* ── 기록 비교 ── */}
        <TouchableOpacity style={s.compareBtn} onPress={p.onOpenCompare}>
          <Text style={s.compareBtnText}>저장된 기록 비교 ({p.runsCount})</Text>
          <Text style={s.compareBtnHint}>웹 vs 웹뷰 · as-is vs to-be · 지연 프로파일 간 비교</Text>
        </TouchableOpacity>

        {/* ── 카탈로그 ── */}
        {CATALOG_BY_APP.map(({ app, items }) => (
          <View key={app} style={{ marginTop: 18 }}>
            <Text style={s.sectionTitle}>{APP_LABELS[app]}</Text>
            {items.map((item) => {
              const kind = kindOf(item)
              const ks = KIND_STYLE[kind]
              return (
                <TouchableOpacity key={item.path} style={s.demoRow} onPress={() => p.onOpenItem(item)}>
                  <View style={[s.kindBadge, { backgroundColor: ks.bg }]}>
                    <Text style={s.kindBadgeText}>{ks.label}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.demoTitle}>{item.title}</Text>
                    <Text style={s.demoPath}>
                      :{effectivePort(item)}
                      {item.path}
                      {item.pairPath ? `  ·  짝: ${item.pairPath}` : ''}
                    </Text>
                  </View>
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}

        <Text style={[s.hint, { marginTop: 20 }]}>
          안 열릴 때: ① Mac에서 해당 랩 서버가 켜져 있는지 ② 폰과 Mac이 같은 Wi-Fi인지 ③ macOS 방화벽이 Node 수신을
          막고 있지 않은지 ④ Wi-Fi 변경으로 IP가 바뀌지 않았는지 확인하세요.
        </Text>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.headerBg, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  title: { color: C.headerText, fontSize: 19, fontWeight: '700' },
  subtitle: { color: C.headerDim, fontSize: 12, marginTop: 4, lineHeight: 17 },
  body: { flex: 1 },
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '700', color: C.dim, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: C.text,
    backgroundColor: '#fafafc',
  },
  hint: { fontSize: 11, color: C.dim, marginTop: 6, lineHeight: 16 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  preset: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fafafc',
  },
  presetActive: { borderColor: C.accent, backgroundColor: '#eaf2fe' },
  presetText: { fontSize: 12, color: C.text },
  presetTextActive: { color: C.accent, fontWeight: '700' },
  compareBtn: {
    marginTop: 14,
    backgroundColor: C.headerBg,
    borderRadius: 12,
    padding: 14,
  },
  compareBtnText: { color: C.headerText, fontSize: 14, fontWeight: '700' },
  compareBtnHint: { color: C.headerDim, fontSize: 11, marginTop: 3 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.dim, marginBottom: 8, letterSpacing: 0.2 },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  kindBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, minWidth: 52, alignItems: 'center' },
  kindBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  demoTitle: { fontSize: 14, color: C.text, fontWeight: '600' },
  demoPath: { fontSize: 11, color: C.dim, marginTop: 2, fontVariant: ['tabular-nums'] },
  chevron: { fontSize: 22, color: C.dim, marginLeft: 2 },
})
