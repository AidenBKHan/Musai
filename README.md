# Musai

A GovTech safety-check-index widget that connects Korea's Ministry of
Foreign Affairs (외교부) overseas-travel public data directly into the
screens travelers already use — a travel-insurance voucher confirmation, a
pre-departure notice, a study-abroad/business-trip briefing — instead of
requiring a separate search. Ships as a Flutter app + home-screen widget and
as an embeddable web widget (card or bottom-sheet layout) that any travel/
insurance/study-abroad platform can drop into its own booking flow.

The safety-check index (0–100, plus a status band like "유의 필요") is a
weighted composite of 여행경보 단계 (travel advisory tier) · 최근 공지
(recent notices) · 사건사고·치안정보 (incident/security info) · 기상·재난정보
(weather/disaster info), with an optional real-time event correction —
backed by a pluggable API so more destinations/agencies can be added over
time.

## Structure

```
app/         Flutter app + Android/iOS home-screen widget
backend/     TypeScript/Express API that aggregates per-country data sources
web-widget/  Embeddable JS widget for third-party websites
docs/        GitHub Pages source of truth (also duplicated at repo root, see below)
```

## App (`app/`)

```
cd app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:8080
```

- `lib/src/services/safety_index_api.dart` — talks to the backend.
- `lib/src/widgets/home_widget_service.dart` — pushes the looked-up index to
  the native home-screen widget via the `home_widget` package.
- `android/` — the Android App Widget (`SafetyIndexWidgetProvider`) is fully
  wired up.
- `ios/SafetyIndexWidget/` — the iOS WidgetKit extension's Swift source is
  provided as a reference; adding it as an actual Xcode target requires
  Xcode itself (see `ios/SafetyIndexWidget/README.md`).

## Backend (`backend/`)

```
cd backend
cp .env.example .env
npm install
npm run dev
```

- `src/models/safetyIndex.ts` — the shared `SafetyIndex` shape (score,
  status band, Safe-How tip, source) and `computeSafetyCheckIndex()`, which
  implements the proposal's 종합위험점수 → 안전체크지수 formula. The
  score→status thresholds are provisional pending real ministry calibration.
- `src/sources/types.ts` defines the `SafetySource` plugin interface — one
  implementation per country/agency, normalized into the shared shape.
- `src/sources/kr/dataGoKrSource.ts` — the three MVP destinations from the
  proposal (Paris/Osaka/Phnom Penh, keyed by destination country code FR/JP/
  KH — MOFA data describes foreign destinations for outbound Korean
  travelers, not Korea itself). Runs on the proposal's own worked-example
  risk components until `DATA_GO_KR_SERVICE_KEY` is set *and* the real MOFA
  datasets are wired up — see the TODO in that file for the confirmed
  dataset names/endpoints on data.go.kr (여행경보, 안전공지, 사건사고 유형,
  특별여행주의보, 재외공관 정보, 국가표준코드 등).
- `src/sources/global/placeholderSource.ts` — stand-in for every other
  country until a real source is added, so the rest of the pipeline (API →
  app → widget) is exercisable end-to-end today.
- `npm test` runs the API test suite (vitest + supertest) — includes an
  exact reproduction of the proposal's Paris example (72점 / 유의 필요).

Adding a new destination: implement `SafetySource`, register it in
`src/sources/registry.ts` ahead of the placeholder fallback.

## Web widget (`web-widget/`)

A dependency-free JS embed any travel/insurance/study-abroad platform can
drop into its own booking-confirmation flow:

```html
<div class="musai-safety-widget" data-country="FR" data-region="파리"
     data-layout="bottomsheet"
     data-api-base="https://your-musai-backend.example.com"></div>
<script src="https://your-cdn.example.com/musai-widget.js" async></script>
```

`data-layout` is `card` (default, compact) or `bottomsheet` (full-width,
anchored to the bottom of the viewport, with a dismiss button — matching the
proposal's mobile/tablet voucher-confirmation mockups). Falls back to
clearly-labeled demo data (using the proposal's own Paris/Osaka/Phnom Penh
examples) if `data-api-base` is omitted or the request fails/times out. See
`web-widget/README.md` for all options.

## GitHub Pages site

`index.html`, `widget-setup.html`, and `musai-widget.js` are duplicated at
the repo root (in addition to `docs/`) so the site works no matter which
folder Settings → Pages is pointed at — root or `/docs` — without needing
that dropdown fixed first. `.nojekyll` at the root disables Jekyll
processing so GitHub serves these files as-is instead of auto-rendering
`README.md`. Keep the root copies and `docs/` copies in sync until there's a
build step; `docs/` remains the source of truth to edit.

- `index.html` / `docs/index.html` — the project homepage: pick a
  destination (or auto-detect by IP) to see the widget render live, in demo
  mode until a backend is deployed.
- `widget-setup.html` / `docs/widget-setup.html` — integration guide for a
  travel/insurance/study-abroad platform embedding the widget: fill in
  destination/region/layout/API base and it generates the exact snippet to
  paste, with a live preview.

Pages must still be enabled once by the repo owner at **Settings → Pages →
Source: Deploy from a branch → Branch: `main`** (root or `/docs`, either
works now). Once enabled it's reachable at `https://<owner>.github.io/<repo>/`.

## Secrets

Never commit `backend/.env` or any real API key — `DATA_GO_KR_SERVICE_KEY`
and any future government API credentials belong in `.env` only (already
gitignored). Copy `backend/.env.example` and fill in local values.

## Open collaboration

This repo's visibility (private/public) can only be changed by the GitHub
owner, from **Settings → General → Danger Zone → Change visibility** — it
isn't something that can be flipped from the outside. Before making it
public, double check no real credentials have ever been committed (rotate
any that were), and settle on a license appropriate for a government-linked
commercial project.
