import { startPage, t } from './layout.js'
import { VEHICLES, KM_PER_DAY } from './pricing.js'

function render() {
  const L = t()
  const max = Math.max(...VEHICLES.map((v) => v.volume))
  document.getElementById('stats').innerHTML = [[VEHICLES.length, L.n_vehicles], [max, L.n_volume], [KM_PER_DAY, L.n_km], ['6/7', L.v2_t]]
    .map(([n, label]) => `<div class="stat card"><b>${n}</b><span>${label}</span></div>`).join('')
}
startPage(render)
