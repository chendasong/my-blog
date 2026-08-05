/** Open-Meteo 当前天气（无需 API Key） */

export type WeatherBrief = {
  location: string
  tempC: number
  /** 中文天气简述，如「晴」「多云」 */
  label: string
  emoji: string
}

type GeoResult = {
  results?: Array<{
    name?: string
    latitude: number
    longitude: number
    admin1?: string
    country?: string
    country_code?: string
    feature_code?: string
    population?: number
  }>
}

type ForecastResult = {
  current?: {
    temperature_2m?: number
    weather_code?: number
    cloud_cover?: number
    precipitation?: number
  }
}

/** 省份/简称 → 省会，避免「江西」被解析成同名村镇 */
const REGION_TO_CITY: Record<string, string> = {
  北京: '北京',
  上海: '上海',
  天津: '天津',
  重庆: '重庆',
  河北: '石家庄',
  山西: '太原',
  辽宁: '沈阳',
  吉林: '长春',
  黑龙江: '哈尔滨',
  江苏: '南京',
  浙江: '杭州',
  安徽: '合肥',
  福建: '福州',
  江西: '南昌',
  山东: '济南',
  河南: '郑州',
  湖北: '武汉',
  湖南: '长沙',
  广东: '广州',
  海南: '海口',
  四川: '成都',
  贵州: '贵阳',
  云南: '昆明',
  陕西: '西安',
  甘肃: '兰州',
  青海: '西宁',
  台湾: '台北',
  内蒙古: '呼和浩特',
  广西: '南宁',
  西藏: '拉萨',
  宁夏: '银川',
  新疆: '乌鲁木齐',
  香港: '香港',
  澳门: '澳门',
}

function normalizePlace(place: string): string {
  const raw = place.trim().replace(/省|市|自治区|特别行政区/g, '')
  if (!raw) return '南昌'
  if (REGION_TO_CITY[raw]) return REGION_TO_CITY[raw]
  // 「江西南昌」「南昌市」等
  for (const [region, capital] of Object.entries(REGION_TO_CITY)) {
    if (raw.startsWith(region) && raw.length <= region.length + 1) return capital
    if (raw.includes(region) && raw.includes(capital)) return capital
  }
  return raw
}

function weatherFromObservation(
  code: number,
  cloudCover: number,
  precipitation: number,
): { label: string; emoji: string } {
  // 微量降水时，国内常用 App 常显示多云/阴，优先贴近体感
  if (precipitation < 0.3 && (code === 51 || code === 53 || code === 55 || code === 61)) {
    if (cloudCover >= 70) return { label: '阴', emoji: '☁️' }
    if (cloudCover >= 30) return { label: '多云', emoji: '⛅' }
  }

  if (code === 0) return { label: '晴', emoji: '☀️' }
  if (code === 1) return { label: '晴间多云', emoji: '🌤️' }
  if (code === 2) return { label: '多云', emoji: '⛅' }
  if (code === 3) return { label: '阴', emoji: '☁️' }
  if (code === 45 || code === 48) return { label: '雾', emoji: '🌫️' }
  if (code >= 51 && code <= 57) return { label: '小雨', emoji: '🌦️' }
  if (code >= 61 && code <= 67) return { label: '雨', emoji: '🌧️' }
  if (code >= 71 && code <= 77) return { label: '雪', emoji: '❄️' }
  if (code >= 80 && code <= 82) return { label: '阵雨', emoji: '🌦️' }
  if (code >= 85 && code <= 86) return { label: '阵雪', emoji: '🌨️' }
  if (code >= 95 && code <= 99) return { label: '雷雨', emoji: '⛈️' }

  if (cloudCover >= 70) return { label: '阴', emoji: '☁️' }
  if (cloudCover >= 30) return { label: '多云', emoji: '⛅' }
  return { label: '晴', emoji: '☀️' }
}

