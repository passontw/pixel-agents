// mock 資料的時間基準：模組載入時間，讓「3m 12s」之類的計時看起來合理。
const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60 * MS_PER_SECOND

export const MOCK_NOW = Date.now()

export const secondsAgo = (seconds: number) => MOCK_NOW - seconds * MS_PER_SECOND
export const minutesAgo = (minutes: number) => MOCK_NOW - minutes * MS_PER_MINUTE
