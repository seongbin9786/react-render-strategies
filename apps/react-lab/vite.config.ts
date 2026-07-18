import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
// mock-data는 반드시 "상대 경로"로 import한다.
// (vite.config.ts는 esbuild로 별도 번들되는데, file: 심링크 패키지명을 해석하지 못하는
//  경우가 있어 설정 파일에서만큼은 패키지명 대신 소스 상대 경로를 쓴다.)
import { getSpaces, parseDelay } from '../../packages/mock-data/src/index.ts'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * GET /api/spaces — dev(vite)와 preview(vite preview) 양쪽에서 동작하는 목데이터 API.
 * 쿼리: delay(인위 지연 ms, 0~15000 클램프) / count(개수) / region(지역 필터)
 * 데모의 ?apiDelay= 값이 이 delay로 전달되어 "느린 백엔드"를 재현한다.
 */
function spacesApiPlugin(): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (url.pathname !== '/api/spaces' || (req.method ?? 'GET') !== 'GET') {
      next()
      return
    }
    const q = url.searchParams
    const count = Number(q.get('count'))
    getSpaces({
      delay: parseDelay(q.get('delay') ?? undefined),
      count: Number.isFinite(count) && count > 0 ? Math.min(Math.round(count), 20000) : 60,
      region: q.get('region') ?? undefined,
    })
      .then((list) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(list))
      })
      .catch((err: unknown) => {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: String(err) }))
      })
  }
  return {
    name: 'renderlab-spaces-api',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

export default defineConfig({
  plugins: [react(), spacesApiPlugin()],
  // @renderlab/perf가 file: 심링크(소스 TS 그대로)로 설치되므로,
  // react가 두 벌 로드되지 않도록 반드시 dedupe한다. (PERF_API.md 계약)
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3002,
    strictPort: true,
    // 심링크된 패키지 소스(packages/*)가 앱 루트 밖에 있으므로 모노레포 루트를 허용한다.
    fs: { allow: ['../..'] },
  },
  preview: {
    port: 3002,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      // 멀티 엔트리: 메인 SPA + 번들 분할 비교용 독립 페이지 2개
      input: {
        main: path.resolve(dirname, 'index.html'),
        'bundle-as-is': path.resolve(dirname, 'bundle-as-is.html'),
        'bundle-to-be': path.resolve(dirname, 'bundle-to-be.html'),
      },
    },
  },
})
