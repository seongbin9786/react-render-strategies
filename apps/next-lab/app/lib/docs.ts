import { generateSpaces, sleep } from '@renderlab/mock-data'

// rsc-payload 쌍이 공유하는 "이용 가이드 문서" 30개 — 결정적(seed 고정) 생성.
// mock 데이터의 설명 + 코드 샘플을 조합한 마크다운. as-is(클라이언트 렌더)와
// to-be(서버 렌더)가 완전히 같은 입력을 쓰므로 렌더 위치만 비교된다.

export interface DemoDoc {
  id: number
  title: string
  markdown: string
}

const CODE_SAMPLES: Array<{ lang: string; label: string; code: string }> = [
  {
    lang: 'tsx',
    label: '좌석 현황 컴포넌트',
    code: `interface SeatStatusProps {
  total: number
  available: number
}

export function SeatStatus({ total, available }: SeatStatusProps) {
  const ratio = total === 0 ? 0 : available / total
  const tone = ratio > 0.5 ? 'ok' : ratio > 0.2 ? 'warn' : 'full'
  return (
    <div className={\`seat-status \${tone}\`}>
      <strong>{available}</strong> / {total}석
      <progress value={available} max={total} />
    </div>
  )
}`,
  },
  {
    lang: 'typescript',
    label: '예약 가능 시간 계산',
    code: `type Slot = { start: number; end: number }

export function availableSlots(open: number, close: number, booked: Slot[]): Slot[] {
  const sorted = [...booked].sort((a, b) => a.start - b.start)
  const result: Slot[] = []
  let cursor = open
  for (const b of sorted) {
    if (b.start > cursor) result.push({ start: cursor, end: b.start })
    cursor = Math.max(cursor, b.end)
  }
  if (cursor < close) result.push({ start: cursor, end: close })
  return result
}`,
  },
  {
    lang: 'css',
    label: '집중 모드 테마',
    code: `.focus-room {
  --lamp: hsl(42 90% 62%);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.focus-room .seat[data-occupied='true'] {
  background: color-mix(in srgb, var(--lamp) 30%, transparent);
  outline: 2px solid var(--lamp);
}`,
  },
  {
    lang: 'json',
    label: '요금제 설정',
    code: `{
  "plans": [
    { "id": "hourly", "name": "시간권", "unit": "hour", "discount": 0 },
    { "id": "day", "name": "당일권", "unit": "day", "discount": 0.15 },
    { "id": "monthly", "name": "정기권", "unit": "month", "discount": 0.35 }
  ],
  "peakHours": { "start": 18, "end": 22, "surcharge": 0.1 }
}`,
  },
  {
    lang: 'sql',
    label: '지역별 잔여 좌석 집계',
    code: `SELECT region,
       COUNT(*)                    AS spaces,
       SUM(seats_available)        AS seats,
       ROUND(AVG(rating), 1)       AS avg_rating
FROM study_space
WHERE seats_available > 0
GROUP BY region
ORDER BY seats DESC;`,
  },
  {
    lang: 'bash',
    label: '혼잡도 모니터링 스크립트',
    code: `#!/usr/bin/env bash
# 5분마다 잔여 좌석을 수집해 로그로 남긴다
while true; do
  curl -s "http://localhost:3000/api/spaces?count=40" \\
    | jq '[.[] | {name, seatsAvailable}]' >> seats.log
  sleep 300
done`,
  },
]

let docsCache: DemoDoc[] | null = null

export function generateDocs(count = 30): DemoDoc[] {
  if (!docsCache || docsCache.length < count) {
    const spaces = generateSpaces(count)
    docsCache = spaces.map((s, i) => {
      const a = CODE_SAMPLES[i % CODE_SAMPLES.length]
      const b = CODE_SAMPLES[(i + 3) % CODE_SAMPLES.length]
      const markdown = `# ${s.name} 이용 가이드

${s.description}

**${s.region}** 지역의 **${s.kind}** 유형이며, 총 ${s.capacity}석 중 현재 ${s.seatsAvailable}석이 비어 있습니다.

## 요금 및 기본 정보

| 항목 | 값 |
|---|---|
| 시간당 요금 | ${s.pricePerHour.toLocaleString('ko-KR')}원 |
| 평점 | ★ ${s.rating.toFixed(1)} |
| 좌석 | ${s.seatsAvailable} / ${s.capacity}석 |
| 태그 | ${s.tags.join(', ') || '기본 편의시설'} |

## 예제 1 — ${a.label} (\`${a.lang}\`)

이 지점의 운영 대시보드에서 실제로 쓰는 코드 조각입니다.

\`\`\`${a.lang}
${a.code}
\`\`\`

## 예제 2 — ${b.label} (\`${b.lang}\`)

\`\`\`${b.lang}
${b.code}
\`\`\`

> 참고: 이 문서는 seed 고정 mock 데이터로 결정적으로 생성됩니다. as-is/to-be 두 변형이 완전히 같은 문서를 렌더합니다.
`
      return { id: s.id, title: `${s.name} 이용 가이드`, markdown }
    })
  }
  return docsCache.slice(0, count)
}

/** apiDelay 시뮬레이션을 위한 비동기 로더 — 쌍 양쪽이 동일하게 사용한다. */
export async function getDocs(opts: { delay?: number; count?: number } = {}): Promise<DemoDoc[]> {
  const { delay = 0, count = 30 } = opts
  if (delay > 0) await sleep(delay)
  return generateDocs(count)
}
