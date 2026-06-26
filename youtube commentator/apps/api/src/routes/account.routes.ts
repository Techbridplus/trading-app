import { Router, type Request, type Response } from 'express';
import { prisma } from '@repo/database';
import { authenticate } from '../middleware/auth.middleware.js';

function asString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/accounts — List all connected Google accounts
router.get('/', async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.googleAccount.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: { select: { channels: true } },
      },
      orderBy: { connectedAt: 'desc' },
    });

    const data = accounts.map((a: any) => ({
      id: a.id,
      googleId: a.googleId,
      email: a.email,
      displayName: a.displayName,
      profilePicture: a.profilePicture,
      status: a.status,
      channelCount: a._count.channels,
      connectedAt: a.connectedAt.toISOString(),
      lastSyncedAt: a.lastSyncedAt?.toISOString() || null,
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/accounts/:id — Get account details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const accountId = asString(req.params.id);
    if (!accountId) {
      res.status(400).json({ success: false, error: 'Account ID is required' });
      return;
    }

    const account = await prisma.googleAccount.findFirst({
      where: { id: accountId, userId: req.user!.id },
      include: {
        channels: { select: { id: true, title: true, handle: true, thumbnailUrl: true, subscriberCount: true } },
        _count: { select: { channels: true } },
      },
    });

    if (!account) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }

    res.json({ success: true, data: account });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/accounts/mock — Add a mock Google account (for development)
router.post('/mock', async (req: Request, res: Response) => {
  try {
    const mockId = `mock_${Date.now()}`;
    const account = await prisma.googleAccount.create({
      data: {
        userId: req.user!.id,
        googleId: mockId,
        email: `${req.body.name?.toLowerCase().replace(/\s/g, '.') || 'user'}@gmail.com`,
        displayName: req.body.name || 'Mock Google User',
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(req.body.name || 'Mock')}&background=3b82f6&color=fff&size=128`,
        scopes: ['youtube.readonly', 'youtube.force-ssl'],
        status: 'ACTIVE',
      },
    });

    // Create mock channels for this account
    const channelNames = [
      { title: `${req.body.name || 'User'}'s Main Channel`, handle: `@${(req.body.name || 'user').toLowerCase().replace(/\s/g, '')}` },
      { title: `${req.body.name || 'User'} Gaming`, handle: `@${(req.body.name || 'user').toLowerCase().replace(/\s/g, '')}gaming` },
      { title: `${req.body.name || 'User'} Vlogs`, handle: `@${(req.body.name || 'user').toLowerCase().replace(/\s/g, '')}vlogs` },
    ];

    for (const ch of channelNames) {
      await prisma.channel.create({
        data: {
          userId: req.user!.id,
          googleAccountId: account.id,
          youtubeId: `UC${Math.random().toString(36).substring(2, 15)}`,
          title: ch.title,
          handle: ch.handle,
          description: `Welcome to ${ch.title}! Subscribe for amazing content.`,
          thumbnailUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.title)}&background=${['3b82f6', '8b5cf6', '10b981', 'f59e0b', 'ef4444'][Math.floor(Math.random() * 5)]}&color=fff&size=256`,
          subscriberCount: Math.floor(Math.random() * 500000),
          videoCount: Math.floor(Math.random() * 500),
          viewCount: BigInt(Math.floor(Math.random() * 50000000)),
          country: ['US', 'IN', 'GB', 'CA', 'AU'][Math.floor(Math.random() * 5)],
          language: 'en',
          status: 'ACTIVE',
          lastSyncedAt: new Date(),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'ACCOUNT_CONNECTED',
        entityType: 'GoogleAccount',
        entityId: account.id,
        details: { email: account.email, mock: true },
      },
    });

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: 'ACCOUNT_CONNECTED',
        title: 'Google Account Connected',
        message: `Successfully connected ${account.email} with 3 channels discovered.`,
      },
    });

    res.status(201).json({ success: true, data: account });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/accounts/:id/sync — Trigger channel sync
router.post('/:id/sync', async (req: Request, res: Response) => {
  try {
    const accountId = asString(req.params.id);
    if (!accountId) {
      res.status(400).json({ success: false, error: 'Account ID is required' });
      return;
    }

    const account = await prisma.googleAccount.findFirst({
      where: { id: accountId, userId: req.user!.id },
    });

    if (!account) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }

    // Create a sync job
    const job = await prisma.job.create({
      data: {
        userId: req.user!.id,
        type: 'CHANNEL_SYNC',
        status: 'COMPLETED',
        progress: 100,
        payload: { googleAccountId: account.id },
        completedAt: new Date(),
        executionTime: Math.floor(Math.random() * 3000),
      },
    });

    await prisma.googleAccount.update({
      where: { id: account.id },
      data: { lastSyncedAt: new Date() },
    });

    res.json({ success: true, data: { jobId: job.id, message: 'Sync completed' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/accounts/:id — Disconnect account
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const accountId = asString(req.params.id);
    if (!accountId) {
      res.status(400).json({ success: false, error: 'Account ID is required' });
      return;
    }

    const account = await prisma.googleAccount.findFirst({
      where: { id: accountId, userId: req.user!.id },
    });

    if (!account) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }

    await prisma.googleAccount.delete({ where: { id: account.id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'ACCOUNT_DISCONNECTED',
        entityType: 'GoogleAccount',
        entityId: account.id,
        details: { email: account.email },
      },
    });

    res.json({ success: true, message: 'Account disconnected' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
