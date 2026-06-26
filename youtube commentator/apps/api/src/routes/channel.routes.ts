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

// GET /api/channels — List channels with filtering, search, pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search, status, googleAccountId, groupId, isFavorite,
      country, tags, sortBy = 'title', sortOrder = 'asc',
      page = '1', limit = '20',
    } = req.query;

    const searchValue = asString(search);
    const statusValue = asString(status);
    const googleAccountIdValue = asString(googleAccountId);
    const groupIdValue = asString(groupId);
    const countryValue = asString(country);
    const tagsValue = asString(tags);
    const sortByValue = asString(sortBy) ?? 'title';
    const sortOrderValue = asString(sortOrder) ?? 'asc';
    const pageNum = Math.max(1, parseInt(asString(page) ?? '1'));
    const limitNum = Math.min(100, Math.max(1, parseInt(asString(limit) ?? '20')));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: req.user!.id };

    if (searchValue) {
      where.OR = [
        { title: { contains: searchValue, mode: 'insensitive' } },
        { handle: { contains: searchValue, mode: 'insensitive' } },
        { youtubeId: { contains: searchValue, mode: 'insensitive' } },
        { description: { contains: searchValue, mode: 'insensitive' } },
      ];
    }
    if (statusValue) where.status = statusValue;
    if (googleAccountIdValue) where.googleAccountId = googleAccountIdValue;
    if (isFavorite === 'true') where.isFavorite = true;
    if (countryValue) where.country = countryValue;
    if (tagsValue) where.tags = { hasSome: tagsValue.split(',') };
    if (groupIdValue) {
      where.groupMembers = { some: { groupId: groupIdValue } };
    }

    const orderBy: any = {};
    const validSortFields = ['title', 'subscriberCount', 'videoCount', 'viewCount', 'createdAt'];
    if (validSortFields.includes(sortByValue)) {
      orderBy[sortByValue] = sortOrderValue === 'desc' ? 'desc' : 'asc';
    }

    const [channels, total] = await Promise.all([
      prisma.channel.findMany({
        where,
        include: {
          googleAccount: { select: { email: true, id: true } },
          groupMembers: { include: { group: { select: { name: true } } } },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.channel.count({ where }),
    ]);

    const data = channels.map((ch: any) => ({
      id: ch.id,
      youtubeId: ch.youtubeId,
      title: ch.title,
      handle: ch.handle,
      description: ch.description,
      thumbnailUrl: ch.thumbnailUrl,
      bannerUrl: ch.bannerUrl,
      subscriberCount: ch.subscriberCount,
      videoCount: ch.videoCount,
      viewCount: Number(ch.viewCount),
      country: ch.country,
      language: ch.language,
      isBrandAccount: ch.isBrandAccount,
      isFavorite: ch.isFavorite,
      tags: ch.tags,
      status: ch.status,
      googleAccountEmail: ch.googleAccount.email,
      googleAccountId: ch.googleAccount.id,
      groupNames: ch.groupMembers.map((gm: any) => gm.group.name),
      lastSyncedAt: ch.lastSyncedAt?.toISOString() || null,
      createdAt: ch.createdAt.toISOString(),
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/channels/:id — Channel details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const channelId = asString(req.params.id);
    if (!channelId) {
      res.status(400).json({ success: false, error: 'Channel ID is required' });
      return;
    }

    const channel = await prisma.channel.findFirst({
      where: { id: channelId, userId: req.user!.id },
      include: {
        googleAccount: { select: { email: true, displayName: true, profilePicture: true } },
        groupMembers: { include: { group: true } },
      },
    });

    if (!channel) {
      res.status(404).json({ success: false, error: 'Channel not found' });
      return;
    }

    res.json({ success: true, data: { ...channel, viewCount: Number(channel.viewCount) } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/channels/:id — Update tags, favorite status
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { tags, isFavorite } = req.body;
    const updateData: any = {};
    if (tags !== undefined) updateData.tags = tags;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    const channelId = asString(req.params.id);
    if (!channelId) {
      res.status(400).json({ success: false, error: 'Channel ID is required' });
      return;
    }

    const channel = await prisma.channel.updateMany({
      where: { id: channelId, userId: req.user!.id },
      data: updateData,
    });

    if (channel.count === 0) {
      res.status(404).json({ success: false, error: 'Channel not found' });
      return;
    }

    res.json({ success: true, message: 'Channel updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/channels/bulk/favorite — Bulk toggle favorite
router.patch('/bulk/favorite', async (req: Request, res: Response) => {
  try {
    const { channelIds, isFavorite } = req.body;
    await prisma.channel.updateMany({
      where: { id: { in: channelIds }, userId: req.user!.id },
      data: { isFavorite },
    });
    res.json({ success: true, message: `${channelIds.length} channels updated` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
