// Enterprise Kubernetes & Cloud Load Balancer Health & Telemetry Probes
import { Router, Request, Response } from 'express';
import { isNeonConnected } from '../db/neon.js';
import { dataStore } from '../db/store.js';
import { eventQueueService } from '../services/queueService.js';

const router = Router();
const startTime = Date.now();

// Liveness Probe (GET /healthz) - Quick check if server process is running
router.get('/healthz', (req: Request, res: Response) => {
  return res.status(200).json({ status: 'healthy', uptimeSeconds: Math.floor((Date.now() - startTime) / 1000) });
});

// Readiness Probe (GET /readyz) - Check if server is ready to accept production traffic
router.get('/readyz', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const heapUsedMb = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const queueMetrics = eventQueueService.getMetrics();

  const isReady = heapUsedMb < 1024; // Less than 1GB heap

  return res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'degraded',
    database: {
      neonConnected: isNeonConnected(),
      mode: isNeonConnected() ? 'serverless_postgres' : 'resilient_store',
    },
    memory: {
      heapUsedMb,
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
    },
    queue: queueMetrics,
    institutionsCount: dataStore.institutions.size,
    subjectsCount: dataStore.subjects.size,
  });
});

// System Metrics Telemetry (GET /metrics)
router.get('/metrics', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const q = eventQueueService.getMetrics();

  return res.json({
    app: 'vidyapath-enterprise',
    version: '1.0.0',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    memory: {
      rssBytes: mem.rss,
      heapTotalBytes: mem.heapTotal,
      heapUsedBytes: mem.heapUsed,
    },
    queue: q,
    entities: {
      institutions: dataStore.institutions.size,
      users: dataStore.users.size,
      subjects: dataStore.subjects.size,
      assignments: dataStore.assignments.size,
      quizzes: dataStore.quizzes.size,
      auditLogs: dataStore.auditLogs.length,
    },
  });
});

export { router as healthRouter };