function scoreGeoHit(
  hit: NonNullable<GeoResult['results']>[number],
  query: string,
): number {
  let score = 0
  if (hit.country_code === 'CN' || hit.country === '中国') score += 50
  if (hit.name === query) score += 30
  if (hit.feature_code === 'PPLA' || hit.feature_code === 'PPLC') score += 40
  if (hit.feature_code === 'PPLA2') score += 20
  if (typeof hit.population === 'number') score += Math.min(25, Math.log10(hit.population + 1) * 5)
  if (hit.admin1 === query) score += 10
  return score
}

async function geocode(place: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const q = normalizePlace(place)
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', q)
  url.searchParams.set('count', '8')
  url.searchParams.set('language', 'zh')
  url.searchParams.set('countryCode', 'CN')
  const resp = await fetch(url.toString())
  if (!resp.ok) return null
  const data = (await resp.json()) as GeoResult
  const results = data.results ?? []
  if (!results.length) return null
  const hit = [...results].sort((a, b) => scoreGeoHit(b, q) - scoreGeoHit(a, q))[0]
  return {
    lat: hit.latitude,
    lon: hit.longitude,
    name: hit.name || q,
  }
}

/**
 * 按坐标拉取当前天气，并用逆地理拿到中文地名。
 */
export async function fetchWeatherByCoords(
  lat: number,
  lon: number,
): Promise<WeatherBrief | null> {
  try {
    const [forecast, placeName] = await Promise.all([
      fetchForecast(lat, lon),
      reverseGeocode(lat, lon),
    ])
    if (!forecast) return null
    return {
      ...forecast,
      location: placeName || '当前位置',
    }
  } catch {
    return null
  }
}

/**
 * 按站点配置的文字位置拉取天气（省份会映射到省会）。
 */
export async function fetchWeatherBrief(place: string): Promise<WeatherBrief | null> {
  try {
    const geo = await geocode(place || '南昌')
    if (!geo) return null
    const forecast = await fetchForecast(geo.lat, geo.lon)
    if (!forecast) return null
    return {
      ...forecast,
      location: geo.name,
    }
  } catch {
    return null
  }
}

/** 浏览器实时定位；用户拒绝或超时则返回 null */
export function getBrowserCoords(timeoutMs = 8000): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 10 * 60 * 1000 },
    )
  })
}

/**
 * 优先实时定位查天气；失败则回退到站点配置位置。
 */
export async function fetchWeatherPreferGps(fallbackPlace: string): Promise<WeatherBrief | null> {
  const coords = await getBrowserCoords()
  if (coords) {
    const byGps = await fetchWeatherByCoords(coords.lat, coords.lon)
    if (byGps) return byGps
  }
  return fetchWeatherBrief(fallbackPlace)
}

export function formatWeatherLine(w: WeatherBrief): string {
  return `${w.emoji} ${w.label} ${w.tempC}°C`
}

async function fetchForecast(
  lat: number,
  lon: number,
): Promise<Omit<WeatherBrief, 'location'> | null> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('current', 'temperature_2m,weather_code,cloud_cover,precipitation')
  url.searchParams.set('timezone', 'auto')
  const resp = await fetch(url.toString())
  if (!resp.ok) return null
  const data = (await resp.json()) as ForecastResult
  const temp = data.current?.temperature_2m
  const code = data.current?.weather_code
  if (typeof temp !== 'number' || typeof code !== 'number') return null
  const cloud = typeof data.current?.cloud_cover === 'number' ? data.current.cloud_cover : 50
  const precip = typeof data.current?.precipitation === 'number' ? data.current.precipitation : 0
  const { label, emoji } = weatherFromObservation(code, cloud, precip)
  return {
    tempC: Math.round(temp),
    label,
    emoji,
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client')
    url.searchParams.set('latitude', String(lat))
    url.searchParams.set('longitude', String(lon))
    url.searchParams.set('localityLanguage', 'zh')
    const resp = await fetch(url.toString())
    if (!resp.ok) return null
    const data = (await resp.json()) as {
      city?: string
      locality?: string
      principalSubdivision?: string
    }
    return (
      data.city?.trim() ||
      data.locality?.trim() ||
      data.principalSubdivision?.trim() ||
      null
    )
  } catch {
    return null
  }
}
