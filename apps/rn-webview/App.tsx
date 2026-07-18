// renderlab · RN WebView Lab
// 같은 데모를 RN WebView 안에서 열어 웹 브라우저와 성능을 비교하는 앱.
// 내비게이션 라이브러리 없이 useState로 화면을 전환한다 (설정+카탈로그 / WebView / 기록 비교).
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import Constants from 'expo-constants'
import { buildDemoUrl, type CatalogItem } from './src/catalog'
import { SetupScreen, type PortMode } from './src/screens/SetupScreen'
import { WebViewScreen } from './src/screens/WebViewScreen'
import { CompareScreen } from './src/screens/CompareScreen'
import { C } from './src/theme'
import type { PerfRun } from './src/types'

type Screen =
  | { name: 'home' }
  | { name: 'web'; item: CatalogItem; url: string }
  | { name: 'compare' }

/**
 * 기본 호스트: Expo 개발 서버의 hostUri(예: "192.168.0.10:8081")에서 IP만 추출.
 * 랩 서버(3000/3001/3002)도 같은 Mac에서 돌고 있다는 전제이므로 대부분 그대로 쓰면 된다.
 */
function defaultHost(): string {
  const uri = Constants.expoConfig?.hostUri
  if (typeof uri === 'string' && uri.length > 0) {
    const host = uri.split(':')[0]
    if (host) return host
  }
  return '192.168.0.10'
}

export default function App() {
  const [host, setHost] = useState<string>(defaultHost)
  const [portMode, setPortMode] = useState<PortMode>('auto')
  const [apiDelay, setApiDelay] = useState(0)
  const [runs, setRuns] = useState<PerfRun[]>([])
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  const openItem = (item: CatalogItem) => {
    const port = portMode === 'auto' ? item.port : portMode
    setScreen({ name: 'web', item, url: buildDemoUrl(host, port, item.path, apiDelay) })
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      {screen.name === 'home' && (
        <SetupScreen
          host={host}
          onHostChange={setHost}
          portMode={portMode}
          onPortModeChange={setPortMode}
          apiDelay={apiDelay}
          onApiDelayChange={setApiDelay}
          runsCount={runs.length}
          onOpenItem={openItem}
          onOpenCompare={() => setScreen({ name: 'compare' })}
        />
      )}
      {screen.name === 'web' && (
        <WebViewScreen
          item={screen.item}
          url={screen.url}
          onBack={() => setScreen({ name: 'home' })}
          onSaveRun={(run) => setRuns((cur) => [run, ...cur])}
        />
      )}
      {screen.name === 'compare' && (
        <CompareScreen
          runs={runs}
          onBack={() => setScreen({ name: 'home' })}
          onDeleteRun={(id) => setRuns((cur) => cur.filter((r) => r.id !== id))}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.headerBg,
    // 상태바 영역까지 다크 헤더 톤으로 채운다 (safe-area 라이브러리 없이 처리)
    paddingTop: Constants.statusBarHeight,
  },
})
