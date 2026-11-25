# Copy

A copy-to-clipboard pill that reacts like a crisp mechanical lock: squashes on press with wedges, inverts ink for one frame on click, slices a pink crescent diagonally across the icon box, pops twin glints and a hollow カチッ, and flips the icon to a hot-pink checkmark without shifting button width.

## Run it

```sh
python -m http.server 8000
# open http://localhost:8000/copy/
```

`?embed=1` hides the heading.

## Use it

`copy.js` is the whole component: one file, no dependencies.

```html
<script src="copy.js"></script>
<sakuga-copy text="npx shadcn add finktheartist/sakuga-vfx/button"></sakuga-copy>
```

```js
const el = document.querySelector('sakuga-copy');
el.addEventListener('sakuga:copy', (e) => console.log(e.detail.text));
```

| attribute | what it sets | default |
|---|---|---|
| `text` | string copied to clipboard (and displayed if slot is empty) | `sakuga-vfx` |
| `label` | accessible `aria-label` | `Copy to clipboard` |
| `hold` | seconds the check stays before flipping back (`0` to stay) | `1.6` |
| `disabled` | disables copying | off |

- **Width:** set `--sk-copy-width` for the max snippet text width (default `236px`).
- **Clipboard fallback:** uses `navigator.clipboard.writeText` with a hidden `<textarea>` fallback for non-HTTPS origins.
- **Parts:** `button`, `code`, `icon`.

## What happens

| you | it |
|---|---|
| press | squashes flat; two pink wedges pop over the icon box |
| click | inverts ink for 0.12 s with a slight tilt, pink crescent slashes across the icon, wedges and a puff fire off the corner, icon flips to a pink check on a spring, hollow カチッ lands above, two glints sparkle at opposite corners |
| 1.6 s later | icon springs quietly back to the copy symbol |

## Limits

- Checked in headless Chromium with real touch and keyboard events and frame-by-frame sheets.
