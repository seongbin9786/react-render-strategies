import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // @renderlab/* 패키지는 TS 소스를 그대로 배포하므로 Next가 직접 트랜스파일해야 한다.
  transpilePackages: ['@renderlab/perf', '@renderlab/mock-data'],
  experimental: {
    // Router Cache(클라이언트) 재사용 시간. dynamic 기본값 0초 → 동적 페이지는 Link 전환마다 서버 재요청.
    // /prefetch-cache/to-be 데모를 위해 60초로 올린다(뒤로가기·재방문 즉시).
    // 주의: 전역 설정이라 모든 데모에 적용된다 — /prefetch-cache/as-is 페이지에 이 사실을 명시해 두었다.
    staleTimes: {
      dynamic: 60,
    },
  },
}

export default nextConfig
