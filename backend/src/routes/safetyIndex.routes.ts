import { Router } from 'express';
import { SafetyIndexService } from '../services/safetyIndexService';

export function safetyIndexRouter(service: SafetyIndexService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const query = req.query.q;
    if (typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const results = await service.search(query);
    res.json(results);
  });

  router.get('/:countryCode', async (req, res) => {
    const result = await service.getByCountryCode(req.params.countryCode);
    if (!result) {
      return res.status(404).json({ error: `No safety index for "${req.params.countryCode}"` });
    }
    res.json(result);
  });

  return router;
}
