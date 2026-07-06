# Musai

Global safety index — a Flutter app (iOS/Android) with a home-screen widget,
backed by a pluggable API that aggregates each country's public safety data
(starting with Korea's [공공데이터포털](https://www.data.go.kr)) into one
normalized score.

## Structure

```
app/       Flutter app + Android/iOS home-screen widget
backend/   TypeScript/Express API that aggregates per-country data sources
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

- `src/sources/types.ts` defines the `SafetySource` plugin interface — one
  implementation per country/agency, normalized into a shared `SafetyIndex`
  shape.
- `src/sources/kr/dataGoKrSource.ts` — Korea, via data.go.kr. Runs on
  clearly-labeled placeholder data until `DATA_GO_KR_SERVICE_KEY` is set
  *and* the specific datasets (crime/disaster/traffic stats) are wired up —
  see the TODO in that file.
- `src/sources/global/placeholderSource.ts` — stand-in for every other
  country until a real source is added, so the rest of the pipeline (API →
  app → widget) is exercisable end-to-end today.
- `npm test` runs the API test suite (vitest + supertest).

Adding a new country: implement `SafetySource`, register it in
`src/sources/registry.ts` ahead of the placeholder fallback.

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
