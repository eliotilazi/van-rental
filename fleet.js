import { startPage, t, fill, vehicleCard } from './layout.js'
import { VEHICLES } from './pricing.js'

const CATS = ['all', 'van', 'box', 'tipper', 'minibus']
const state = { cat: 'all', onlyB: false, sort: 'price' }

const SORTS = {
  price: (a, b) => a.day - b.day,
  price_desc: (a, b) => b.day - a.day,
  volume: (a, b) => b.volume - a.volume,
}

export function filterFleet(list, s) {
  return list
    .filter((v) => s.cat === 'all' || v.cat === s.cat)
    .filter((v) => !s.onlyB || v.licence === 'B')
    .sort(SORTS[s.sort])
}

function render() {
  const L = t()
  document.getElementById('cats').innerHTML = CATS.map((c) =>
    `<button type="button" data-cat="${c}" aria-pressed="${c === state.cat}">${L['cat_' + c]}</button>`).join('')
  document.getElementById('sort').innerHTML = Object.keys(SORTS).map((k) =>
    `<option value="${k}" ${k === state.sort ? 'selected' : ''}>${L['sort_' + k]}</option>`).join('')
  document.getElementById('onlyB').checked = state.onlyB
  const list = filterFleet(VEHICLES, state)
  document.getElementById('count').textContent = fill(L.results, { n: list.length })
  document.getElementById('fleet').innerHTML = list.length ? list.map(vehicleCard).join('') : `<p class="muted">${L.no_results}</p>`
}

const hashCat = location.hash.slice(1)
if (CATS.includes(hashCat)) state.cat = hashCat

startPage(render)

document.getElementById('cats').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]')
  if (!b) return
  state.cat = b.dataset.cat
  render()
})
document.getElementById('onlyB').addEventListener('change', (e) => { state.onlyB = e.target.checked; render() })
document.getElementById('sort').addEventListener('change', (e) => { state.sort = e.target.value; render() })
