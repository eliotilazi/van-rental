import { startPage, t, money } from './layout.js'
import { VEHICLES, INSURANCE, EXTRAS, DELIVERY_FEE, UNLIMITED_KM_PER_DAY, discountRate } from './pricing.js'

function render() {
  const L = t()
  const week = (v) => v.day * 7 * (1 - discountRate(7))
  document.getElementById('rates').innerHTML = `
    <thead><tr><th>${L.th_vehicle}</th><th class="n">${L.th_half}</th><th class="n">${L.th_day}</th><th class="n">${L.th_week}</th><th class="n">${L.th_km}</th><th class="n">${L.th_deposit}</th></tr></thead>
    <tbody>${VEHICLES.map((v) => `<tr><td><a href="reservation.html?v=${v.id}">${L.vehicles[v.id][0]}</a> <small class="muted">${L.licence} ${v.licence}</small></td>
      <td class="n">${money(v.halfDay)}</td><td class="n"><b>${money(v.day)}</b></td><td class="n">${money(week(v))}</td><td class="n">${money(v.extraKm, true)}</td><td class="n">${money(v.deposit)}</td></tr>`).join('')}</tbody>`
  document.getElementById('ins').innerHTML = `
    <thead><tr><th>${L.th_option}</th><th class="n">${L.th_price}</th><th class="n">${L.excess}</th></tr></thead>
    <tbody>${Object.entries(INSURANCE).map(([k, i]) => `<tr><td>${L['ins_' + k]}</td><td class="n">${i.perDay ? money(i.perDay) + ' ' + L.per_day_l : '0'}</td><td class="n">${money(i.excess)}</td></tr>`).join('')}</tbody>`
  const rows = Object.entries(EXTRAS).map(([k, e]) => [L.lines[k], `${money(e.price)} ${e.per === 'day' ? L.per_day_l : L.per_rental}`])
  rows.push([L.lines.unlimitedKm, `${money(UNLIMITED_KM_PER_DAY)} ${L.per_day_l}`], [L.lines.delivery, `${money(DELIVERY_FEE)} ${L.per_rental}`])
  document.getElementById('extras').innerHTML = `
    <thead><tr><th>${L.th_option}</th><th class="n">${L.th_price}</th></tr></thead>
    <tbody>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="n">${b}</td></tr>`).join('')}</tbody>`
}
startPage(render)
