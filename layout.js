// Shared code for every page: language, header, footer, money format and vehicle drawings.
import { TEXT } from './i18n.js'

const LANGS = ['fr', 'sq', 'en']

function pickLang() {
  const q = new URLSearchParams(location.search).get('lang')
  if (LANGS.includes(q)) return q
  try {
    const saved = localStorage.getItem('cl-lang')
    if (LANGS.includes(saved)) return saved
  } catch {}
  return 'en' // English by default; French and Albanian stay one click away
}

export const site = { lang: pickLang() }
export const t = () => TEXT[site.lang]
export const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k])

const locale = () => (site.lang === 'en' ? 'en-CH' : site.lang === 'sq' ? 'de-CH' : 'fr-CH')
export const money = (n, cents = false) =>
  new Intl.NumberFormat(locale(), { style: 'currency', currency: 'CHF', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(n)
export const num = (n) => new Intl.NumberFormat(locale()).format(n)
export const dateText = (d) => d.toLocaleDateString(site.lang === 'sq' ? 'sq-AL' : site.lang === 'en' ? 'en-GB' : 'fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const PAGES = [
  ['index.html', 'nav_home'], ['vehicules.html', 'nav_fleet'], ['tarifs.html', 'nav_prices'],
  ['a-propos.html', 'nav_about'], ['faq.html', 'nav_faq'], ['contact.html', 'nav_contact'],
]

function current() {
  const f = location.pathname.split('/').pop()
  return f === '' ? 'index.html' : f
}

function renderHeader() {
  const L = t()
  const here = current()
  document.getElementById('site-header').innerHTML = `
    <div class="wrap bar">
      <a class="brand" href="index.html" aria-label="Cargolac">${logo()}<span>Cargo<b>lac</b></span></a>
      <button class="burger" type="button" aria-expanded="false" aria-controls="nav">${L.menu}</button>
      <nav id="nav" class="nav">
        ${PAGES.map(([href, key]) => `<a href="${href}" ${href === here ? 'aria-current="page"' : ''}>${L[key]}</a>`).join('')}
        <a class="btn small" href="reservation.html" ${here === 'reservation.html' ? 'aria-current="page"' : ''}>${L.nav_book}</a>
        <span class="langs" role="group" aria-label="Language">
          ${LANGS.map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === site.lang}">${l.toUpperCase()}</button>`).join('')}
        </span>
      </nav>
    </div>`
}

function renderFooter() {
  const L = t()
  document.getElementById('site-footer').innerHTML = `
    <div class="wrap foot-grid">
      <div>
        <a class="brand" href="index.html">${logo()}<span>Cargo<b>lac</b></span></a>
        <p>${L.tagline}</p>
      </div>
      <div><p class="foot-h">${L.hours_label}</p><p>${L.hours}</p></div>
      <div><p class="foot-h">${L.nav_contact}</p><p>${L.address}<br>+41 22 000 00 00</p></div>
    </div>
    <div class="wrap foot-note">
      <p>${L.footer_demo}</p>
      <p>${L.built_by} <a href="https://eliotilazi.github.io">Eliot Ilazi</a> · <a href="https://github.com/eliotilazi/van-rental">GitHub</a></p>
    </div>`
}

function translateStatic() {
  document.documentElement.lang = site.lang
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t()[el.dataset.t] })
  document.querySelectorAll('[data-tp]').forEach((el) => { el.placeholder = t()[el.dataset.tp] })
}

// Each page passes its own render function, called again when the language changes.
export function startPage(render = () => {}) {
  const draw = () => { renderHeader(); renderFooter(); translateStatic(); render() }
  draw()
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button')
    if (!b) return
    if (b.dataset.lang) {
      site.lang = b.dataset.lang
      try { localStorage.setItem('cl-lang', site.lang) } catch {}
      draw()
    } else if (b.classList.contains('burger')) {
      const open = b.getAttribute('aria-expanded') !== 'true'
      b.setAttribute('aria-expanded', open)
      document.getElementById('nav').classList.toggle('open', open)
    }
  })
}

function logo() {
  return `<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="9" width="18" height="14" rx="2"/><path d="M20 13h5l4 5v5h-9z"/><circle cx="9" cy="25" r="3"/><circle cx="24" cy="25" r="3"/></svg>`
}

// Simple side-view drawing of each vehicle (all generic shapes).
export function vehicleSvg(v) {
  const W = (x1, y, x2) => `<circle class="wheel" cx="${x1}" cy="${y}" r="11"/><circle class="hub" cx="${x1}" cy="${y}" r="4"/><circle class="wheel" cx="${x2}" cy="${y}" r="11"/><circle class="hub" cx="${x2}" cy="${y}" r="4"/>`
  let body = ''
  switch (v.id) {
    case 'compact':
      body = `<path class="body" d="M58 92V52q0-8 8-8h78l26 22q8 6 8 14v12z"/><path class="glass" d="M146 50h-8v18h32z"/><rect class="stripe" x="58" y="74" width="120" height="5"/>` + W(82, 94, 156)
      break
    case 'van8':
    case 'van12': {
      const x0 = v.id === 'van8' ? 40 : 22
      const top = v.id === 'van8' ? 34 : 26
      body = `<path class="body" d="M${x0} 92V${top + 8}q0-8 8-8h134l18 26q8 8 8 18v${48 - top}z"/><path class="glass" d="M184 ${top + 6}h-10v24h28z"/><rect class="stripe" x="${x0}" y="72" width="${210 - x0}" height="5"/><line class="seam" x1="170" y1="${top + 2}" x2="170" y2="90"/>` + W(x0 + 30, 94, 180)
      break
    }
    case 'minibus':
      body = `<path class="body" d="M24 92V38q0-8 8-8h150l18 26q8 8 8 18v18z"/>${[34, 66, 98, 130].map((x) => `<rect class="glass" x="${x}" y="40" width="26" height="18" rx="3"/>`).join('')}<path class="glass" d="M184 36h-10v24h28z"/><rect class="stripe" x="24" y="72" width="184" height="5"/>` + W(56, 94, 178)
      break
    case 'tipper':
      body = `<path class="box" d="M22 78l6-26h122l6 26z"/><path class="body" d="M160 92V44q0-6 6-6h22l16 22q6 6 6 14v18z"/><path class="glass" d="M188 44h-14v20h26z"/><rect class="chassis" x="22" y="78" width="140" height="10"/>` + W(56, 94, 182)
      break
    default: { // box20 and truck35
      const big = v.id === 'truck35'
      const top = big ? 14 : 24
      body = `<rect class="box" x="${big ? 8 : 18}" y="${top}" width="${big ? 160 : 148}" height="${82 - top}" rx="4"/><rect class="stripe" x="${big ? 8 : 18}" y="70" width="${big ? 160 : 148}" height="5"/><path class="body" d="M170 92V46q0-6 6-6h18l14 20q6 6 6 14v18z"/><path class="glass" d="M194 46h-12v18h22z"/><rect class="chassis" x="${big ? 8 : 18}" y="82" width="200" height="8"/>` + W(big ? 48 : 52, 94, 188) + (big ? `<circle class="wheel" cx="76" cy="94" r="11"/><circle class="hub" cx="76" cy="94" r="4"/>` : '')
    }
  }
  return `<svg class="van" viewBox="0 0 230 110" role="img" aria-label="${esc(t().vehicles[v.id][0])}"><line class="ground" x1="0" y1="105" x2="230" y2="105"/>${body}</svg>`
}

export function vehicleCard(v) {
  const L = t()
  const [name, desc] = L.vehicles[v.id]
  const specs = [
    v.volume ? `<li><span>${L.volume}</span><b>${num(v.volume)} m³</b></li>` : `<li><span style="text-transform:capitalize">${L.seats}</span><b>${v.seats}</b></li>`,
    v.payload ? `<li><span>${L.payload}</span><b>${num(v.payload)} kg</b></li>` : '',
    `<li><span>${L.licence}</span><b>${v.licence}</b></li>`,
  ].join('')
  return `
    <article class="card vcard">
      <div class="art">${vehicleSvg(v)}</div>
      <h3>${name}</h3>
      <p class="muted">${desc}</p>
      <ul class="specs">${specs}</ul>
      <div class="price-row">
        <p class="price"><small>${L.from}</small> ${money(v.halfDay)} <small>${L.per_half}</small><br><b>${money(v.day)}</b> <small>${L.per_day}</small></p>
        <a class="btn" href="reservation.html?v=${v.id}">${L.book_this}</a>
      </div>
    </article>`
}
