# Hold Button

A press-and-hold confirmation button for high-stakes actions. Hold it (with pointer or Space/Enter) and it compresses with progressive tremor, lavender charge fill and hot-pink leading stripe, levitating pebbles on a drawn ground line, rising aura lines, and ゴゴゴゴ. Reach 100% and it inverts for one frame, fires a starburst behind it with a ground shockwave ring, corner clouds, crystals and ドン!, then drifts smoke rings and lands a pink check with a glint. Letting go early vents a quiet puff without firing.

## Run it

```sh
python -m http.server 8000
# open http://localhost:8000/hold-button/
```

`?embed=1` hides the heading.

## Use it

`hold-button.js` is the whole component: one file, no dependencies.

```html
<script src="hold-button.js"></script>
<sakuga-hold-button duration="1.2">Hold to launch</sakuga-hold-button>
```

```js
const el = document.querySelector('sakuga-hold-button');
el.addEventListener('sakuga:confirm', () => launch());
el.reset();
```

| attribute | what it sets | default |
|---|---|---|
| `duration` | seconds required to hold before confirming | `1.2` |
| `hold` | seconds the pink check stays visible (`0` to keep) | `2.2` |
| `disabled` | disables holding | off |

- **Keyboard:** hold `Space` or `Enter` until full charge; releasing early cancels cleanly.
- **Parts:** `button`.

## What happens

| you | it |
|---|---|
| press & hold | squashes deeper as charge fills with lavender bar + pink leading edge; ground line draws underneath with four pebbles lifting off, rising speed lines and aura wisps on the flanks, tremor builds, ゴゴゴゴ rumbles above and clears right before 100% |
| release early | charge drains back briskly and vents a small puff off the top-right; no event fires |
| reach 100% | inverts ink for 0.19 s with -5° tilt and pop, starburst fires behind it, ground shockwave ring expands below, four corner clouds and crystals burst outward, ドン! lands above; 0.2 s later smoke rings drift off and a pink check lands with a glint |

## Limits

- Checked in headless Chromium with real touch and keyboard events and frame-by-frame sheets.
- The back-layer burst is clipped by an ancestor with `overflow: hidden`.
