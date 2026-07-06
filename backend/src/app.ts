import cors from 'cors';
import express, { Express } from 'express';

import { safetyIndexRouter } from './routes/safetyIndex.routes';
import { SafetyIndexService } from './services/safetyIndexService';
import { buildSourceRegistry } from './sources/registry';

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const service = new SafetyIndexService(buildSourceRegistry());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/v1/safety-index', safetyIndexRouter(service));

  return app;
}
