# Design: Zenith

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: playful
- Shape of the first page: app screen (a photographic hero over a two-column tool, then a model card tab)
- Theme: Piste, ground "snow" (snow-white paper, cold near-black ink, one cobalt)
- Axes: light/display-condensed/cool, posture: committed
- Signature: the climb gauge. A real photograph of the chosen peak, with a marker rising to the predicted odds on a scale built from the peak's real height.

## Tokens
`aplikasi/web/tokens.css` is the source of truth. The roles:
```css
:root {
  --color-paper: oklch(98.5% 0.005 260);  --color-paper-2: oklch(95.5% 0.008 260);  --color-paper-3: oklch(91% 0.01 260);
  --color-ink: oklch(16% 0.012 260);  --color-ink-2: oklch(30% 0.014 260);  --color-muted: oklch(48% 0.016 260);  --color-rule: oklch(88% 0.01 260);
  --color-accent: oklch(52% 0.25 265);  --color-accent-deep: oklch(40% 0.2 266);  --color-accent-ink: oklch(98.5% 0.004 260);  --color-focus: oklch(58% 0.22 28);
  --font-display: "Barlow Condensed", ui-sans-serif, sans-serif;  --font-body: "Barlow", ui-sans-serif, sans-serif;
  --radius-card: 0;  --radius-pill: 0;  --rule-hair: 1px;  --rule-bar: 2px;  --shadow-card: none;
}
```
Two tokens are added in `style.css`: `--color-rule-2` (ink at 22%) and `--color-scrim` (ink at 78%, the solid panel under text that sits on a photograph). The spacing scale, type scale, easings and durations live in `tokens.css`.

## Type
- Display: Barlow Condensed 800, uppercase, for every head, figure and button.
- Body and labels: Barlow 400 and 500, sentence case, untracked.
- Figures are tabular. A figure on paper is cobalt.

## Controls
- Primary: cobalt fill, white ink, square, 44px, Barlow Condensed 800 capitals
- Secondary: 2px inset ink outline, same size and radius
- Choice groups: square ink-bordered buttons, the selected one filled cobalt
- Inputs: square, 44px, 1px ink border on paper; sliders have a 2px ink track and a square cobalt thumb

## Surfaces
- Ruled, never boxed: a 2px ink rule above a list, table head or figure; 1px hairlines between rows.
- Radius 0 everywhere. No shadows, no blur, no gradients.
- Photographs: full colour, high key, cut square, from Wikimedia Commons, credited in the footer. A peak without its own photograph uses Pumori and the page says so.

## Motion
- Character: calm and alive. The theme default is still; this project turns motion on deliberately and keeps it to transform, opacity and stroke-dashoffset.
- In use: the photograph drifts and follows the pointer, snow falls, the gauge marker climbs, the percentage counts up, charts draw in, bars grow.
- Under reduced motion everything ends at once and the snow is hidden.

## Where the words live
- `aplikasi/web/teks.js`: every word on the page, in Indonesian and English side by side. The `html` part fills elements marked `data-t` in `index.html`; the rest is printed by JavaScript.
- The server sends codes only, never sentences.
- Voice: a calm, precise, formal explainer. Indonesian uses the standard register (no colloquial forms) and addresses the reader as "Anda"; English addresses the reader as "you". Short active sentences, one idea each. Sources in `catatan/riset-teks-dwibahasa.md`.
- Language: `lang` on `<html>` follows the active language; the switch names each language in itself; the choice is stored in localStorage; numbers use `Intl` with `id-ID` or `en-US`.

## Exports
`tokens.css` in this project. Tailwind, DTCG or shadcn blocks are added here on request, per `export-formats.md`.
