const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60

/** 經過時間：3m 12s；超過一小時為 1h 5m。 */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / MS_PER_SECOND))
  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const seconds = totalSeconds % SECONDS_PER_MINUTE
  if (totalMinutes >= MINUTES_PER_HOUR) {
    return `${Math.floor(totalMinutes / MINUTES_PER_HOUR)}h ${totalMinutes % MINUTES_PER_HOUR}m`
  }
  return `${totalMinutes}m ${seconds}s`
}

/** 相對時間：2m 前；不到一分鐘為「剛剛」。 */
export function formatRelative(ms: number): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / MS_PER_SECOND / SECONDS_PER_MINUTE)
  if (totalMinutes < 1) return '剛剛'
  if (totalMinutes >= MINUTES_PER_HOUR) return `${Math.floor(totalMinutes / MINUTES_PER_HOUR)}h 前`
  return `${totalMinutes}m 前`
}
