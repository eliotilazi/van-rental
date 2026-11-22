import { startPage, t, esc } from './layout.js'

let query = ''
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function highlight(text) {
  if (!query) return esc(text)
  const i = norm(text).indexOf(norm(query))
  if (i < 0) return esc(text)
  return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + query.length)) + '</mark>' + esc(text.slice(i + query.length))
}

function render() {
  const items = t().faq.filter(([qq, a]) => !query || norm(qq + ' ' + a).includes(norm(query)))
  document.getElementById('list').innerHTML = items.map(([qq, a]) =>
    `<details ${query ? 'open' : ''}><summary>${highlight(qq)}</summary><p>${highlight(a)}</p></details>`).join('')
  document.getElementById('none').hidden = items.length > 0
}
startPage(render)
document.getElementById('q').addEventListener('input', (e) => { query = e.target.value.trim(); render() })
