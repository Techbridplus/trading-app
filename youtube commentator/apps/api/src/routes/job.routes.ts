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

// GET /api/jobs
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, type, page = '1', limit = '20' } = req.query;
    const statusValue = asString(status);
    const typeValue = asString(type);
    const pageNum = Math.max(1, parseInt(asString(page) ?? '1'));
    const limitNum = Math.min(100, parseInt(asString(limit) ?? '20'));
    const where: any = { userId: req.user!.id };
    if (statusValue) where.status = statusValue;
    if (typeValue) where.type = typeValue;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where, include: { channel: { select: { title: true } } },
        orderBy: { createdAt: 'desc' }, skip: (pageNum - 1) * limitNum, take: limitNum,
      }),
      prisma.job.count({ where }),
    ]);

    const data = jobs.map((j: any) => ({
      id: j.id, type: j.type, status: j.status, progress: j.progress,
      channelTitle: j.channel?.title || null, errorMessage: j.errorMessage,
      attempts: j.attempts, maxAttempts: j.maxAttempts,
      executionTime: j.executionTime, startedAt: j.startedAt?.toISOString() || null,
      completedAt: j.completedAt?.toISOString() || null, createdAt: j.createdAt.toISOString(),
    }));

    res.json({ success: true, data, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const jobId = asString(req.params.id);
    if (!jobId) {
      res.status(400).json({ success: false, error: 'Job ID is required' });
      return;
    }

    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: req.user!.id },
      include: { channel: { select: { title: true, handle: true } } },
    });
    if (!job) { res.status(404).json({ success: false, error: 'Job not found' }); return; }
    res.json({ success: true, data: job });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
