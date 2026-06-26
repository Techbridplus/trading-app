import { Router, type Request, type Response } from 'express';
import { prisma } from '@repo/database';
import { authenticate } from '../middleware/auth.middleware.js';

function asString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const router = Router();
router.use(authenticate);

// GET /api/groups
router.get('/', async (req: Request, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      where: { userId: req.user!.id },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const data = groups.map((g: any) => ({
      id: g.id, name: g.name, description: g.description,
      color: g.color, icon: g.icon, channelCount: g._count.members,
      createdAt: g.createdAt.toISOString(),
    }));
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/groups
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, color, icon, channelIds } = req.body;
    const group = await prisma.group.create({
      data: {
        userId: req.user!.id, name, description, color: color || '#3b82f6', icon,
        members: channelIds?.length ? {
          create: channelIds.map((id: string) => ({ channelId: id })),
        } : undefined,
      },
      include: { _count: { select: { members: true } } },
    });
    res.status(201).json({ success: true, data: group });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/groups/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const groupId = asString(req.params.id);
    if (!groupId) {
      res.status(400).json({ success: false, error: 'Group ID is required' });
      return;
    }
    const { name, description, color, icon } = req.body;
    const group = await prisma.group.updateMany({
      where: { id: groupId, userId: req.user!.id },
      data: { name, description, color, icon },
    });
    if (group.count === 0) { res.status(404).json({ success: false, error: 'Group not found' }); return; }
    res.json({ success: true, message: 'Group updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/groups/:id/channels — Add channels to group
router.post('/:id/channels', async (req: Request, res: Response) => {
  try {
    const { channelIds } = req.body;
    const groupId = asString(req.params.id);
    if (!groupId) {
      res.status(400).json({ success: false, error: 'Group ID is required' });
      return;
    }
    const creates = channelIds.map((channelId: string) =>
      prisma.groupMember.upsert({
        where: { groupId_channelId: { groupId, channelId } },
        create: { groupId, channelId },
        update: {},
      })
    );
    await Promise.all(creates);
    res.json({ success: true, message: `${channelIds.length} channels added to group` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/groups/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const groupId = asString(req.params.id);
    if (!groupId) {
      res.status(400).json({ success: false, error: 'Group ID is required' });
      return;
    }
    await prisma.group.deleteMany({ where: { id: groupId, userId: req.user!.id } });
    res.json({ success: true, message: 'Group deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
