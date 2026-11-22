// Automatic tests for the pricing and booking rules. Run with: node test.mjs
import { price, rentalDuration, discountRate, validateDates, openingProblem, isAvailable, bookedDays, alternatives, bookingRef, VEHICLES, VAT_RATE } from './pricing.js'
import { TEXT } from './i18n.js'

let failed = 0
function check(name, cond) {
  if (!cond) failed++
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`)
}
const at = (s) => new Date(s) // local time

// 1. Duration rules
check('4 h = half day', rentalDuration(at('2030-03-05T08:00'), at('2030-03-05T12:00')).halfDay === true)
check('8 h = 1 day', rentalDuration(at('2030-03-05T08:00'), at('2030-03-05T16:00')).days === 1)
check('24 h 45 min = 1 day (grace hour)', rentalDuration(at('2030-03-05T08:00'), at('2030-03-06T08:45')).days === 1)
check('25 h 30 min = 2 days', rentalDuration(at('2030-03-05T08:00'), at('2030-03-06T09:30')).days === 2)
check('return before pick-up is an error', rentalDuration(at('2030-03-05T08:00'), at('2030-03-05T07:00')).error === 'order')

// 2. Discounts
check('no discount under 3 days', discountRate(2) === 0)
check('8 % from 3 days', discountRate(3) === 0.08)
check('15 % from 7 days', discountRate(7) === 0.15)

// 3. Half day, 8 m3 van, 30 km (50 km included): only the half-day price
let p = price({ vehicleId: 'van8', start: at('2030-03-05T08:00'), end: at('2030-03-05T12:00'), km: 30, insurance: 'basic' })
check('half day van8 = 69', p.total === 69 && p.lines.length === 1)
check('VAT is included, not added', Math.abs(p.vat - 69 * VAT_RATE / (1 + VAT_RATE)) < 0.01)

// 4. Extra kilometres: 1 day, 180 km => 80 km x 0.50
p = price({ vehicleId: 'van8', start: at('2030-03-05T08:00'), end: at('2030-03-05T18:00'), km: 180, insurance: 'basic' })
check('80 extra km on van8 = 40', p.lines.find((l) => l.key === 'extraKm').amount === 40)
check('total = 109 + 40', p.total === 149)

// 5. Unlimited km replaces extra km
p = price({ vehicleId: 'van8', start: at('2030-03-05T08:00'), end: at('2030-03-06T08:00'), km: 900, unlimitedKm: true, insurance: 'basic' })
check('unlimited: no extra km line', !p.lines.some((l) => l.key === 'extraKm'))
check('unlimited: 25 per day', p.lines.find((l) => l.key === 'unlimitedKm').amount === 25)
check('unlimited: included km is infinite', p.includedKm === Infinity)

// 6. 3 days, box20, full insurance, extras, delivery
p = price({ vehicleId: 'box20', start: at('2030-03-05T08:00'), end: at('2030-03-08T08:00'), km: 100, insurance: 'full', extras: { blankets: true, dolly: true, extraDriver: true }, delivery: true })
const expected = 179 * 3 - 179 * 3 * 0.08 + 32 * 3 + 15 + 12 + 10 * 3 + 49
check('3-day box truck with options', Math.abs(p.total - Math.round(expected * 20) / 20) < 0.001)
check('8 % discount line is negative', p.lines.find((l) => l.key === 'discount').amount < 0)
check('no excess with full insurance', p.excess === 0)
check('deposit comes from the vehicle', p.deposit === 1500)

// 7. Amounts are rounded to 5 centimes
check('all amounts are multiples of 0.05', p.lines.every((l) => Math.abs(l.amount * 20 - Math.round(l.amount * 20)) < 1e-9))

// 8. Opening hours and dates
const sunday = at('2030-03-10T10:00')
check('Sunday is closed', openingProblem(sunday) === 'closedDay')
check('6:00 is too early', openingProblem(at('2030-03-05T06:00')) === 'closedHour')
check('past pick-up is refused', validateDates(at('2020-01-07T08:00'), at('2020-01-07T10:00')).includes('past'))
check('valid dates give no error', validateDates(at('2030-03-05T08:00'), at('2030-03-05T18:00'), at('2030-01-01T00:00')).length === 0)

// 9. Availability is stable and alternatives are free
const s = at('2030-03-01T08:00'), e = at('2030-03-31T18:00')
check('availability is the same every time', bookedDays('van8', s, e).length === bookedDays('van8', s, e).length)
let found = false
for (let day = 1; day <= 28 && !found; day++) {
  const ds = new Date(2030, 2, day, 8), de = new Date(2030, 2, day, 18)
  if (!isAvailable('van8', ds, de)) {
    found = true
    check('alternatives are in the same category and free', alternatives('van8', ds, de).every((v) => v.cat === 'van' && isAvailable(v.id, ds, de)))
  }
}
check('some days are booked in a month', found)

// 10. Booking reference
check('booking reference format', /^CL-\d{6}-\d{4}$/.test(bookingRef(at('2030-03-05T08:00'), 0.5)))

// 11. Translations
const fr = Object.keys(TEXT.fr).sort().join()
check('sq has the same keys as fr', Object.keys(TEXT.sq).sort().join() === fr)
check('en has the same keys as fr', Object.keys(TEXT.en).sort().join() === fr)
for (const lang of ['fr', 'sq', 'en']) {
  check(`every vehicle has a name in ${lang}`, VEHICLES.every((v) => TEXT[lang].vehicles[v.id]))
  check(`8 FAQ answers in ${lang}`, TEXT[lang].faq.length === 8)
}

console.log(failed ? `\n${failed} test(s) failed` : '\nAll tests passed')
process.exit(failed ? 1 : 0)
