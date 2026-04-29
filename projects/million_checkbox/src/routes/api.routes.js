import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { getCheckboxBuffer, getCheckedCount } from '../services/checkbox.js';

const TOTAL = 1_000_000;

export function apiRouter(redis) {
  const router = Router();

  /**
   * GET /api/checkboxes
   * Returns the full 125 KB bitmap as application/octet-stream.
   * Gzip compression (handled by Express or a reverse proxy) brings
   * the payload down significantly for sparse bitmaps.
   */
  router.get('/checkboxes', optionalAuth, async (req, res) => {
    try {
      const buffer = await getCheckboxBuffer(redis);
      res.set('Content-Type', 'application/octet-stream');
      res.set('Cache-Control', 'no-cache');
      res.send(buffer);
    } catch (err) {
      console.error('Error fetching checkboxes:', err);
      res.status(500).json({ error: 'Failed to fetch checkbox state' });
    }
  });

  /** GET /api/stats — total and checked count */
  router.get('/stats', async (req, res) => {
    try {
      const checked = await getCheckedCount(redis);
      res.json({ total: TOTAL, checked });
    } catch {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  return router;
}
