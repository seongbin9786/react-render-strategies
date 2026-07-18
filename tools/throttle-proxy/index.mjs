#!/usr/bin/env node
// renderlab 네트워크 스로틀 프록시.
// DevTools 없이도(특히 RN WebView에서) 회선 상태를 재현하기 위한 지연 + 대역폭 제한 HTTP 프록시.
// 사용:
//   node tools/throttle-proxy/index.mjs --target http://localhost:3000 --port 4300 --profile slow3g
//   npm run throttle -- --target http://localhost:3001 --profile fast3g
// 옵션: --latency <ms> --kbps <kbps> 로 프로파일 세부 값 덮어쓰기 가능.
// WebSocket(vite HMR 등)은 지연만 적용하고 대역폭 제한 없이 통과시킨다.

import http from 'node:http'
import net from 'node:net'
import { URL } from 'node:url'

const PROFILES = {
  wifi: { latency: 5, kbps: 40000 },
  '4g': { latency: 60, kbps: 9000 },
  fast3g: { latency: 150, kbps: 1600 },
  slow3g: { latency: 400, kbps: 400 },
  '2g': { latency: 800, kbps: 250 },
}

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        args[key] = next
        i++
      } else {
        args[key] = 'true'
      }
    }
  }
  return args
}

const args = parseArgs(process.argv.slice(2))
const profileName = args.profile ?? 'fast3g'
const profile = PROFILES[profileName]
if (!profile) {
  console.error(`알 수 없는 프로파일: ${profileName} (가능: ${Object.keys(PROFILES).join(', ')})`)
  process.exit(1)
}
const target = new URL(args.target ?? 'http://localhost:3000')
const port = Number(args.port ?? 4300)
const latency = args.latency !== undefined ? Number(args.latency) : profile.latency
const kbps = args.kbps !== undefined ? Number(args.kbps) : profile.kbps
const TICK_MS = 50
const bytesPerTick = Math.max(64, Math.floor((kbps * 1024) / 8 / (1000 / TICK_MS)))

function throttlePipe(src, dst) {
  if (!kbps) {
    src.pipe(dst)
    return
  }
  const buf = []
  let buffered = 0
  let ended = false
  src.on('data', (c) => {
    buf.push(c)
    buffered += c.length
    if (buffered > bytesPerTick * 40) src.pause()
  })
  src.on('end', () => {
    ended = true
  })
  src.on('error', () => {
    ended = true
  })
  const timer = setInterval(() => {
    let budget = bytesPerTick
    while (budget > 0 && buf.length) {
      const c = buf[0]
      if (c.length <= budget) {
        dst.write(c)
        budget -= c.length
        buffered -= c.length
        buf.shift()
      } else {
        dst.write(c.subarray(0, budget))
        buf[0] = c.subarray(budget)
        buffered -= budget
        budget = 0
      }
    }
    if (buffered < bytesPerTick * 10) src.resume()
    if (ended && !buf.length) {
      clearInterval(timer)
      dst.end()
    }
  }, TICK_MS)
  dst.on('close', () => {
    clearInterval(timer)
    src.destroy()
  })
}

const server = http.createServer((req, res) => {
  const started = Date.now()
  setTimeout(() => {
    const preq = http.request(
      {
        hostname: target.hostname,
        port: target.port || 80,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: target.host, 'accept-encoding': 'identity' },
      },
      (pres) => {
        setTimeout(() => {
          res.writeHead(pres.statusCode ?? 502, pres.headers)
          throttlePipe(pres, res)
          res.on('close', () => {
            console.log(
              `${req.method} ${req.url} -> ${pres.statusCode} (${Date.now() - started}ms, latency ${latency}ms + ${kbps}kbps)`,
            )
          })
        }, latency / 2)
      },
    )
    preq.on('error', (e) => {
      res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' })
      res.end(`proxy error: ${e.message}\n타깃(${target.href})이 켜져 있는지 확인하세요.`)
    })
    req.pipe(preq)
  }, latency / 2)
})

// WebSocket 업그레이드(vite HMR 등): 지연 1회 적용 후 무제한 파이프
server.on('upgrade', (req, socket, head) => {
  setTimeout(() => {
    const upstream = net.connect(Number(target.port || 80), target.hostname, () => {
      let raw = `${req.method} ${req.url} HTTP/1.1\r\n`
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        const k = req.rawHeaders[i]
        const v = k.toLowerCase() === 'host' ? target.host : req.rawHeaders[i + 1]
        raw += `${k}: ${v}\r\n`
      }
      raw += '\r\n'
      upstream.write(raw)
      if (head?.length) upstream.write(head)
      socket.pipe(upstream)
      upstream.pipe(socket)
    })
    upstream.on('error', () => socket.destroy())
    socket.on('error', () => upstream.destroy())
  }, latency)
})

server.listen(port, () => {
  console.log('renderlab throttle proxy')
  console.log(`  타깃    : ${target.href}`)
  console.log(`  수신    : http://localhost:${port}  (RN/다른 기기에서는 이 Mac의 LAN IP:${port})`)
  console.log(`  프로파일: ${profileName} — 왕복 지연 ${latency}ms, 대역폭 ${kbps}kbps`)
  console.log(`  프로파일 목록: ${Object.entries(PROFILES).map(([k, v]) => `${k}(${v.latency}ms/${v.kbps}kbps)`).join(', ')}`)
  console.log('  주의: HTML/JS/CSS/API 응답 전체가 느려집니다. as-is/to-be 체감 차이가 가장 극명해지는 환경입니다.')
})
