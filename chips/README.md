# Chips

Selectable and optionally removable filter pills. Pick one and it flashes ink, pops with a starburst behind it, crystals off the flanks, a glint and a hollow ポン. Remove one (with `removable`) and a diagonal pink crescent slices through it with ズザッ in dotted screentone letters as it shrinks away.

## Run it

```sh
python -m http.server 8000
# open http://localhost:8000/chips/
```

`?embed=1` hides the heading.

## Use it

`chips.js` is the whole component: one file, no dependencies. List tags as `<option>` elements inside it.

```html
<script src="chips.js"></script>
<sakuga-chips name="tags" label="Effects" removable>
  <option value="smears" selected>Smears</option>
  <option value="impact">Impact</option>
  <option value="smoke">Smoke</option>
</sakuga-chips>
```

```js
const el = document.querySelector('sakuga-chips');
el.addEventListener('change', () => console.log(el.values));
el.addEventListener('sakuga:remove', (e) => console.log('removed', e.detail));
el.reset(); // restores initial options
```

| attribute | what it sets | default |
|---|---|---|
| `removable` | shows an `✕` remove button on each chip | off |
| `single` | allows only one selected chip at a time | off (multi-select) |
| `label` | accessible `aria-label` on the group | `Tags` |
| `name` | form field name (`FormData`, comma-joined) | none |
| `disabled` | disables toggling and removing | off |

- **Parts:** `chips`, `chip`, `toggle`, `remove`.

## What happens

| you | it |
|---|---|
| select a chip | flashes ink for 0.11 s, pops with tilt, starburst fires behind it, crystals fly off the sides, pink wedges fan above, glint lands, hollow ポン pops up |
| deselect a chip | dips quietly with a small puff |
| remove (`✕`) | diagonal pink slash slices through it, crystals scatter, puff and dotted ズザッ appear while the chip shrinks cleanly to zero |

## Limits

- Checked in headless Chromium with real touch and keyboard events and frame-by-frame sheets.
- Back-layer bursts are clipped by an ancestor with `overflow: hidden`.
