import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Create sample users for testing
    const users = await Promise.all([
      // Manager
      prisma.user.create({
        data: {
          name: 'Ahmad Manager',
          email: 'manager@ukmband.com',
          nim: '2021001',
          major: 'Teknik Informatika',
          instruments: ['Guitar', 'Vocal'],
          phoneNumber: '08123456789',
          organizationLvl: 'COMMISSIONER',
          technicLvl: 'ADVANCED',
        },
      }),
      // Member 1
      prisma.user.create({
        data: {
          name: 'Siti Vocalist',
          email: 'siti@ukmband.com',
          nim: '2021002',
          major: 'Sastra Inggris',
          instruments: ['Vocal'],
          phoneNumber: '08123456788',
          organizationLvl: 'TALENT',
          technicLvl: 'INTERMEDIATE',
        },
      }),
      // Member 2
      prisma.user.create({
        data: {
          name: 'Budi Guitarist',
          email: 'budi@ukmband.com',
          nim: '2021003',
          major: 'Teknik Elektro',
          instruments: ['Guitar', 'Bass'],
          phoneNumber: '08123456787',
          organizationLvl: 'TALENT',
          technicLvl: 'ADVANCED',
        },
      }),
      // Member 3
      prisma.user.create({
        data: {
          name: 'Rina Drummer',
          email: 'rina@ukmband.com',
          nim: '2021004',
          major: 'Manajemen',
          instruments: ['Drum', 'Percussion'],
          phoneNumber: '08123456786',
          organizationLvl: 'SPECTA',
          technicLvl: 'INTERMEDIATE',
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Sample users created successfully',
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        organizationLvl: u.organizationLvl,
      }))
    });
  } catch (error) {
    console.error('Error creating sample users:', error);
    return NextResponse.json(
      { error: 'Failed to create sample users' },
      { status: 500 }
    );
  }
}