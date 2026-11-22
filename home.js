import { startPage, t, vehicleCard } from './layout.js'
import { VEHICLES, validateDates } from './pricing.js'
import { toInput, fromInput, defaultDates } from './dates.js'

const CATS = ['van', 'box', 'tipper', 'minibus']
const d = defaultDates()
const state = { cat: 'van', start: toInput(d.start), end: toInput(d.end) }

function render() {
  const L = t()
  const sel = document.getElementById('s-cat')
  sel.innerHTML = CATS.map((c) => `<option value="${c}" ${c === state.cat ? 'selected' : ''}>${L['cat_' + c]}</option>`).join('')
  document.getElementById('s-start').value = state.start
  document.getElementById('s-end').value = state.end
  document.getElementById('s-err').textContent = ''
  document.getElementById('featured').innerHTML = ['compact', 'van12', 'box20'].map((id) => vehicleCard(VEHICLES.find((v) => v.id === id))).join('')
}

startPage(render)

const form = document.getElementById('search')
form.addEventListener('input', (e) => {
  if (e.target.name) state[e.target.name] = e.target.value
})
form.addEventListener('submit', (e) => {
  e.preventDefault()
  const errors = validateDates(fromInput(state.start), fromInput(state.end))
  if (errors.length) {
    document.getElementById('s-err').textContent = t()['err_' + errors[0]]
    return
  }
  const q = new URLSearchParams({ cat: state.cat, start: state.start, end: state.end })
  location.href = 'reservation.html?' + q
})
