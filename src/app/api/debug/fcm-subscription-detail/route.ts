import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id;
    console.log(`🔍 DEBUG: Detailed FCM subscription check for user ${currentUserId}`);

    const results = {
      currentUser: null,
      userFcmSubscriptions: [],
      allFcmSubscriptions: [],
      userQueryTest: null,
      debugQueries: {}
    };

    // 1. Get current user details
    try {
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          name: true,
          email: true,
          organizationLvl: true
        }
      });
      results.currentUser = user;
      console.log(`👤 Current User:`, user);
    } catch (error) {
      console.error('❌ Error getting user:', error);
    }

    // 2. Get user's FCM subscriptions with detailed info
    try {
      const fcmSubscriptions = await prisma.fCMSubscription.findMany({
        where: { userId: currentUserId },
        select: {
          id: true,
          userId: true,
          token: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          deviceInfo: true
        },
        orderBy: { createdAt: 'desc' }
      });
      results.userFcmSubscriptions = fcmSubscriptions;
      console.log(`📱 User's FCM Subscriptions:`, fcmSubscriptions);
    } catch (error) {
      console.error('❌ Error getting user FCM subscriptions:', error);
    }

    // 3. Get ALL FCM subscriptions to see the pattern
    try {
      const allFcmSubscriptions = await prisma.fCMSubscription.findMany({
        select: {
          id: true,
          userId: true,
          token: true,
          isActive: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      results.allFcmSubscriptions = allFcmSubscriptions;
      console.log(`📱 ALL FCM Subscriptions:`, allFcmSubscriptions.length);
      allFcmSubscriptions.forEach((sub, i) => {
        console.log(`  ${i+1}. User ID: ${sub.userId}, Name: ${sub.user.name}, Active: ${sub.isActive}`);
      });
    } catch (error) {
      console.error('❌ Error getting all FCM subscriptions:', error);
    }

    // 4. Test the exact query we use in getAllMembers()
    try {
      console.log(`🔍 Testing the exact query from getAllMembers()...`);
      const testQuery = await prisma.user.findMany({
        where: {
          fCMSubscriptions: {
            some: {
              isActive: true
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          organizationLvl: true,
          fCMSubscriptions: {
            select: {
              id: true,
              isActive: true,
              createdAt: true,
              deviceInfo: true
            }
          }
        }
      });
      results.userQueryTest = testQuery;
      console.log(`🔍 Query Result: Found ${testQuery.length} users`);
      testQuery.forEach((user, i) => {
        console.log(`  ${i+1}. ${user.name} (${user.id}) - Subs: ${user.fCMSubscriptions.length}`);
      });
    } catch (error) {
      console.error('❌ Error in test query:', error);
    }

    // 5. Test individual queries
    try {
      // Test if user exists with FCM subs using direct userId filter
      const directUserCheck = await prisma.user.findFirst({
        where: {
          id: currentUserId,
          fCMSubscriptions: {
            some: {
              isActive: true
            }
          }
        },
        select: {
          id: true,
          name: true,
          fCMSubscriptions: {
            select: { id: true, isActive: true }
          }
        }
      });
      results.debugQueries.directUserCheck = directUserCheck;
      console.log(`🔍 Direct User Check:`, directUserCheck);
    } catch (error) {
      console.error('❌ Error in direct user check:', error);
    }

    // 6. Test if currentUserId matches any FCM subscription userId
    try {
      const userIdMatch = await prisma.fCMSubscription.findFirst({
        where: {
          userId: currentUserId,
          isActive: true
        },
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      results.debugQueries.userIdMatch = userIdMatch;
      console.log(`🔍 User ID Match Check:`, userIdMatch);
    } catch (error) {
      console.error('❌ Error in user ID match check:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Detailed FCM subscription check completed',
      results,
      analysis: {
        userHasFcmSubscriptions: results.userFcmSubscriptions.length > 0,
        activeFcmSubscriptions: results.userFcmSubscriptions.filter(s => s.isActive).length,
        foundInAllUsersQuery: results.userQueryTest?.some(u => u.id === currentUserId) || false,
        userIdMatches: !!results.debugQueries.userIdMatch,
        potentialIssue: !results.userQueryTest?.some(u => u.id === currentUserId) && results.userFcmSubscriptions.length > 0
      }
    });

  } catch (error) {
    console.error('❌ Error in detailed FCM subscription check:', error);
    return NextResponse.json(
      { error: 'Failed to check FCM subscription details' },
      { status: 500 }
    );
  }
}