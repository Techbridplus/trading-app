import { Router, type Request, type Response } from 'express';
import { prisma } from '@repo/database';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/settings
router.get('/', async (req: Request, res: Response) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { userId: req.user!.id } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { userId: req.user!.id } });
    }
    const { id, userId, createdAt, updatedAt, ...data } = settings;
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const allowedFields = [
      'theme', 'timezone', 'language', 'defaultView', 'defaultSort',
      'notifyEmail', 'notifyInApp', 'notifyWebhook', 'webhookUrl',
      'apiRateLimit', 'autoSyncInterval',
    ];
    const updateData: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const settings = await prisma.settings.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, ...updateData },
      update: updateData,
    });

    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
