#!/usr/bin/env node

// Test script for member join event notifications
const testMemberJoinEvent = async () => {
  try {
    console.log('👥 Testing Member Join Event Notification...');

    // First, let's check if we have any events in the database
    console.log('📋 Fetching available events...');
    const eventsResponse = await fetch('http://localhost:3000/api/events/manager', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // You'll need to authenticate properly
      }
    });

    if (!eventsResponse.ok) {
      console.error('❌ Failed to fetch events:', eventsResponse.status);
      return;
    }

    const events = await eventsResponse.json();
    console.log(`📊 Found ${events.length} events`);

    if (events.length === 0) {
      console.log('⚠️ No events found. Please create an event first.');
      return;
    }

    // Use the first event for testing
    const testEvent = events[0];
    console.log(`🎯 Using event: ${testEvent.title} (ID: ${testEvent.id})`);

    // Test the member join event notification
    console.log('📤 Sending member join event notification...');
    const notificationResponse = await fetch('http://localhost:3000/api/notifications/ukmband/member-join-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // You'll need to authenticate properly
      },
      body: JSON.stringify({
        eventId: testEvent.id,
        newMemberName: 'Test Member',
        memberRole: 'Test Guitarist',
        sendToExistingMembersOnly: true
      })
    });

    if (!notificationResponse.ok) {
      console.error('❌ Failed to send notification:', notificationResponse.status);
      const errorText = await notificationResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const result = await notificationResponse.json();
    console.log('✅ Member join event notification sent successfully!');
    console.log('📊 Results:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testMemberJoinEvent();