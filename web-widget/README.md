# Musai Web Widget

A dependency-free, Shadow-DOM-isolated embed so a travel/insurance/study-abroad
platform can show a Musai safety-check-index card or bottom sheet — on a
voucher confirmation, pre-departure notice, or post-signup screen — without
conflicting with the host page's CSS.

## Embed on another site

```html
<div class="musai-safety-widget"
     data-country="FR"
     data-region="파리"
     data-layout="bottomsheet"
     data-api-base="https://your-musai-backend.example.com"></div>
<script src="https://aidenbkhan.github.io/musai/musai-widget.js" async></script>
```

Multiple widgets can be dropped on the same page — each `.musai-safety-widget`
element is picked up independently.

The mascot image is base64-embedded inside `musai-widget.js` itself, not a
separate file — if you copy just the `<div>` without pointing `script src`
at somewhere that actually serves the real file, nothing renders, image
included. Use the GitHub Pages URL above (once Pages is enabled on this
repo) or your own hosted copy.

### Data attributes

| Attribute         | Required | Description                                                                              |
|-------------------|----------|-------------------------------------------------------------------------------------------|
| `data-country`    | yes      | Destination's ISO 3166-1 alpha-2 country code (e.g. `FR`, `JP`, `KH`)                      |
| `data-region`     | no       | Region/city label shown above the score (display only; falls back to the backend's value) |
| `data-layout`     | no       | `card` (default, compact) · `bottomsheet` (full-width, bottom-anchored, close button) · `wide` (a long, low horizontal strip — mascot, gauge, headline, tags, Safe-How and actions spread across one row, not a scaled-up card — for a desktop sidebar or below-content placement, min-width 640px) · `bubble` (small fixed round icon + score badge, anchored to a viewport corner) · `banner` (inline CTA bar embedded in the host page's own content, e.g. under a booking-confirmation receipt — matches the proposal's own mockup) |
| `data-position`   | no       | `bubble`: which viewport corner it's fixed to — `bottom-right` (default) · `bottom-left` · `top-right` · `top-left`. `banner`: `inline` (default, sits wherever the host page puts the `<div>`) · `top`/`bottom` (sticks as a full-width bar fixed to that edge, like a cookie-consent bar). Ignored by other layouts. |
| `data-size`       | no       | `bubble`/`banner` only — `sm` · `md` (default) · `lg`. Every dimension scales together from one factor, so any size stays internally proportioned without clipping or overlap. |
| `data-close-to`   | no       | Only meaningful when `bottomsheet` is requested directly (not one already reached by expanding a `bubble`/`banner`, which always collapse back to themselves regardless of this) — `hide` (default, close button hides the widget outright) · `bubble`/`banner` (close button collapses it into that shape instead) |
| `data-lang`       | no       | `ko` · `en`. Without it, follows the visitor's own device/browser language (`navigator.language`) — not their IP or geographic location — defaulting to English for anything that isn't Korean. All UI chrome text and demo-mode data switch languages accordingly. |
| `data-api-base`   | no       | Base URL of a deployed `backend/` instance. Omit to force demo mode.                       |

`bubble` and `banner` both expand into `bottomsheet` on click, and the
bottomsheet's close button collapses them back to their original shape
(preserving whatever `data-position`/`data-size` they had) instead of
hiding the widget entirely. A directly-configured `bottomsheet` can opt
into the same collapse-instead-of-hide behavior via `data-close-to`.

### Dismissing the widget

Every layout has its own ✕ — `card`/`wide`/`bottomsheet` in the top-right
corner, `bubble`/`banner` as a small badge on the icon itself (clicking it
doesn't trigger the expand). `bubble`/`banner`'s own ✕ always hides
outright; it's a separate action from clicking the icon to expand.

`card`, `bottomsheet`, and `wide` also show a "don't show again this
week" checkbox next to the feedback row. Checking it before closing
snoozes *every* Musai widget on the site (not just that one instance)
for 7 days via `localStorage` — a visitor dismissing it is asking to be
left alone for a while, not just to shrink one destination's card. A
fresh `renderInto()` call (including the automatic data-attribute scan
on page load) checks this and skips rendering entirely while snoozed.

### Demo mode

If `data-api-base` is omitted, or the request fails or times out (3s), the
widget renders clearly-labeled placeholder data — using the same worked
examples as the backend's MVP destinations (Paris/Osaka/Phnom Penh) — instead
of a broken element, safe to embed even before a backend is deployed publicly.

Demo-mode data is fully bilingual (`data-lang`/device language switches
`countryName`/`regionName`/`contextLabel`/`riskTags`/`safeHowTips` too, not
just the UI chrome). A live `data-api-base` response is not translated by
the widget itself yet — that's the backend's job once it grows its own
`lang` support.

## Hosting the script

`musai-widget.js` is a single static file with no build step. Host it
anywhere (S3/CloudFront, GitHub Pages, the backend's own static file
serving, etc.) and point the host pages' `<script src>` at it.
