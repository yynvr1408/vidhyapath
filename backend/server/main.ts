import './env.js';
import { app } from './index.js';
import { initNeonDb } from './db/neon.js';
import { assertAuthConfiguration } from './services/auth.js';

const port = Number(process.env.PORT || 3001);

async function startServer() {
  assertAuthConfiguration();
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required in production; the API cannot safely run with process-local storage.');
    }
    if (!process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL || (process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD || '').length < 12) {
      throw new Error('Configure BOOTSTRAP_SUPER_ADMIN_EMAIL and a BOOTSTRAP_SUPER_ADMIN_PASSWORD of at least 12 characters.');
    }
  }

  const databaseReady = await initNeonDb();
  if (process.env.NODE_ENV === 'production' && !databaseReady) {
    throw new Error('Database connection failed. The production API will not start without durable storage.');
  }

  app.listen(port, () => console.log(`Vidyapath API server running on port ${port}`));
}

void startServer().catch((error: Error) => {
  console.error('[Startup] API failed to initialize:', error.message);
  process.exitCode = 1;
});
