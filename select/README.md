# Select

A dropdown that snaps open on a spring and locks in your pick with a slash and a hollow カチッ. Open it and the chevron flips, wedges flash at the corner, speed lines drop outside the menu flanks, and two puffs kick out from the seam. Pick an option and the trigger inverts for one frame and tilts, a crescent slashes across the corner, crystals chip off, and カチッ lands above.

## Run it

```sh
python -m http.server 8000
# open http://localhost:8000/select/
```

`?embed=1` hides the heading.

## Use it

`select.js` is the whole component: one file, no dependencies.

```html
<script src="select.js"></script>
<sakuga-select name="timing" label="Animation timing">
  <option value="ones" selected>On ones (24 fps)</option>
  <option value="twos">On twos (12 fps)</option>
  <option value="impact">Impact cut</option>
</sakuga-select>
```

```js
const el = document.querySelector('sakuga-select');
el.addEventListener('change', () => console.log(el.value));
el.value = 'impact';   // updates quietly without VFX
```

| attribute | what it sets | default |
|---|---|---|
| `value` | selected option value | first `<option>` |
| `label` | accessible `aria-label` | `Select` |
| `placeholder` | text when nothing is selected | `Choose...` |
| `name` | form field name (`FormData`) | none |
| `disabled` | disables opening and selection | off |

- **Width:** set `--sk-select-width` (default `236px`).
- **Keyboard:** `Enter`, `Space`, `ArrowDown`, `ArrowUp` open; `ArrowDown`/`ArrowUp`/`Home`/`End` navigate; `Enter`/`Space` pick; `Escape` closes.
- **Parts:** `select`, `trigger`, `menu`, `option`.

## What happens

| you | it |
|---|---|
| open | trigger squashes, chevron flips 180°, menu unfurls on a spring with corner wedges, flanking speed lines and two seam puffs |
| pick | chosen row flashes ink, trigger inverts for 0.12 s and tilts, a pink crescent slashes the lower-right, crystals fly off the edge, hollow カチッ lands above |
| close without picking | menu snaps shut briskly with a small puff underneath |

## Limits

- Checked in headless Chromium with real touch and keyboard events and frame-by-frame sheets.
- Menu sits at `z-index: 40` inside the component; an ancestor with `overflow: hidden` will clip the menu list.
