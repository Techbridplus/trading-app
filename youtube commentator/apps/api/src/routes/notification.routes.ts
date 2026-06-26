import { Router, type Request, type Response } from 'express';
import { prisma } from '@repo/database';
import { authenticate } from '../middleware/auth.middleware.js';

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
    return value[0];
  }
  return undefined;
}

const router = Router();
router.use(authenticate);

// GET /api/notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const { read, page = '1', limit = '20' } = req.query;
    const readValue = asString(read);
    const pageNum = Math.max(1, parseInt(asString(page) ?? '1'));
    const limitNum = Math.min(100, parseInt(asString(limit) ?? '20'));
    const where: any = { userId: req.user!.id };
    if (readValue === 'true') where.read = true;
    if (readValue === 'false') where.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum, take: limitNum,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.id, read: false } }),
    ]);

    res.json({
      success: true,
      data: notifications.map((n: any) => ({ ...n, createdAt: n.createdAt.toISOString(), readAt: n.readAt?.toISOString() || null })),
      unreadCount,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const notificationId = asString(req.params.id);
    if (!notificationId) {
      res.status(400).json({ success: false, error: 'Notification ID is required' });
      return;
    }

    await prisma.notification.updateMany({
      where: { id: notificationId, userId: req.user!.id },
      data: { read: true, readAt: new Date() },
    });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true, readAt: new Date() },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
