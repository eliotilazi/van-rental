// Helpers for <input type="datetime-local"> values (local time, no time zone).
const p = (n) => String(n).padStart(2, '0')
export const toInput = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
export const fromInput = (s) => (s ? new Date(s) : null)

// Next day the depot is open (not Sunday), at the given hour.
export function nextOpenDay(hour, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1, hour, 0)
  if (d.getDay() === 0) d.setDate(d.getDate() + 1)
  return d
}
export function defaultDates() {
  const start = nextOpenDay(8)
  const end = new Date(start); end.setHours(18)
  return { start, end }
}
