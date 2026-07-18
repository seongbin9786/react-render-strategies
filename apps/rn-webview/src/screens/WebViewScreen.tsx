// WebView 화면.
// 선택한 데모 URL을 로드하고, 페이지 안 @renderlab/perf가 postMessage로 보내는
// 'renderlab-perf' 메시지를 받아 하단 패널에 단계 타임라인을 실시간 표시한다.
// final 메시지가 오면 FCP/LCP/hydrated 요약을 고정 표시하고, "기록 저장"으로
// 실행 기록(메모리)에 추가할 수 있다.
import { useRef, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { WebView } from 'react-native-webview'
import type { CatalogItem } from '../catalog'
import { fmtMs, parsePerfMessage, summarize, stageColor, type PerfMessage, type PerfRun } from '../types'
import { C } from '../theme'

interface Props {
  item: CatalogItem
  url: string
  onBack: () => void
  onSaveRun: (run: PerfRun) => void
}

export function WebViewScreen({ item, url, onBack, onSaveRun }: Props) {
  const webRef = useRef<WebView>(null)
  // 마지막으로 수신한 perf 메시지 (entries는 매번 누적 전체가 온다)
  const [last, setLast] = useState<PerfMessage | null>(null)
  const [gotFinal, setGotFinal] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  const entries = last?.entries ?? []
  const summary = summarize(entries)

  // 메인 문서 요청 여부 판별. Android의 onHttpError는 서브리소스(예: 자동 요청되는
  // /favicon.ico 404)에도 발생하므로, 메인 문서가 아니면 오류 오버레이를 띄우지 않는다.
  // 해시 라우트(/#/...)는 실제 HTTP 요청 URL에 해시가 없으므로 떼고 비교한다.
  const isMainDocument = (resourceUrl: string | undefined): boolean => {
    if (!resourceUrl) return true // URL을 안 주는 플랫폼에서는 메인 문서로 간주
    const norm = (u: string) => u.split('#')[0].replace(/\/+$/, '')
    return norm(resourceUrl) === norm(url)
  }

  const reload = () => {
    setLast(null)
    setGotFinal(false)
    setLoadError(null)
    webRef.current?.reload()
  }

  const saveRun = () => {
    if (!last) return
    onSaveRun({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: item.title,
      app: last.app,
      url: last.url || url,
      apiDelay: last.apiDelay,
      savedAt: Date.now(),
      final: gotFinal,
      entries: last.entries,
    })
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1500)
  }

  let prevT = 0

  return (
    <View style={s.root}>
      {/* ── 헤더 ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>‹ 목록</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={s.url} numberOfLines={1}>
            {url}
          </Text>
        </View>
        <TouchableOpacity onPress={reload} style={s.headerBtn}>
          <Text style={s.headerBtnText}>새로고침</Text>
        </TouchableOpacity>
      </View>

      {/* ── 웹뷰 ── */}
      <View style={{ flex: 1 }}>
        <WebView
          ref={webRef}
          source={{ uri: url }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onMessage={(e) => {
            // 형식 오류에 안전: JSON이 아니거나 renderlab-perf가 아니면 조용히 무시
            const msg = parsePerfMessage(e.nativeEvent.data)
            if (!msg) return
            setLast(msg)
            if (msg.final) setGotFinal(true)
          }}
          onError={(e) => setLoadError(e.nativeEvent.description || '페이지를 불러오지 못했습니다')}
          onHttpError={(e) => {
            if (!isMainDocument(e.nativeEvent.url)) return
            setLoadError(`HTTP ${e.nativeEvent.statusCode} — 서버 응답 오류`)
          }}
        />
        {loadError && (
          <View style={s.errorBox}>
            <Text style={s.errorTitle}>연결 실패</Text>
            <Text style={s.errorText}>{loadError}</Text>
            <Text style={s.errorText}>
              Mac에서 해당 랩 서버가 켜져 있는지, 같은 Wi-Fi인지, 방화벽/IP 변경 여부를 확인하세요.
            </Text>
            <TouchableOpacity onPress={reload} style={s.errorBtn}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── 하단 perf 패널 ── */}
      <View style={s.panel}>
        <View style={s.panelHead}>
          <Text style={s.panelTitle}>
            perf 단계 {entries.length ? `(${entries.length})` : '수신 대기중…'}
            {gotFinal ? ' · final ✓' : ''}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity onPress={saveRun} disabled={!last} style={[s.panelBtn, !last && { opacity: 0.4 }]}>
              <Text style={s.panelBtnText}>{savedFlash ? '저장됨 ✓' : '기록 저장'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* final 수신 시 요약 고정 */}
        {gotFinal && (
          <View style={s.summaryRow}>
            <Text style={s.summaryItem}>
              FCP <Text style={s.summaryVal}>{fmtMs(summary.fcp)}</Text>
            </Text>
            <Text style={s.summaryItem}>
              LCP <Text style={s.summaryVal}>{fmtMs(summary.lcp)}</Text>
            </Text>
            <Text style={s.summaryItem}>
              hydrated <Text style={s.summaryVal}>{fmtMs(summary.hydrated)}</Text>
            </Text>
            <Text style={s.summaryItem}>
              apiDelay <Text style={s.summaryVal}>{last?.apiDelay ?? 0}ms</Text>
            </Text>
          </View>
        )}

        <ScrollView style={s.stageList}>
          {entries.length === 0 && (
            <Text style={s.emptyText}>
              페이지의 PerfHUD가 window.ReactNativeWebView로 단계를 전송하면 여기에 표시됩니다.
            </Text>
          )}
          {entries.map((e, i) => {
            const d = e.t - prevT
            prevT = e.t
            return (
              <View key={`${e.name}@${i}`} style={s.stageRow}>
                <Text style={[s.stageName, { color: stageColor(e.name) }]} numberOfLines={1}>
                  {e.name}
                  {e.updating ? ' ↻' : ''}
                </Text>
                <Text style={s.stageT}>{fmtMs(e.t)}</Text>
                <Text style={s.stageD}>+{fmtMs(Math.max(0, d))}</Text>
              </View>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  backBtn: { paddingVertical: 4, paddingRight: 4 },
  backText: { color: C.accent, fontSize: 15, fontWeight: '700' },
  title: { color: C.headerText, fontSize: 14, fontWeight: '700' },
  url: { color: C.headerDim, fontSize: 10, marginTop: 2 },
  headerBtn: {
    borderWidth: 1,
    borderColor: C.panelBorder,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: '#2c2c31',
  },
  headerBtnText: { color: C.headerText, fontSize: 11 },
  errorBox: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    backgroundColor: '#fff3f2',
    borderWidth: 1,
    borderColor: '#f2b8b5',
    borderRadius: 10,
    padding: 12,
  },
  errorTitle: { color: C.red, fontWeight: '800', fontSize: 13, marginBottom: 4 },
  errorText: { color: '#7a3b38', fontSize: 12, lineHeight: 17, marginBottom: 4 },
  errorBtn: {
    alignSelf: 'flex-start',
    backgroundColor: C.red,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  panel: {
    backgroundColor: C.panelBg,
    borderTopWidth: 1,
    borderTopColor: C.panelBorder,
    maxHeight: 290,
    paddingBottom: 8,
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  panelTitle: { color: C.panelText, fontSize: 12, fontWeight: '700' },
  panelBtn: {
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  panelBtnText: { color: C.accent, fontSize: 11, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.panelBorder,
    backgroundColor: '#1d1d23',
  },
  summaryItem: { color: C.panelDim, fontSize: 11 },
  summaryVal: { color: C.panelText, fontWeight: '800', fontVariant: ['tabular-nums'] },
  stageList: { paddingHorizontal: 12, marginTop: 4 },
  emptyText: { color: C.panelDim, fontSize: 11, lineHeight: 16, paddingVertical: 8 },
  stageRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2.5, gap: 8 },
  stageName: { flex: 1, fontSize: 12, fontVariant: ['tabular-nums'] },
  stageT: { color: C.panelText, fontSize: 12, width: 64, textAlign: 'right', fontVariant: ['tabular-nums'] },
  stageD: { color: C.panelDim, fontSize: 12, width: 70, textAlign: 'right', fontVariant: ['tabular-nums'] },
})
