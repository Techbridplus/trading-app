import { Router, type Request, type Response } from 'express';
import { prisma } from '@repo/database';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyToken } from '@repo/auth';
import { authenticate } from '../middleware/auth.middleware.js';
import { randomBytes } from 'crypto';
import { google } from 'googleapis';
import { env } from '@repo/config';

const router = Router();

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

const googleAuthScopes = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl',
];

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ success: false, error: 'Email, password, and name are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
    });

    // Create default settings
    await prisma.settings.create({
      data: { userId: user.id },
    });

    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = generateAccessToken(payload, process.env.JWT_SECRET!, process.env.JWT_EXPIRES_IN);
    const refreshToken = generateRefreshToken({ id: user.id }, process.env.JWT_REFRESH_SECRET!, process.env.JWT_REFRESH_EXPIRES_IN);

    // Store session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = generateAccessToken(payload, process.env.JWT_SECRET!, process.env.JWT_EXPIRES_IN);
    const refreshToken = generateRefreshToken({ id: user.id }, process.env.JWT_REFRESH_SECRET!, process.env.JWT_REFRESH_EXPIRES_IN);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl },
        accessToken,
        refreshToken,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/google
router.get('/google', async (_req: Request, res: Response) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: googleAuthScopes,
  });
  res.redirect(authUrl);
});

// GET /api/auth/google/callback
router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string | undefined;
    if (!code) {
      res.status(400).json({ success: false, error: 'Authorization code is required' });
      return;
    }

    const tokenResponse = await oauth2Client.getToken(code);
    const tokens = tokenResponse.tokens;
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const userInfoResponse = await oauth2.userinfo.get();
    const userInfo = userInfoResponse.data;

    if (!userInfo.email || !userInfo.id) {
      res.status(400).json({ success: false, error: 'Unable to retrieve Google account information' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { email: userInfo.email } });
    if (!user) {
      const passwordHash = await hashPassword(randomBytes(32).toString('hex'));
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name ?? userInfo.email,
          passwordHash,
        },
      });

      await prisma.settings.create({ data: { userId: user.id } });
    }

    const googleAccount = await prisma.googleAccount.upsert({
      where: { googleId: userInfo.id },
      create: {
        userId: user.id,
        googleId: userInfo.id,
        email: userInfo.email,
        displayName: userInfo.name ?? userInfo.email,
        profilePicture: userInfo.picture ?? null,
        scopes: googleAuthScopes,
        status: 'ACTIVE',
      },
      update: {
        userId: user.id,
        email: userInfo.email,
        displayName: userInfo.name ?? userInfo.email,
        profilePicture: userInfo.picture ?? null,
        scopes: googleAuthScopes,
        status: 'ACTIVE',
      },
    });

    const existingToken = await prisma.oAuthToken.findUnique({ where: { googleAccountId: googleAccount.id } });
    const refreshTokenValue = tokens.refresh_token ?? existingToken?.refreshToken ?? '';
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 60 * 60 * 1000);

    await prisma.oAuthToken.upsert({
      where: { googleAccountId: googleAccount.id },
      create: {
        googleAccountId: googleAccount.id,
        accessToken: tokens.access_token ?? '',
        refreshToken: refreshTokenValue,
        tokenType: tokens.token_type ?? 'Bearer',
        expiresAt,
      },
      update: {
        accessToken: tokens.access_token ?? '',
        refreshToken: refreshTokenValue,
        tokenType: tokens.token_type ?? 'Bearer',
        expiresAt,
        lastRefreshedAt: new Date(),
      },
    });

    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const appAccessToken = generateAccessToken(payload, env.JWT_SECRET, env.JWT_EXPIRES_IN);
    const appRefreshToken = generateRefreshToken({ id: user.id }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: appRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
      },
    });

    const html = `<!DOCTYPE html>
<html>
  <body>
    <script>
      const user = ${JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl ?? null })};
      const auth = {
        user,
        accessToken: ${JSON.stringify(appAccessToken)},
        refreshToken: ${JSON.stringify(appRefreshToken)},
      };
      localStorage.setItem('auth', JSON.stringify(auth));
      window.location.href = '/dashboard';
    </script>
  </body>
</html>`;

    res.send(html);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Google OAuth callback failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }

    const session = await prisma.session.findUnique({ where: { refreshToken } });
    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
      return;
    }

    const decoded = verifyToken<{ id: string }>(refreshToken, process.env.JWT_REFRESH_SECRET!);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const newAccessToken = generateAccessToken(payload, process.env.JWT_SECRET!, process.env.JWT_EXPIRES_IN);
    const newRefreshToken = generateRefreshToken({ id: user.id }, process.env.JWT_REFRESH_SECRET!, process.env.JWT_REFRESH_EXPIRES_IN);

    // Rotate refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.session.deleteMany({ where: { refreshToken } });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
