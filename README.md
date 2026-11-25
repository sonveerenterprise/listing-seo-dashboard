# Listing SEO dashboard

The web dashboard for **ListRankly**: pages, components, the API contract and a signed HTTP client.

It is a **client of the hosted Listing SEO core service**. The core, which holds the analysis, scoring, accounts,
credits and payments, is a separate private service and is **not** part of this repository. This dashboard does
nothing useful on its own; it needs the address of a core and a request-signing key issued by the core operator.

## What's here

| Path | What it is |
|---|---|
| `src/app` | Pages (`/`, `/check`, `/pricing`, `/login`, `/app/*`, legal pages) and the dashboard's own API routes, which forward to the core |
| `src/components` | UI components |
| `src/contract` | The public API contract: request and response types shared with the core |
| `src/core` | The signed HTTP client for the core API (HMAC request signing, HTTPS enforcement) |
| `src/lib` | Session cookies, CSRF guard, display settings |
| `src/middleware.ts` | Same-origin check for API writes; refreshes the user's short-lived access token |

## Security model

- Users sign in at the core (Google). The core issues short-lived, user-bound access tokens and rotating refresh
  tokens. The dashboard keeps them in httpOnly cookies (`__Host-` prefixed over HTTPS) and forwards the access token;
  it never decides who the user is.
- Every request to the core is signed (HMAC-SHA256 over method, path, timestamp, nonce, token hash and body hash).
- The dashboard has no database and refuses to start with database or core secrets in its environment.
- API writes are accepted only from the dashboard's own origin.

## Run

```bash
npm install
cp .env.example .env.local   # fill in CORE_URL, CORE_PUBLIC_URL, APP_URL and the signing key from the core operator
npm run dev                  # http://localhost:3000
```

```bash
npm run typecheck
npm test                     # unit tests, including the boundary guard
npm run build
```

## Licence

MIT — see [LICENSE](LICENSE). The licence covers this dashboard only; it grants no rights to the core service.
