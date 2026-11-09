import { useEffect, useState } from 'react'

const NOW_TICK_MS = 1000

/** 每秒更新的目前時間，供計時顯示使用。 */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), NOW_TICK_MS)
    return () => clearInterval(timer)
  }, [])
  return now
}
