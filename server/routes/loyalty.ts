import { Router, Request, Response } from 'express';
import { getCustomerLoyalty, addSimulatedStay } from '../../src/services/loyalty.service';
import { requireAuth } from '../middleware/auth';
import { connectBackendDatabase } from '../db';

export const loyaltyRouter = Router();

loyaltyRouter.use(requireAuth);

// GET /api/loyalty
loyaltyRouter.get('/', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const loyalty = await getCustomerLoyalty(req.user!.id);
    return res.json({ success: true, data: loyalty });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch loyalty status',
    });
  }
});

// POST /api/loyalty
loyaltyRouter.post('/', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const updated = await addSimulatedStay(req.user!.id);
    return res.json({
      success: true,
      message: 'Simulated stay recorded successfully!',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record simulated stay',
    });
  }
});
