# Dropzone

A file upload drop target that stretches eagerly with wobble arcs, inward speed lines and ゴゴゴゴ when you drag files over it, and catches dropped or selected files with a heavy squash, an impact flash, a cel-shaded splash crown off the top rim, a starburst behind the box, corner dust clouds, crystals and ズザッ in dotted letters.

## Run it

```sh
python -m http.server 8000
# open http://localhost:8000/dropzone/
```

`?embed=1` hides the heading.

## Use it

`dropzone.js` is the whole component: one file, no dependencies.

```html
<script src="dropzone.js"></script>
<sakuga-dropzone label="Drop keyframes here" hint="PNG or WebP" accept="image/*"></sakuga-dropzone>
```

```js
const el = document.querySelector('sakuga-dropzone');
el.addEventListener('change', () => console.log(el.files));
el.receive(['cut-04.png']); // trigger a drop programmatically
el.clear();                 // clear selected files
```

| attribute | what it sets | default |
|---|---|---|
| `label` | heading inside the dropzone | `Drop files here` |
| `hint` | secondary line underneath | `or click to browse` |
| `accept` | forwarded to `<input type="file">` | none |
| `multiple` | allows selecting multiple files | off |
| `disabled` | disables picking and dropping | off |

- **Width:** set `--sk-dropzone-width` (default `300px`).
- **Parts:** `zone`, `file`.

## What happens

| you | it |
|---|---|
| drag over | dashed border turns solid, box stretches taller on a spring, arrow lifts, downward speed lines pull inward, wobble arcs vibrate the sides, ゴゴゴゴ rumbles above-left |
| drop / pick file | box squashes hard and flashes ink for 0.11 s, a cel-shaded splash crown leaps off the top rim with flying teardrops, starburst bursts behind all four sides, dust puffs kick off the bottom corners, dotted ズザッ lands above-right, file pill springs in with a glint |
| clear (`✕`) | pill disappears with a quiet small puff |

## Limits

- Checked in headless Chromium with real touch and keyboard events and frame-by-frame sheets.
- Back-layer starburst is clipped by an ancestor with `overflow: hidden`.
