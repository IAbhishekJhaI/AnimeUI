# Accordion

Expandable sections that slice open on a spring with outside speed lines, lateral seam puffs, corner wedges and シュッ. Closing snaps shut briskly and puffs dust sideways out the seam.

## Run it

```sh
python -m http.server 8000
# open http://localhost:8000/accordion/
```

`?embed=1` hides the heading.

## Use it

`accordion.js` is the whole component: one file, no dependencies. Author sections as native `<details><summary>...</summary>...</details>` children.

```html
<script src="accordion.js"></script>
<sakuga-accordion>
  <details open>
    <summary>Keyframes &amp; timing</summary>
    <p>Four beats: anticipation, impact, follow-through, settle.</p>
  </details>
  <details>
    <summary>Two tones and a line</summary>
    <p>White light tone, lavender shadow, violet outline.</p>
  </details>
</sakuga-accordion>
```

```js
const el = document.querySelector('sakuga-accordion');
el.addEventListener('change', (e) => console.log(e.detail)); // { index, open, title }
el.toggle(1);
el.setOpen(0, true);
```

| attribute | what it sets | default |
|---|---|---|
| `multiple` | allow more than one panel open at once | off (single-open) |

- **Width:** set `--sk-accordion-width` (default `330px`).
- **Keyboard:** `ArrowDown`, `ArrowUp`, `Home`, `End` move focus between headers; `Enter` and `Space` toggle.
- **Parts:** `accordion`, `item`, `header`, `panel`.

## What happens

| you | it |
|---|---|
| open | header squashes, `+` collapses to `−` on a spring, panel springs open with flanking speed lines, seam puffs, top-right wedges and violet シュッ; wobble arcs settle the bottom corners |
| close | panel snaps shut cleanly and puffs two small dust clouds out the seam |

## Limits

- Checked in headless Chromium with real touch and keyboard events and frame-by-frame sheets.
- Section markup is read once when the element connects.
