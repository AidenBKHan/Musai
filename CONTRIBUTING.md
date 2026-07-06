# Contributing

## Adding a new country's safety data source

1. Create `backend/src/sources/<country-code>/<agencyName>Source.ts`
   implementing the `SafetySource` interface from `backend/src/sources/types.ts`.
2. Normalize the agency's raw fields into `SafetyIndexFactor[]` and let
   `computeOverallScore` derive the headline score.
3. Register the source in `backend/src/sources/registry.ts`, ahead of
   `PlaceholderGlobalSource`.
4. Add a test in `backend/test/` covering the new country code.

## Before opening a PR

```
cd backend && npm run lint && npm test
cd app && flutter analyze && flutter test
```

## Secrets

Never commit API keys or `.env` files. Use `backend/.env.example` as the
template for any new environment variable.
