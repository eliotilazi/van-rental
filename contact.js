import { startPage, t, esc } from './layout.js'

const state = { name: '', email: '', subject: 'booking', message: '', showErrors: false, sent: false }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function problems() {
  const e = {}
  if (!state.name.trim()) e.name = 'err_required'
  if (!state.email.trim()) e.email = 'err_required'; else if (!EMAIL.test(state.email.trim())) e.email = 'err_email'
  if (state.message.trim().length < 10) e.message = 'err_message'
  return e
}

function render() {
  const L = t()
  const e = state.showErrors ? problems() : {}
  const f = (name, label, input) => `<label class="f ${e[name] ? 'bad' : ''}"><span>${label}</span>${input}<p class="err">${e[name] ? L[e[name]] : ''}</p></label>`
  document.getElementById('form').innerHTML = state.sent
    ? `<p class="ok" role="status">${L.sent}</p>`
    : `<div class="form-grid">
        ${f('name', L.name, `<input name="name" autocomplete="name" value="${esc(state.name)}">`)}
        ${f('email', L.email, `<input name="email" type="email" autocomplete="email" value="${esc(state.email)}">`)}
      </div>
      ${f('subject', L.subject, `<select name="subject">${['booking', 'quote', 'other'].map((k) => `<option value="${k}" ${k === state.subject ? 'selected' : ''}>${L['sub_' + k]}</option>`).join('')}</select>`)}
      ${f('message', L.message, `<textarea name="message">${esc(state.message)}</textarea>`)}
      <button class="btn" type="submit">${L.send}</button>`
  document.getElementById('info').innerHTML = `
    <dl>
      <dt>${L.phone_label}</dt><dd><span>+41 22 000 00 00</span> <button type="button" class="copy" data-copy="+41 22 000 00 00">${L.copy}</button></dd>
      <dt>${L.email_label}</dt><dd><span>hello@cargolac.example</span> <button type="button" class="copy" data-copy="hello@cargolac.example">${L.copy}</button></dd>
      <dt>${L.hours_label}</dt><dd>${L.hours}</dd>
      <dt>${L.nav_contact}</dt><dd>${L.address}</dd>
    </dl>`
}
startPage(render)

const form = document.getElementById('form')
form.addEventListener('input', (e) => { if (e.target.name) state[e.target.name] = e.target.value })
form.addEventListener('submit', (e) => {
  e.preventDefault()
  state.showErrors = true
  if (Object.keys(problems()).length) { render(); form.querySelector('.bad input, .bad textarea')?.focus(); return }
  state.sent = true
  render()
})
document.getElementById('info').addEventListener('click', (e) => {
  const b = e.target.closest('[data-copy]')
  if (!b) return
  navigator.clipboard?.writeText(b.dataset.copy).then(() => {
    b.textContent = t().copied
    setTimeout(() => { b.textContent = t().copy }, 1500)
  }).catch(() => {
    const r = document.createRange(); r.selectNodeContents(b.previousElementSibling)
    getSelection().removeAllRanges(); getSelection().addRange(r)
  })
})
