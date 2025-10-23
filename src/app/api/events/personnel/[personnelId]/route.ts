import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isMember } from '@/utils/roles';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ personnelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.organizationLvl || !isMember(session.user.organizationLvl)) {
      return NextResponse.json(
        { error: 'Unauthorized - Only members can cancel registrations' },
        { status: 401 }
      );
    }

    const { personnelId } = await params;
    const userId = session.user.id;

    // Check if personnel registration exists and belongs to the user
    const personnel = await prisma.eventPersonnel.findFirst({
      where: {
        id: personnelId,
        userId: userId
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
          }
        }
      }
    });

    if (!personnel) {
      return NextResponse.json(
        { error: 'Registration not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Check if event is in the future (can't cancel past events)
    if (new Date(personnel.event.date) <= new Date()) {
      return NextResponse.json(
        { error: 'Cannot cancel registration for past events' },
        { status: 400 }
      );
    }

    // Cancel the registration by setting userId to null and status to PENDING
    const updatedPersonnel = await prisma.eventPersonnel.update({
      where: { id: personnelId },
      data: {
        userId: null,
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      message: 'Pendaftaran berhasil dibatalkan',
      personnel: updatedPersonnel
    });
  } catch (error) {
    console.error('Error canceling registration:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}