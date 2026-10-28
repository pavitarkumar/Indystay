import { Router, Request, Response } from 'express';
import { User } from '../../src/models/User';
import { verifyPassword, hashPassword } from '../../src/lib/auth/password';
import { createSessionToken, verifySessionToken } from '../../src/lib/auth/session';
import { loginSchema, registerSchema } from '../../src/lib/validation/auth.schema';
import { requireAuth } from '../middleware/auth';
import { connectBackendDatabase } from '../db';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid input data',
      });
    }

    const { email, password } = parsed.data;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended. Please contact support.',
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = await createSessionToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      assignedHotelId: user.assignedHotelId?.toString() || null,
    });

    res.cookie('indistay_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        assignedHotelId: user.assignedHotelId?.toString() || null,
      },
    });
  } catch (error) {
    console.error('Express Login error:', error);
    return res.status(500).json({ success: false, error: 'Authentication failed. Please try again.' });
  }
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid registration data',
      });
    }

    const { name, email, password, phone, role } = parsed.data;
    const existing = await User.findOne({ email: email.toLowerCase().trim() });

    if (existing) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const userRole = role === 'HOTEL_ADMIN' ? 'HOTEL_ADMIN' : 'CUSTOMER';

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone?.trim(),
      role: userRole,
      accountStatus: 'ACTIVE',
      loyalty: {
        completedBookingsCount: 0,
        freeNightsAvailable: 0,
        totalRewardsClaimed: 0,
      },
    });

    const token = await createSessionToken({
      id: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      assignedHotelId: null,
    });

    res.cookie('indistay_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        assignedHotelId: null,
      },
    });
  } catch (error) {
    console.error('Express Register error:', error);
    return res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const user = await User.findById(req.user!.id).select('-passwordHash').lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountStatus: user.accountStatus,
        assignedHotelId: user.assignedHotelId?.toString() || null,
        loyalty: user.loyalty,
      },
    });
  } catch (error) {
    console.error('Express Auth me error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve profile' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('indistay_session', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});
