# Vidyapath Web-First Architecture

**Current direction:** the supported product is a responsive browser PWA. Android packaging is deferred.

## What was colliding

- `src/App.tsx` had separate browser and Capacitor render trees. A route could therefore render different screens depending on how the same site was opened.
- The main app and the native navigation manager both listened for `popstate`. Browser Back could change the URL and also trigger the mobile exit/back flow in the same event.
- The sync service read every profile's pending attempts but sent them with the currently selected learner ID. A shared device could attribute one learner's work to another learner.
- The reconnect listener captured the initial empty learner value, so a later online event could fail to flush the selected learner's outbox.
- The Android release workflow, APK download UI, Capacitor packages, and native project remained active after the web route had diverged.

## Current route flow

- `src/App.tsx` owns pathname and `popstate` handling. Browser Back/Forward changes the route once, and in-app learner screen changes create matching history entries.
- `/` opens the landing page; `/login` and `/register` open web authentication; `/learn` opens profile selection or the learner flow; `/learn/tutor`, `/learn/practice`, and `/learn/progress` open learner sections; `/guardian` and `/portal` open their respective web views.
- Older route aliases such as `/app`, `/student`, `/admin`, and `/parent` resolve to the web routes. Landing page anchors remain ordinary anchors.
- Escape closes registered dialogs. It does not compete with the browser's Back button.

## Current progress sync flow

1. Practice answers and skill state are written locally before feedback is shown. A failed local write leaves the question retryable and displays an error.
2. IndexedDB schema version 2 indexes outbox rows by learner. Each sync request contains only the selected learner's attempts and queued doubts.
3. The server validates ownership and returns the event IDs it accepted. The browser removes only those IDs from the outbox; rejected or failed writes stay available for retry.
4. The browser retries after profile selection, after a completed answer, at session completion, when connectivity returns, and with bounded backoff after temporary failures. Per-learner in-flight requests are deduplicated.
5. When Neon is configured, the API waits for event and doubt writes before acknowledging them. Without `DATABASE_URL`, the API may answer through its process-local development fallback, but the browser ignores that non-durable acknowledgment and keeps its outbox for a later retry. The learner's IndexedDB history remains durable on that browser either way.

## Android deferral

The tracked `android/` project, Capacitor configuration and dependencies, hardware-back hook, APK download/update UI, and APK CI workflow were removed. The browser PWA and its deploy proxies remain the active delivery path. Android can be added again after the route and sync flows are stable.

## Local workflow

- Frontend: `npm run dev`
- API, in a second terminal: `npm run server`
- Production web assets: `npm run build`

For cloud persistence, configure `DATABASE_URL` for the API and the deployment's `/api` proxy. In local fallback mode, learning progress remains in the browser's IndexedDB, while server-side sync is temporary.
