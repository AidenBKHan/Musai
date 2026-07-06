# Musai Web Widget

A dependency-free, Shadow-DOM-isolated embed so any external website can show
a Musai safety-index card without conflicting with the host page's CSS.

## Embed on another site

```html
<div class="musai-safety-widget"
     data-country="KR"
     data-region="Seoul"
     data-api-base="https://your-musai-backend.example.com"></div>
<script src="https://your-cdn.example.com/musai-widget.js" async></script>
```

Multiple widgets can be dropped on the same page — each `.musai-safety-widget`
element is picked up independently.

### Data attributes

| Attribute         | Required | Description                                                        |
|-------------------|----------|---------------------------------------------------------------------|
| `data-country`    | yes      | ISO 3166-1 alpha-2 country code (e.g. `KR`, `US`, `FR`)              |
| `data-region`     | no       | Region/city label shown above the score (display only)              |
| `data-api-base`   | no       | Base URL of a deployed `backend/` instance. Omit to force demo mode. |

### Demo mode

If `data-api-base` is omitted, or the request fails or times out (3s), the
widget renders clearly-labeled placeholder data instead of a broken
element — safe to embed even before a backend is deployed publicly.

## Hosting the script

`musai-widget.js` is a single static file with no build step. Host it
anywhere (S3/CloudFront, GitHub Pages, the backend's own static file
serving, etc.) and point the host pages' `<script src>` at it.
