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
| `data-layout`     | no       | `card` (default, compact) · `bottomsheet` (full-width, bottom-anchored, close button) · `wide` (horizontal, large mascot illustration — for a desktop sidebar) · `bubble` (small fixed round icon + score badge, anchored to a viewport corner) · `banner` (inline CTA bar embedded in the host page's own content, e.g. under a booking-confirmation receipt — matches the proposal's own mockup) |
| `data-api-base`   | no       | Base URL of a deployed `backend/` instance. Omit to force demo mode.                       |

`bubble` and `banner` both expand into `bottomsheet` on click, and the
bottomsheet's close button collapses them back to their original shape
instead of hiding the widget entirely.

### Demo mode

If `data-api-base` is omitted, or the request fails or times out (3s), the
widget renders clearly-labeled placeholder data — using the same worked
examples as the backend's MVP destinations (Paris/Osaka/Phnom Penh) — instead
of a broken element, safe to embed even before a backend is deployed publicly.

## Hosting the script

`musai-widget.js` is a single static file with no build step. Host it
anywhere (S3/CloudFront, GitHub Pages, the backend's own static file
serving, etc.) and point the host pages' `<script src>` at it.
