# Stepper

A numeric counter whose digit punches up on a spring with wedges, a puff and a hollow ポン. Reaching `max` triggers a starburst behind the control with flying crystals and a glint; pressing past `min` or `max` shudders the control horizontally with wobble arcs and chips off the slammed edge.

## Run it

```sh
python -m http.server 8000
# open http://localhost:8000/stepper/
```

`?embed=1` hides the heading.

## Use it

`stepper.js` is the whole component: one file, no dependencies.

```html
<script src="stepper.js"></script>
<sakuga-stepper name="qty" value="3" min="0" max="5" label="Copies"></sakuga-stepper>
```

```js
const el = document.querySelector('sakuga-stepper');
el.addEventListener('change', () => console.log(el.valueAsNumber));
el.value = 2; // updates quietly
```

| attribute | what it sets | default |
|---|---|---|
| `value` | initial number | `min` |
| `min` | minimum allowed value | `0` |
| `max` | maximum allowed value | `10` |
| `step` | increment/decrement step | `1` |
| `unit` | suffix displayed after the number | none |
| `label` | accessible label for the spinbutton | `Quantity` |
| `name` | form field name (`FormData`) | none |
| `disabled` | disables stepping | off |

- **Keyboard:** focus the center value (`role="spinbutton"`) and use `ArrowUp`/`ArrowRight`, `ArrowDown`/`ArrowLeft`, `Home`, `End`.
- **Parts:** `stepper`, `decrement`, `value`, `increment`.

## What happens

| you | it |
|---|---|
| increment (`+`) | cap flashes ink, digit punches upward with tilt, wedges and puff fire off the corner, hollow ポン pops above (debounced so rapid taps never overlap) |
| reach `max` | spiky burst goes off behind the stepper, crystals scatter off both edges, glint lands on the top-right corner |
| decrement (`−`) | cap flashes ink, digit dips down with downward speed lines and a quiet puff |
| press past limit | whole box shudders horizontally on a spring, wobble arcs and chips fire off the slammed side |

## Limits

- Checked in headless Chromium with real touch and keyboard events and frame-by-frame sheets.
- The back-layer burst on `max` is clipped by an ancestor with `overflow: hidden`.
