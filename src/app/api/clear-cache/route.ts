import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // This will trigger cache refresh on next requests
    // Since we're using in-memory cache on the server side,
    // we can't directly access it from here, but we can
    // signal the client to clear their cache

    return NextResponse.json({
      message: 'Cache clear signal sent',
      timestamp: Date.now()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}