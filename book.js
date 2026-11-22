// Booking page: a 3-step form with a live price summary.
import { startPage, t, fill, money, num, dateText, esc, vehicleSvg } from './layout.js'
import { VEHICLES, INSURANCE, EXTRAS, vehicle, price, validateDates, bookedDays, alternatives, bookingRef } from './pricing.js'
import { toInput, fromInput, defaultDates } from './dates.js'

const q = new URLSearchParams(location.search)
const d = defaultDates()
const state = {
  step: 1,
  vehicleId: vehicle(q.get('v')) ? q.get('v') : (VEHICLES.find((v) => v.cat === q.get('cat')) || VEHICLES[1]).id,
  start: q.get('start') || toInput(d.start),
  end: q.get('end') || toInput(d.end),
  km: 80,
  unlimitedKm: false,
  insurance: 'basic',
  extras: {},
  delivery: false,
  driver: { first: '', last: '', email: '', phone: '', licence: false, terms: false },
  showErrors: false,
  ref: '',
}

const booking = () => ({ ...state, start: fromInput(state.start), end: fromInput(state.end) })

// All problems on step 1 (dates and availability).
function dateProblems() {
  const b = booking()
  const errors = validateDates(b.start, b.end)
  if (errors.length) return { errors }
  const busy = bookedDays(state.vehicleId, b.start, b.end)
  return { errors: [], busy, alts: busy.length ? alternatives(state.vehicleId, b.start, b.end) : [] }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^\+?[0-9 ()-]{8,20}$/
function driverProblems() {
  const dr = state.driver
  const e = {}
  if (!dr.first.trim()) e.first = 'required'
  if (!dr.last.trim()) e.last = 'required'
  if (!dr.email.trim()) e.email = 'required'; else if (!EMAIL.test(dr.email.trim())) e.email = 'email'
  if (!dr.phone.trim()) e.phone = 'required'; else if (!PHONE.test(dr.phone.trim())) e.phone = 'phone'
  if (!dr.licence) e.licence = 'check'
  if (!dr.terms) e.terms = 'check'
  return e
}

function renderStepper() {
  const L = t()
  document.getElementById('stepper').innerHTML = ['s1', 's2', 's3', 's4'].map((k, i) =>
    `<li class="${i + 1 === state.step ? 'on' : i + 1 < state.step ? 'done' : ''}" ${i + 1 === state.step ? 'aria-current="step"' : ''}>${i + 1}. ${L[k]}</li>`).join('')
}

function step1() {
  const L = t()
  const { errors, busy, alts } = dateProblems()
  let notice = ''
  if (errors.length) notice = `<div class="notice" role="alert"><p class="err">${errors.map((e) => L['err_' + e]).join(' ')}</p></div>`
  else if (busy.length) notice = `<div class="notice" role="alert"><p class="err">${fill(L.err_unavailable, { d: dateText(busy[0]) })}</p>
      ${alts.length ? `<p>${L.alternatives}</p><div class="alt">${alts.map((v) => `<button type="button" data-alt="${v.id}">${L.vehicles[v.id][0]} · ${money(v.day)}</button>`).join('')}</div>` : `<p>${L.no_alternatives}</p>`}</div>`
  return `
    <div class="panel-step">
      <h2>${L.s1}</h2>
      <div class="form-grid">
        <label class="f" style="grid-column:1/-1"><span>${L.vehicle}</span>
          <select name="vehicleId">${VEHICLES.map((v) => `<option value="${v.id}" ${v.id === state.vehicleId ? 'selected' : ''}>${L.vehicles[v.id][0]} (${L.licence} ${v.licence}) · ${money(v.day)} ${L.per_day}</option>`).join('')}</select></label>
        <label class="f"><span>${L.pickup}</span><input type="datetime-local" name="start" value="${state.start}" step="900"></label>
        <label class="f"><span>${L.return}</span><input type="datetime-local" name="end" value="${state.end}" step="900"></label>
        <label class="f"><span>${L.km_estimate}</span><input type="number" name="km" min="0" max="5000" step="10" value="${state.km}" inputmode="numeric" ${state.unlimitedKm ? 'disabled' : ''}></label>
        <label class="check" style="align-self:end"><input type="checkbox" name="unlimitedKm" ${state.unlimitedKm ? 'checked' : ''}> <span>${L.unlimited_km}</span></label>
      </div>
      <div id="date-notice">${notice}</div>
    </div>`
}

function step2() {
  const L = t()
  const extra = (k) => {
    const e = EXTRAS[k]
    return `<label class="choice"><input type="checkbox" name="extra" value="${k}" ${state.extras[k] ? 'checked' : ''}><span><b>${L.lines[k]}</b><small>${money(e.price)} ${e.per === 'day' ? L.per_day_l : L.per_rental}</small></span></label>`
  }
  return `
    <div class="panel-step">
      <h2>${L.insurance}</h2>
      <div class="choices" role="radiogroup">
        ${Object.keys(INSURANCE).map((k) => `<label class="choice"><input type="radio" name="insurance" value="${k}" ${state.insurance === k ? 'checked' : ''}><span><b>${L['ins_' + k]}</b><small>${L['ins_' + k + '_d']}</small></span></label>`).join('')}
      </div>
      <h2 style="margin-top:24px">${L.extras}</h2>
      <div class="choices">${Object.keys(EXTRAS).map(extra).join('')}</div>
      <label class="check" style="margin-top:14px"><input type="checkbox" name="delivery" ${state.delivery ? 'checked' : ''}> <span>${L.delivery_opt}</span></label>
    </div>`
}

function step3() {
  const L = t()
  const e = state.showErrors ? driverProblems() : {}
  const dr = state.driver
  const field = (name, label, type, auto) => `
    <label class="f ${e[name] ? 'bad' : ''}"><span>${label}</span>
      <input type="${type}" name="d.${name}" value="${esc(dr[name])}" autocomplete="${auto}" ${e[name] ? `aria-invalid="true" aria-describedby="e-${name}"` : ''}>
      <p class="err" id="e-${name}">${e[name] ? L['err_' + e[name]] : ''}</p></label>`
  const box = (name, label) => `
    <label class="check"><input type="checkbox" name="d.${name}" ${dr[name] ? 'checked' : ''}> <span>${label}${e[name] ? `<br><span class="err">${L.err_check}</span>` : ''}</span></label>`
  return `
    <div class="panel-step">
      <h2>${L.s3}</h2>
      <div class="form-grid">
        ${field('first', L.first_name, 'text', 'given-name')}
        ${field('last', L.last_name, 'text', 'family-name')}
        ${field('email', L.email, 'email', 'email')}
        ${field('phone', L.phone, 'tel', 'tel')}
      </div>
      ${box('licence', L.licence_ok)}
      ${box('terms', L.terms_ok)}
    </div>`
}

function step4() {
  const L = t()
  return `
    <div class="done">
      <h2>${L.done_title}</h2>
      <p>${fill(L.done_text, { name: esc(state.driver.first) })}</p>
      <p class="ref">${state.ref}</p>
      <p class="small-note">${L.done_demo}</p>
      <button type="button" class="btn ghost" data-act="restart" style="margin-top:14px">${L.new_booking}</button>
    </div>`
}

function renderForm() {
  const L = t()
  const body = [step1, step2, step3, step4][state.step - 1]()
  const buttons = state.step === 4 ? '' : `
    <div class="nav-btns">
      ${state.step > 1 ? `<button type="button" class="btn ghost" data-act="back">${L.back}</button>` : '<span></span>'}
      <button type="submit" class="btn">${state.step === 3 ? L.confirm : L.next}</button>
    </div>`
  document.getElementById('form').innerHTML = body + buttons
  renderStepper()
}

function renderSummary() {
  const L = t()
  const v = vehicle(state.vehicleId)
  const b = booking()
  const valid = b.start && b.end && !isNaN(b.start) && !isNaN(b.end)
  const p = valid ? price(b) : null
  const head = `<div class="mini"><div class="art">${vehicleSvg(v)}</div><div><p class="kicker">${L.summary}</p><h3>${L.vehicles[v.id][0]}</h3></div></div>`
  if (!p) {
    document.getElementById('summary').innerHTML = head + `<p class="muted">${L.choose_dates}</p>`
    return
  }
  const qty = (l) => l.unit === 'pc' ? '' : l.key === 'rentalHalf' ? L.half_day : l.unit === 'pct' ? `${l.qty} %` : l.unit === 'km' ? `${num(l.qty)} km` : fill(L.days_n, { n: l.qty })
  document.getElementById('summary').innerHTML = head + `
    <dl class="kv">
      <dt>${L.pickup}</dt><dd>${b.start.toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' })}</dd>
      <dt>${L.return}</dt><dd>${b.end.toLocaleString(locale(), { dateStyle: 'medium', timeStyle: 'short' })}</dd>
      <dt>${L.duration}</dt><dd>${p.halfDay ? L.half_day : fill(L.days_n, { n: p.days })}</dd>
      <dt>${L.included_km}</dt><dd>${p.includedKm === Infinity ? L.unlimited : num(p.includedKm) + ' km'}</dd>
    </dl>
    <table class="lines"><tbody>
      ${p.lines.map((l) => `<tr class="${l.amount < 0 ? 'neg' : ''}"><td>${L.lines[l.key]}${qty(l) ? `<small>${qty(l)}</small>` : ''}</td><td>${money(l.amount, true)}</td></tr>`).join('')}
    </tbody></table>
    <div class="total"><span>${L.total}</span><b>${money(p.total, true)}</b></div>
    <p class="small-note">${L.vat_incl}${L.colon}${money(p.vat, true)}</p>
    <p class="small-note">${L.deposit}${L.colon}${money(p.deposit)}</p>
    <p class="small-note">${L.excess}${L.colon}${money(p.excess)}</p>`
}
const locale = () => (document.documentElement.lang === 'en' ? 'en-GB' : document.documentElement.lang === 'sq' ? 'sq-AL' : 'fr-CH')

function render() { renderForm(); renderSummary() }
startPage(render)

const form = document.getElementById('form')

form.addEventListener('input', (e) => {
  const el = e.target
  const n = el.name
  if (!n) return
  if (n.startsWith('d.')) {
    const k = n.slice(2)
    state.driver[k] = el.type === 'checkbox' ? el.checked : el.value
    if (state.showErrors && el.type === 'checkbox') renderForm()
    return
  }
  if (n === 'extra') state.extras[el.value] = el.checked
  else if (el.type === 'checkbox') state[n] = el.checked
  else if (n === 'km') state.km = Math.max(0, parseInt(el.value, 10) || 0)
  else state[n] = el.value
  if (n === 'unlimitedKm') form.querySelector('[name=km]').disabled = el.checked
  if (['vehicleId', 'start', 'end'].includes(n)) {
    const tmp = document.createElement('div'); tmp.innerHTML = step1()
    document.getElementById('date-notice').innerHTML = tmp.querySelector('#date-notice').innerHTML
  }
  renderSummary()
})

form.addEventListener('click', (e) => {
  const b = e.target.closest('button')
  if (!b) return
  if (b.dataset.alt) { state.vehicleId = b.dataset.alt; render() }
  else if (b.dataset.act === 'back') { state.step--; render(); focusTop() }
  else if (b.dataset.act === 'restart') {
    Object.assign(state, { step: 1, extras: {}, showErrors: false, ref: '', driver: { first: '', last: '', email: '', phone: '', licence: false, terms: false } })
    render(); focusTop()
  }
})

form.addEventListener('submit', (e) => {
  e.preventDefault()
  if (state.step === 1) {
    const { errors, busy } = dateProblems()
    if (errors.length || busy.length) { renderForm(); form.querySelector('.notice')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return }
  }
  if (state.step === 3) {
    state.showErrors = true
    const errs = driverProblems()
    if (Object.keys(errs).length) {
      renderForm()
      form.querySelector('[aria-invalid="true"], .err:not(:empty)')?.closest('label')?.querySelector('input')?.focus()
      return
    }
    state.ref = bookingRef()
  }
  state.step++
  render(); focusTop()
})

function focusTop() {
  document.getElementById('stepper').scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}
