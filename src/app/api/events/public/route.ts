import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all published events for public view
    const events = await prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        date: {
          gte: new Date(), // Only future events
        }
      },
      include: {
        personnel: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nim: true,
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      events,
      count: events.length
    });
  } catch (error) {
    console.error('Error fetching public events:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      date,
      location,
      submittedBy,
      email,
      phoneNumber
    } = body;

    // Validate required fields
    if (!title || !date || !location || !submittedBy || !email || !phoneNumber) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    // Create event with SUBMITTED status
    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        status: 'SUBMITTED',
        submittedBy: `${submittedBy} (${email}, ${phoneNumber})`,
        isSubmittedByPublic: true,
      },
    });

    return NextResponse.json({
      message: 'Acara berhasil diajukan',
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}