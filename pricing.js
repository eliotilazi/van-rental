// Pricing and booking rules: pure functions, no HTML, so they can be tested with Node.
// All prices are in CHF, VAT included, and are example figures for a fictional company.

export const VAT_RATE = 0.081 // Swiss VAT, standard rate (already included in the prices)
export const KM_PER_DAY = 100 // kilometres included per rental day
export const HALF_DAY_HOURS = 5 // a rental of 5 hours or less is billed as a half day
export const GRACE_HOURS = 1 // up to 1 hour late is not billed as an extra day
export const UNLIMITED_KM_PER_DAY = 25
export const DELIVERY_FEE = 49 // delivery and collection within 15 km of the depot
export const OPEN = { from: 7, to: 19, closedDays: [0] } // 07:00 to 19:00, closed on Sunday

export const VEHICLES = [
  { id: 'compact', cat: 'van', volume: 3.3, payload: 700, seats: 2, licence: 'B', halfDay: 49, day: 79, extraKm: 0.45, deposit: 800 },
  { id: 'van8', cat: 'van', volume: 8, payload: 1100, seats: 3, licence: 'B', halfDay: 69, day: 109, extraKm: 0.5, deposit: 1000 },
  { id: 'van12', cat: 'van', volume: 12, payload: 1200, seats: 3, licence: 'B', halfDay: 89, day: 139, extraKm: 0.55, deposit: 1000 },
  { id: 'box20', cat: 'box', volume: 20, payload: 900, seats: 3, licence: 'B', halfDay: 119, day: 179, extraKm: 0.65, deposit: 1500 },
  { id: 'tipper', cat: 'tipper', volume: 2.5, payload: 1000, seats: 3, licence: 'B', halfDay: 99, day: 159, extraKm: 0.6, deposit: 1500 },
  { id: 'minibus', cat: 'minibus', volume: 0, payload: 0, seats: 9, licence: 'B', halfDay: 99, day: 159, extraKm: 0.5, deposit: 1000 },
  { id: 'truck35', cat: 'box', volume: 35, payload: 3000, seats: 3, licence: 'C1', halfDay: 179, day: 259, extraKm: 0.8, deposit: 2000 },
]

export const INSURANCE = {
  basic: { perDay: 0, excess: 2500 },
  plus: { perDay: 19, excess: 1000 },
  full: { perDay: 32, excess: 0 },
}

// per: 'rental' = once per booking, 'day' = per billed day
export const EXTRAS = {
  blankets: { price: 15, per: 'rental' },
  dolly: { price: 12, per: 'rental' },
  straps: { price: 8, per: 'rental' },
  extraDriver: { price: 10, per: 'day' },
  youngDriver: { price: 15, per: 'day' },
}

const HOUR = 3600 * 1000
const round05 = (n) => Math.round(n * 20) / 20 // Swiss rounding to 5 centimes

export const vehicle = (id) => VEHICLES.find((v) => v.id === id)

// Longer rentals get a lower daily price.
export function discountRate(days) {
  if (days >= 7) return 0.15
  if (days >= 3) return 0.08
  return 0
}

// How long the rental is, and how it is billed.
export function rentalDuration(start, end) {
  const hours = (end - start) / HOUR
  if (!(hours > 0)) return { error: 'order' }
  if (hours <= HALF_DAY_HOURS) return { hours, halfDay: true, days: 1 }
  const days = Math.max(1, Math.ceil((hours - GRACE_HOURS) / 24))
  return { hours, halfDay: false, days }
}

// Is the depot open at this moment? Returns null when it is, or the reason.
export function openingProblem(date) {
  if (OPEN.closedDays.includes(date.getDay())) return 'closedDay'
  const h = date.getHours() + date.getMinutes() / 60
  if (h < OPEN.from || h > OPEN.to) return 'closedHour'
  return null
}

// Demo availability: some days are already booked for each vehicle.
// It is deterministic, so the same vehicle is always busy on the same days.
function hash(text) {
  let h = 2166136261
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

export function bookedDays(vehicleId, start, end) {
  const busy = []
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  while (d <= last) {
    if (hash(vehicleId + dayKey(d)) % 9 === 0) busy.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return busy
}
export const isAvailable = (vehicleId, start, end) => bookedDays(vehicleId, start, end).length === 0

// Same category, available on the same dates.
export function alternatives(vehicleId, start, end) {
  const v = vehicle(vehicleId)
  return VEHICLES.filter((o) => o.id !== vehicleId && o.cat === v.cat && isAvailable(o.id, start, end))
}

// Every problem with a booking, in the order the customer should fix them.
export function validateDates(start, end, now = new Date()) {
  const errors = []
  if (!(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end)) return ['required']
  if (start < now) errors.push('past')
  if (end <= start) errors.push('order')
  const o1 = openingProblem(start)
  const o2 = openingProblem(end)
  if (o1 || o2) errors.push(o1 === 'closedDay' || o2 === 'closedDay' ? 'closedDay' : 'closedHour')
  return errors
}

// The full price of a booking.
// b = { vehicleId, start, end, km, unlimitedKm, insurance, extras: { blankets: true, ... }, delivery }
export function price(b) {
  const v = vehicle(b.vehicleId)
  const dur = rentalDuration(b.start, b.end)
  if (!v || dur.error) return null
  const lines = []
  const add = (key, qty, unit, amount) => lines.push({ key, qty, unit, amount: round05(amount) })

  const rental = dur.halfDay ? v.halfDay : v.day * dur.days
  add(dur.halfDay ? 'rentalHalf' : 'rentalDays', dur.halfDay ? 0.5 : dur.days, 'day', rental)
  const disc = dur.halfDay ? 0 : discountRate(dur.days)
  if (disc) add('discount', Math.round(disc * 100), 'pct', -rental * disc)

  const includedKm = dur.halfDay ? KM_PER_DAY / 2 : KM_PER_DAY * dur.days
  const km = Math.max(0, Number(b.km) || 0)
  let extraKm = 0
  if (b.unlimitedKm) add('unlimitedKm', dur.days, 'day', UNLIMITED_KM_PER_DAY * dur.days)
  else {
    extraKm = Math.max(0, km - includedKm)
    if (extraKm) add('extraKm', extraKm, 'km', extraKm * v.extraKm)
  }

  const ins = INSURANCE[b.insurance] || INSURANCE.basic
  if (ins.perDay) add('insurance_' + b.insurance, dur.days, 'day', ins.perDay * dur.days)

  for (const [k, on] of Object.entries(b.extras || {})) {
    const e = EXTRAS[k]
    if (!on || !e) continue
    if (e.per === 'day') add(k, dur.days, 'day', e.price * dur.days)
    else add(k, 1, 'pc', e.price)
  }
  if (b.delivery) add('delivery', 1, 'pc', DELIVERY_FEE)

  const total = round05(lines.reduce((s, l) => s + l.amount, 0))
  const vat = Math.round((total * VAT_RATE) / (1 + VAT_RATE) * 100) / 100
  return {
    lines, total, vat, days: dur.days, halfDay: dur.halfDay, discount: disc,
    includedKm: b.unlimitedKm ? Infinity : includedKm, extraKm,
    deposit: v.deposit, excess: ins.excess,
  }
}

// Booking reference such as CL-261204-4821
export function bookingRef(date = new Date(), rnd = Math.random()) {
  const p = (n) => String(n).padStart(2, '0')
  return `CL-${String(date.getFullYear()).slice(2)}${p(date.getMonth() + 1)}${p(date.getDate())}-${1000 + Math.floor(rnd * 9000)}`
}
