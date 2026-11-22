# Vidyapath Web Architecture

The supported application is a responsive browser website. The repository has no Android project, native application package, or APK release workflow. Android packaging can be added in a later project phase.

## Routes and sessions

- `frontend/src/App.tsx` is the single route entry point. `/` displays the landing page. `/login`, `/register`, and `/auth` resolve to the same page and open the shared authentication modal.
- Authenticated routes use `/portal` and `/portal/:section`. The portal reads the URL on load and handles browser Back/Forward. Old `/learn`, `/student`, `/guardian`, `/parent`, and `/admin` paths resolve to the same portal.
- `EnterpriseAuthContext` stores one session token and reloads the current account through `/api/auth/me`. The server reads the live role and institution from the account record on every authenticated request.
- Portal navigation and direct links use the same role allowlist. The API independently checks role and institution scope for protected data and writes.

## Learning data and synchronization

- Departments and programmes hydrate from PostgreSQL when Render starts. Institution staff create those records through the authenticated portal; the API checks role, institution, and programme hierarchy before saving.
- Syllabus processing requires a real department, programme, semester, version, and subject details. The API rejects incomplete drafts and writes published subjects to PostgreSQL before acknowledging success.
- Learner progress is queued in browser IndexedDB by learner identity. Sync requests include only the active learner's records and the API verifies account ownership before accepting them.
- Without a configured database, local development may use process memory for server data. Production startup requires PostgreSQL and a configured bootstrap administrator.

## Netlify and Render layout

- `frontend/` contains the Vite website, its TypeScript configuration, package manifest, and lockfile. Netlify builds this directory and publishes `frontend/dist`.
- `backend/` contains the Express API, its TypeScript configuration, package manifest, and lockfile. Render uses this as its root directory and exposes `/readyz` as the health check.
- `netlify.toml` forwards `/api/*` and `/uploads/*` to the Render service and falls back to `index.html` for website routes.
- Shared tests and repository-level developer commands remain at the repository root.
