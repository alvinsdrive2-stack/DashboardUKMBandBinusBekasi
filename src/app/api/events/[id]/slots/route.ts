import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Interface untuk konfigurasi slot
interface SlotConfiguration {
  type: 'VOCAL' | 'GUITAR' | 'BASS' | 'DRUMS' | 'KEYBOARD' | 'CUSTOM';
  name: string;
  count: number;
  required: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id: eventId } = await params;

    // Cek autentikasi
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Cek apakah user adalah pengurus
    if (session.user?.organizationLvl !== 'COMMISSIONER' &&
        session.user?.organizationLvl !== 'PENGURUS') {
      return NextResponse.json(
        { error: 'Forbidden - Only managers can access slot configuration' },
        { status: 403 }
      );
    }

    // Ambil data event dengan slot
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        availableSlots: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        title: event.title,
        slotConfigurable: event.slotConfigurable,
        slotConfiguration: event.slotConfiguration,
        slots: event.availableSlots
      }
    });

  } catch (error) {
    console.error('Error fetching event slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id: eventId } = await params;
    const body = await request.json();

    // Cek autentikasi dan authorization
    if (!session || (session.user?.organizationLvl !== 'COMMISSIONER' &&
        session.user?.organizationLvl !== 'PENGURUS')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validasi input
    const { slotConfiguration, enableSlotConfig } = body;

    if (enableSlotConfig && !Array.isArray(slotConfiguration)) {
      return NextResponse.json(
        { error: 'Invalid slot configuration format' },
        { status: 400 }
      );
    }

    // Default konfigurasi slot band biasa
    const defaultSlots: SlotConfiguration[] = [
      { type: 'VOCAL', name: 'Vokalis Utama', count: 3, required: true },
      { type: 'VOCAL', name: 'Vokalis Pendukung', count: 2, required: false },
      { type: 'GUITAR', name: 'Gitar 1', count: 2, required: true },
      { type: 'GUITAR', name: 'Gitar 2', count: 2, required: false },
      { type: 'BASS', name: 'Basis', count: 1, required: true },
      { type: 'DRUMS', name: 'Drummer', count: 1, required: true },
      { type: 'KEYBOARD', name: 'Keyboardis/Pianis', count: 2, required: false }
    ];

    const finalSlotConfig = enableSlotConfig ? slotConfiguration : defaultSlots;

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        slotConfigurable: enableSlotConfig || false,
        slotConfiguration: enableSlotConfig ? finalSlotConfig : null
      }
    });

    // Jika slot configuration di-enable, hapus slot lama dan buat baru
    if (enableSlotConfig) {
      // Hapus semua slot yang ada
      await prisma.eventSlot.deleteMany({
        where: { eventId }
      });

      // Buat slot baru berdasarkan konfigurasi
      const newSlots = [];
      for (const slot of finalSlotConfig) {
        for (let i = 1; i <= slot.count; i++) {
          const slotName = slot.count > 1 ? `${slot.name} ${i}` : slot.name;
          newSlots.push({
            id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventId,
            slotName,
            slotType: slot.type,
            capacity: 1,
            required: slot.required,
            isActive: true
          });
        }
      }

      // Batch create new slots
      if (newSlots.length > 0) {
        await prisma.eventSlot.createMany({
          data: newSlots
        });
      }
    } else {
      // Jika disable, hapus semua slot
      await prisma.eventSlot.deleteMany({
        where: { eventId }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        slotConfigurable: updatedEvent.slotConfigurable,
        slotConfiguration: updatedEvent.slotConfiguration,
        message: enableSlotConfig ?
          'Slot configuration enabled successfully' :
          'Slot configuration disabled'
      }
    });

  } catch (error) {
    console.error('Error updating event slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id: eventId } = await params;
    const body = await request.json();

    // Cek autentikasi dan authorization
    if (!session || (session.user?.organizationLvl !== 'COMMISSIONER' &&
        session.user?.organizationLvl !== 'PENGURUS')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slotId, isActive } = body;

    if (!slotId) {
      return NextResponse.json(
        { error: 'Slot ID is required' },
        { status: 400 }
      );
    }

    // Update slot status
    const updatedSlot = await prisma.eventSlot.update({
      where: {
        id: slotId,
        eventId: eventId
      },
      data: {
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSlot
    });

  } catch (error) {
    console.error('Error updating slot status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}