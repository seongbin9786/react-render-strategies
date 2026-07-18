// start-lab — TanStack Start(1.131.x) + Vite 6 구성.
// 주의: 이 저장소는 Node 20.18.x 환경이라 Vite 7(Node 20.19+ 필요)을 쓸 수 없다.
// @tanstack/react-start도 1.132.0부터 Vite 7을 요구하므로, Vite 6을 지원하는
// 마지막 라인(1.131.x)에 고정한다.
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3001,
    fs: {
      // @renderlab/perf, @renderlab/mock-data가 file: 심링크(모노레포 루트의 packages/)라
      // 앱 루트 밖의 소스 접근을 허용해야 한다.
      allow: ['.', '../..'],
    },
  },
  resolve: {
    // 심링크된 공용 패키지가 react를 중복 로드하지 않도록 단일 인스턴스로 강제.
    dedupe: ['react', 'react-dom'],
  },
  ssr: {
    // 공용 패키지는 TS 소스를 그대로 배포하므로 SSR에서도 번들러가 변환하게 한다.
    noExternal: ['@renderlab/perf', '@renderlab/mock-data'],
  },
  plugins: [
    tanstackStart({ customViteReactPlugin: true }),
    viteReact(),
  ],
})
