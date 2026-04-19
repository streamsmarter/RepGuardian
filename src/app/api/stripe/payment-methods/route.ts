import { NextResponse } from 'next/server';

// Deprecated route kept as a safe stub while old editor tabs and callers are cleaned up.
export async function GET() {
  return NextResponse.json(
    {
      error: 'This route has been deprecated. Use /api/stripe/activation/context or /api/stripe/portal instead.',
    },
    { status: 410 }
  );
}
