import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/connection';
import { getCustomerLoyalty, addSimulatedStay } from '@/services/loyalty.service';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const loyalty = await getCustomerLoyalty(session.id);

    return NextResponse.json({
      success: true,
      data: loyalty,
    });
  } catch (error) {
    console.error('Error fetching customer loyalty:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch loyalty status' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const updatedLoyalty = await addSimulatedStay(session.id);

    return NextResponse.json({
      success: true,
      message: 'Simulated stay recorded successfully!',
      data: updatedLoyalty,
    });
  } catch (error) {
    console.error('Error simulating stay:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to simulate stay' },
      { status: 500 }
    );
  }
}
