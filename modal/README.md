# Modal

A dialog that drops in from above stretching with velocity and speed lines over a manga screentone backdrop, slams into center with a starburst behind it, ground dust clouds out the bottom corners, crystals and ドン!, and closes by shrinking away cleanly with a smoke ring and twin puffs.

## Run it

```sh
python -m http.server 8000
# open http://localhost:8000/modal/
```

`?embed=1` hides the heading.

## Use it

`modal.js` is the whole component: one file, no dependencies.

```html
<script src="modal.js"></script>
<sakuga-modal id="dlg" title="Cut #42 ready">
  <p>Confirm exporting all keyframes?</p>
  <div slot="footer">
    <button onclick="dlg.close()">Cancel</button>
    <button onclick="dlg.close()">Ship it</button>
  </div>
</sakuga-modal>
```

```js
const dlg = document.getElementById('dlg');
dlg.open();
dlg.close();
dlg.addEventListener('sakuga:open', () => {});
dlg.addEventListener('sakuga:close', () => {});
```

| attribute | what it sets | default |
|---|---|---|
| `title` | dialog heading text | `Dialog` |
| `open` | opens the dialog initially | off |
| `persistent` | prevents closing on Escape or backdrop click | off |

- **Width:** set `--sk-modal-width` (default `420px`).
- **Focus & keys:** focuses the dialog on open, closes on `Escape` and backdrop click (unless `persistent`), and restores focus to the triggering element on close.
- **Parts:** `backdrop`, `dialog`, `header`, `close`, `body`, `footer`.

## What happens

| you | it |
|---|---|
| `open()` | manga halftone dot backdrop appears; dialog drops from above stretching vertically with speed lines |
| landing | squashes wide on impact, starburst bursts behind the card (above the backdrop), dust puffs and crystals kick out below the bottom edge, ドン! lands above the top border, wobble arcs settle both sides |
| `close()` | dialog shrinks briskly to zero (no opacity fade), leaving a ring and two puffs |

## Limits

- Checked in headless Chromium with real touch and keyboard events and frame-by-frame sheets.
- Uses `z-index: 2147482000` so the shared `canvas.sakuga-fx` (`2147483000`) renders front effects cleanly over the modal.
