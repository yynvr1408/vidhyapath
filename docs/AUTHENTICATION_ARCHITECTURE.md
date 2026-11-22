# Vidyapath Authentication

All sign-in and registration actions use one modal on the website landing page. `/login`, `/register`, and `/auth` are route aliases that open this same flow. A successful sign-in enters `/portal`.

## Session lifecycle

1. The website sends credentials to `POST /api/auth/login`.
2. The API verifies the account and issues a signed JWT. Production requires a `JWT_SECRET` with at least 32 characters; tokens expire after seven days.
3. `EnterpriseAuthContext` stores the token in `localStorage` and calls `GET /api/auth/me` when restoring a session.
4. The API checks the current account record on every protected request and uses its active role and institution. A stale token cannot keep a role that has been changed or suspended.
5. Sign-out clears the shared token and returns to the landing page.

## Credentials and registration

- Passwords are hashed with PBKDF2-SHA512 at 210,000 iterations. Verification also supports the older 10,000- and 1,000-iteration hashes so existing accounts can sign in during migration.
- Email verification uses one-time codes for registration and recovery. Development can display a code locally when no email provider is configured; production requires email delivery configuration.
- Students use their learner sign-in code and PIN. Guardians and institutional staff use email and password.
- Student and guardian registration are available in the shared modal. Institution applications require super-admin approval. Teacher accounts are created by an institution invitation; public teacher registration is disabled.
- Production does not create a shared administrator login. Configure `BOOTSTRAP_SUPER_ADMIN_EMAIL` and a unique `BOOTSTRAP_SUPER_ADMIN_PASSWORD` to initialize the operator account.

## Access control

Portal navigation is filtered by role, including direct links to `/portal/:section`. The API separately checks roles and institution or learner ownership before returning protected data. The backend does not rely on which role tab the browser selected.
