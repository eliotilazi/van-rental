# Cargolac: van rental website (FR · SQ · EN)

A complete website for a fictional van and truck rental company in Nyon, Switzerland: 7 pages, a fleet with filters, and an online booking in three steps with a live price.

**Live demo:** https://eliotilazi.github.io/van-rental/

## What works

- **Home**: quick search (vehicle type and dates) that opens the booking with everything filled in
- **Vehicles**: 7 vehicles, filter by type and licence, sort by price or volume
- **Booking** in 3 steps, with a summary that updates on every change:
  - vehicle, dates and planned kilometres
  - insurance (3 levels), equipment, delivery
  - driver details with validation (email, phone, licence, terms)
  - booking number at the end (nothing is really sent)
- **Business rules**: half day up to 5 hours, 1 hour of grace, 100 km included per day, extra km price per vehicle, unlimited km package, -8 % from 3 days and -15 % from 7 days, VAT 8.1 % included, deposit and excess
- **Opening hours**: pick-up and return only Monday to Saturday, 7:00 to 19:00
- **Availability**: some days are already booked; the site then suggests free vehicles of the same type
- **Prices**, **About**, **FAQ** (with search) and **Contact** (form with validation)
- French, Albanian and English, light and dark mode, works on mobile

## How it is organised

| File | Role |
| --- | --- |
| `pricing.js` | Prices and booking rules, pure functions without HTML |
| `i18n.js` | All the texts in 3 languages |
| `layout.js` | Header, footer, language switch, vehicle drawings and cards |
| `book.js` | The booking form and the live summary |
| `home.js`, `fleet.js`, `prices.js`, `faq.js`, `contact.js`, `about.js` | One script per page |
| `test.mjs` | 36 tests: durations, discounts, kilometres, options, opening hours, availability, translations |

No framework and no build step: HTML, CSS and JavaScript modules.

## Run it locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
node test.mjs                 # run the tests
```

Cargolac is a fictional company and all prices are examples. Built by [Eliot Ilazi](https://eliotilazi.github.io).
