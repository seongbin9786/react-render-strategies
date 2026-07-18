// @renderlab/mock-data — 모든 랩 앱이 공유하는 결정적(seed 고정) 목데이터.
// 도메인: "스터디스페이스" — 스터디카페/공용 학습공간 목록.
// 서버·클라이언트 어디서든 동작하며 외부 네트워크 의존이 없다.

export interface StudySpace {
  id: number
  name: string
  region: string
  kind: string
  capacity: number
  seatsAvailable: number
  rating: number
  pricePerHour: number
  tags: string[]
  description: string
  /** 카드/이미지 배경용 결정적 색상 */
  color: string
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const REGIONS = ['강남', '홍대', '성수', '판교', '잠실', '신촌', '서면', '전포']
const KINDS = ['집중홀', '스터디라운지', '조용한 서재', '카페형 좌석', '1인 부스', '세미나룸']
const TAGS = ['24시간', '콘센트 완비', '개인 조명', '무료 커피', '회의실', '정기권 할인', '주차 지원', '통유리 뷰']
const MOODS = ['조용한', '밝은', '아늑한', '탁 트인', '집중이 잘 되는', '모던한', '따뜻한', '쾌적한']

let cache: StudySpace[] | null = null

export function generateSpaces(count = 200): StudySpace[] {
  const need = Math.max(count, 200)
  if (!cache || cache.length < need) {
    const rnd = mulberry32(20260718)
    const list: StudySpace[] = []
    for (let i = 1; i <= need; i++) {
      const region = REGIONS[Math.floor(rnd() * REGIONS.length)]
      const kind = KINDS[Math.floor(rnd() * KINDS.length)]
      const mood = MOODS[Math.floor(rnd() * MOODS.length)]
      const capacity = 4 + Math.floor(rnd() * 76)
      const tags: string[] = []
      for (const t of TAGS) if (rnd() < 0.35) tags.push(t)
      list.push({
        id: i,
        name: `${region} ${kind} ${i}호점`,
        region,
        kind,
        capacity,
        seatsAvailable: Math.floor(rnd() * (capacity + 1)),
        rating: Math.round((3 + rnd() * 2) * 10) / 10,
        pricePerHour: (10 + Math.floor(rnd() * 50)) * 100,
        tags: tags.slice(0, 4),
        description: `${mood} 분위기의 ${kind}입니다. ${region}역 도보 5분 거리이며, 집중 학습에 최적화된 좌석 배치와 ${
          tags[0] ?? '기본 편의시설'
        }을 갖추고 있습니다.`,
        color: `hsl(${(i * 47) % 360} 70% 55%)`,
      })
    }
    cache = list
  }
  return cache.slice(0, count)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** 쿼리스트링 등 임의 입력을 안전한 지연(ms)으로 변환한다. 0~15000으로 클램프. */
export function parseDelay(v: unknown, fallback = 0): number {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.min(Math.round(n), 15000)
}

export interface QueryOpts {
  /** 인위 지연(ms) — 네트워크/백엔드 상태 시뮬레이션 */
  delay?: number
  count?: number
  region?: string
}

export async function getSpaces(opts: QueryOpts = {}): Promise<StudySpace[]> {
  const { delay = 0, count = 60, region } = opts
  if (delay > 0) await sleep(delay)
  const list = generateSpaces(Math.max(count, region ? 200 : count))
  const filtered = region ? list.filter((s) => s.region === region) : list
  return filtered.slice(0, count)
}

export async function getSpaceById(id: number, opts: { delay?: number } = {}): Promise<StudySpace | undefined> {
  if (opts.delay && opts.delay > 0) await sleep(opts.delay)
  return generateSpaces(200).find((s) => s.id === id)
}

/** 외부 이미지 없이 LCP 후보를 만들기 위한 결정적 SVG 데이터 URI. */
export function spaceImage(space: Pick<StudySpace, 'id' | 'name' | 'color'>, w = 640, h = 360): string {
  const hue = (space.id * 47) % 360
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 70% 55%)"/>` +
    `<stop offset="1" stop-color="hsl(${(hue + 40) % 360} 65% 35%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#g)"/>` +
    `<text x="24" y="${h - 28}" font-family="sans-serif" font-size="${Math.round(h / 12)}" fill="rgba(255,255,255,0.92)" font-weight="bold">${space.name}</text>` +
    `<text x="24" y="${h - 60}" font-family="sans-serif" font-size="${Math.round(h / 20)}" fill="rgba(255,255,255,0.6)">studyspaces #${space.id}</text>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
