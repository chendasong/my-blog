/**
 * 简历预览统一月份：YYYY.MM；区间「YYYY.MM ~ YYYY.MM」；仅起始则「YYYY.MM ~ 至今」
 */

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** 解析为 YYYY.MM；无法解析则返回 null（保留原文由上层拼接） */
export function parseToResumeYearMonth(input: string): string | null {
  const t = input.trim()
  if (!t) return null

  // 2024-04、2024-4、2024-04-01、2024/04/15、2024.04
  const m = t.match(/^(\d{4})[-/.／](\d{1,2})(?:[-/.／]\d{1,2})?$/)
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2])
    if (y >= 1900 && y <= 2100 && mo >= 1 && mo <= 12) return `${m[1]}.${pad2(mo)}`
  }
  const m2 = t.match(/^(\d{4})[-/.／](\d{1,2})[-/.／]\d{1,2}/)
  if (m2) {
    const y = Number(m2[1])
    const mo = Number(m2[2])
    if (y >= 1900 && y <= 2100 && mo >= 1 && mo <= 12) return `${m2[1]}.${pad2(mo)}`
  }

  const d = new Date(t)
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear()
    const mo = d.getMonth() + 1
    if (y >= 1900 && y <= 2100) return `${y}.${pad2(mo)}`
  }
  return null
}

/** 奖项 / 证书等单日期 */
export function formatResumeMonthSingle(date?: string): string {
  const raw = (date ?? '').trim()
  if (!raw) return ''
  return parseToResumeYearMonth(raw) ?? raw
}

/** 教育、工作、项目等起止；仅起始时显示「起始 ~ 至今」 */
export function formatResumeMonthRange(start?: string, end?: string): string {
  const sRaw = (start ?? '').trim()
  const eRaw = (end ?? '').trim()
  if (!sRaw && !eRaw) return ''

  const left = sRaw ? (parseToResumeYearMonth(sRaw) ?? sRaw) : ''
  const right = eRaw ? (parseToResumeYearMonth(eRaw) ?? eRaw) : ''

  if (left && right) return `${left} ~ ${right}`
  if (left && !right) return `${left} ~ 至今`
  if (!left && right) return right
  return left || right
}
