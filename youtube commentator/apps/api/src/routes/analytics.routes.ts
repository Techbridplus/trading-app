import { Router, type Request, type Response } from 'express';
import { prisma } from '@repo/database';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

// GET /api/analytics
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [
      totalAccounts, activeAccounts, totalChannels, activeJobs,
      failedJobs, unreadNotifications, channels, recentJobs,
    ] = await Promise.all([
      prisma.googleAccount.count({ where: { userId } }),
      prisma.googleAccount.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.channel.count({ where: { userId } }),
      prisma.job.count({ where: { userId, status: { in: ['RUNNING', 'QUEUED', 'PENDING'] } } }),
      prisma.job.count({ where: { userId, status: 'FAILED' } }),
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.channel.findMany({
        where: { userId },
        select: { subscriberCount: true, videoCount: true, viewCount: true, googleAccount: { select: { email: true } } },
      }),
      prisma.job.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: { status: true, executionTime: true, createdAt: true },
      }),
    ]);

    const totalSubscribers = channels.reduce((sum: number, ch: any) => sum + ch.subscriberCount, 0);
    const totalVideos = channels.reduce((sum: number, ch: any) => sum + ch.videoCount, 0);
    const totalViews = channels.reduce((sum: number, ch: any) => sum + Number(ch.viewCount), 0);

    // Channels by account
    const accountMap = new Map<string, number>();
    channels.forEach((ch: any) => {
      const email = ch.googleAccount.email;
      accountMap.set(email, (accountMap.get(email) || 0) + 1);
    });
    const channelsByAccount = Array.from(accountMap.entries()).map(([account, count]: [string, number]) => ({ account, count }));

    // Job status breakdown
    const statusCounts = new Map<string, number>();
    recentJobs.forEach((j: any) => statusCounts.set(j.status, (statusCounts.get(j.status) || 0) + 1));
    const jobStatusBreakdown = Array.from(statusCounts.entries()).map(([status, count]: [string, number]) => ({ status, count }));

    // Avg execution time
    const completedJobs = recentJobs.filter((j: any) => j.executionTime !== null);
    const avgExecutionTime = completedJobs.length > 0
      ? completedJobs.reduce((sum: number, j: any) => sum + (j.executionTime || 0), 0) / completedJobs.length
      : 0;

    // Operations over time (last 7 days)
    const operationsOverTime = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayJobs = recentJobs.filter((j: any) => j.createdAt.toISOString().startsWith(dateStr));
      operationsOverTime.push({
        date: dateStr,
        completed: dayJobs.filter((j: any) => j.status === 'COMPLETED').length,
        failed: dayJobs.filter((j: any) => j.status === 'FAILED').length,
      });
    }

    // Subscriber distribution
    const ranges = [
      { range: '0-1K', min: 0, max: 1000 },
      { range: '1K-10K', min: 1000, max: 10000 },
      { range: '10K-100K', min: 10000, max: 100000 },
      { range: '100K-1M', min: 100000, max: 1000000 },
      { range: '1M+', min: 1000000, max: Infinity },
    ];
    const subscriberDistribution = ranges.map((r: any) => ({
      range: r.range,
      count: channels.filter((ch: any) => ch.subscriberCount >= r.min && ch.subscriberCount < r.max).length,
    }));

    res.json({
      success: true,
      data: {
        stats: { totalAccounts, activeAccounts, totalChannels, totalSubscribers, totalVideos, totalViews, activeJobs, failedJobs, unreadNotifications },
        analytics: {
          operationsOverTime, channelsByAccount, subscriberDistribution,
          jobStatusBreakdown, recentOperationRate: recentJobs.length,
          avgExecutionTime: Math.round(avgExecutionTime),
          oauthHealthScore: activeAccounts > 0 ? Math.round((activeAccounts / totalAccounts) * 100) : 100,
          queueDepth: activeJobs,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/activity — Audit log timeline
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '30' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum, take: limitNum,
      }),
      prisma.auditLog.count({ where: { userId: req.user!.id } }),
    ]);

    res.json({
      success: true,
      data: logs.map((l: any) => ({ ...l, createdAt: l.createdAt.toISOString() })),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
