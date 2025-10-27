import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Pong from Vercel!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    vercel: {
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || 'unknown',
    }
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'POST pong from Vercel!',
    timestamp: new Date().toISOString(),
  });
}