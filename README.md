# Vidyapath

Vidyapath is a browser based learning and institutional LMS. It uses one landing page, one shared sign in and registration modal, and one authenticated portal whose navigation is based on the signed in role.

The repository has separate deployable folders:

- `frontend/` — React and Vite website for Netlify.
- `backend/` — Express API for Render.
- `tests/` — shared checks run from the repository root.

There is no Android application, native mobile module, APK release process, or separate login page. The responsive website can be opened in desktop and mobile browsers.

## 🔑 Admin Syllabus-to-RAG Ingestion Portal (`/admin`)

Vidyapath provides a dedicated, separate **Admin Syllabus Panel** accessible exclusively at the `/admin` route (isolated from the student landing page and learning interface):

- **URL:** `http://localhost:3000/admin`
- **Default Credentials:**
  - **Username:** `Admin`
  - **Password:** `admin123`

### How Uploading a Syllabus Updates the AI Tutor Live:
1. **In-Memory Upload:** The admin selects the target language (`te` for Telugu, `hi` for Hindi, `en` for English), class level (e.g., `10`), and subject name (e.g., `Mathematics`). An official syllabus document (`.pdf`, `.txt`, `.md`) can be uploaded or pasted directly as raw text. Zero bytes are written to disk (`multer.memoryStorage()`).
2. **Curriculum Structuring:** The backend processes the document through an LLM parser (with automatic rule-based fallback if offline) to extract structured chapters (`id`, `title`, `summary`) and detailed concepts (`id`, `title`, `explanation`, `keyPoints`).
3. **Live RAG Ingestion:** The backend indexes all concepts and summaries into searchable RAG chunks within `syllabusStore` and updates the active syllabus pointer.
4. **Instant Student Reflection:**
   - **My Syllabus (Learn):** Immediately renders the new chapters, concepts, and worked examples.
   - **AI Tutor (Ask Doubt):** Socratic chapter intent detection matches student queries against the new chapters, serves clickable concept chips, and retrieves matched syllabus chunks for ChatGPT-style explanations.

## Roles and access

- Students see their own published syllabus, assignments, quizzes, tutor, and learning records.
- Guardians see students linked to their family account and the records returned for those students.
- Teachers see assigned subjects and their course work. Institution administrators invite teacher accounts.
- Institution and academic administrators manage their institution's structure and published curriculum.
- Super administrators manage platform level institution approvals and audit tools.

The API checks the current account role and institution scope on each protected request. Users register with verified email; teachers are invited by institution staff. Production has no shared default login credentials. Existing known seeded administrator email accounts are removed when the backend starts; the operator configured bootstrap account is retained or updated.

## Local development

Install repository tooling and dependencies:

```sh
npm ci
```

Copy `.env.example` to `.env` and configure `DATABASE_URL` if you want durable local data. In separate terminals, run:

```sh
npm run server
npm run dev
```

The web app runs on `http://localhost:3000`; Vite proxies `/api` to the backend on port `3001`. Local development can use the process generated signing key. Email verification codes are returned only in development when EmailJS is not configured.

## Deploy the frontend to Netlify

The `netlify.toml` build base is `frontend`:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`

The Netlify redirects proxy `/api/*` and `/uploads/*` to the Render API and route browser paths back to `index.html`. Update the Render hostname in `netlify.toml` if Render gives the service a different URL.

## Deploy the backend to Render

`render.yaml` sets the service root to `backend`:

- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check: `/readyz`

If an existing Render service is configured with the Docker runtime at the repository root, the root `Dockerfile` builds the workspace and runs the API from `backend/`; the frontend remains deployed independently to Netlify. For the Node runtime described by `render.yaml`, set Render's Root Directory to `backend`.

Configure these required production values in Render:

- `DATABASE_URL` — Neon or another compatible PostgreSQL connection string.
- `JWT_SECRET` — at least 32 random characters.
- `BOOTSTRAP_SUPER_ADMIN_EMAIL` and `BOOTSTRAP_SUPER_ADMIN_PASSWORD` — use a unique password with at least 12 characters.
- `ALLOWED_ORIGINS` — comma separated Netlify production and preview origins allowed to call the API.
- EmailJS service, template, and key values — required for verification codes, password resets, and teacher invitations.

AI tutoring, voice, and object storage also require their corresponding optional provider credentials in `render.yaml`. Production refuses to start without durable PostgreSQL and a configured bootstrap administrator.

## Checks

```sh
npm test
npm run test:unit
npm run build
```

`npm run build` builds `frontend/` and type checks `backend/`. The root package is for shared development and test tooling; each deployment folder has its own `package.json`, TypeScript config, and lockfile so Netlify and Render can build independently.
