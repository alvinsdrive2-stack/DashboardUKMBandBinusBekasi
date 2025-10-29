'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  Alert,
  AlertIcon,
  Heading,
  Container,
  Card,
  CardBody,
  Stack,
  Divider,
  FormControl,
  FormLabel,
  Switch
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';

export default function TestUKMNotifications() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendToAll, setSendToAll] = useState(true);
  const [sendToAllMembers, setSendToAllMembers] = useState(true); // For event creation
  const [createDatabaseNotifications, setCreateDatabaseNotifications] = useState(true);

  // Form states for different notification types
  const [eventForm, setEventForm] = useState({
    eventTitle: 'Festival Musik UKM 2025',
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    eventLocation: 'Auditorium Kampus'
  });

  const [practiceForm, setPracticeForm] = useState({
    practiceDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
    practiceType: 'Latihan Rutin'
  });

  const [performanceForm, setPerformanceForm] = useState({
    performanceTitle: 'Pembukaan Acara Wisuda',
    performanceDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    performanceLocation: 'Lapangan Utama Kampus'
  });

  const [teamMemberForm, setTeamMemberForm] = useState({
    newMemberName: 'John Doe',
    role: 'Gitaris'
  });

  const [songForm, setSongForm] = useState({
    songTitle: 'Bohemian Rhapsody',
    artist: 'Queen',
    addedBy: 'Music Director',
    difficulty: 'Medium'
  });

  const [memberJoinEventForm, setMemberJoinEventForm] = useState({
    eventId: '',
    newMemberName: 'John Doe',
    memberRole: 'Gitaris',
    sendToExistingMembersOnly: true
  });

  const sendNotification = async (type: string, data: any) => {
    if (!session?.user?.id) {
      setError('Please login first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const endpoint = `/api/notifications/ukmband/${type}`;
      const payload = {
        ...data,
        sendToAll
      };

      console.log(`🎵 Sending UKM Band notification: ${type}`, payload);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (responseData.success) {
        setResult(responseData);
      } else {
        setError(responseData.error || 'Failed to send notification');
      }
    } catch (error) {
      setError('Error sending notification');
      console.error('Notification error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading>🎵 UKM Band Notification System</Heading>
          <Text color="gray.600" mt={2}>
            Test notification system for UKM Band events and activities
          </Text>

          {/* Debug Database Check */}
          <Box mt={4}>
            <HStack spacing={3} justify="center">
              <Button
                colorScheme="purple"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    console.log('🔍 Checking database...');
                    const response = await fetch('/api/debug/database-check');
                    const data = await response.json();
                    console.log('📊 Database Check Results:', data);
                    alert(`Database Check Complete! Check console for details.
Summary:
- User exists: ${data.summary?.userExists ? '✅' : '❌'}
- Your FCM subscriptions: ${data.summary?.userFcmSubscriptions}
- Active FCM subscriptions: ${data.summary?.activeUserFcmSubscriptions}
- Total users: ${data.summary?.totalUsers}
- Total FCM subs: ${data.summary?.totalFcmSubscriptions}`);
                  } catch (error) {
                    console.error('Database check failed:', error);
                    alert('Database check failed. Check console for details.');
                  }
                }}
              >
                🔍 Debug Database
              </Button>

              <Button
                colorScheme="orange"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    console.log('🔍 Checking FCM subscription details...');
                    const response = await fetch('/api/debug/fcm-subscription-detail');
                    const data = await response.json();
                    console.log('📱 FCM Subscription Details:', data);
                    alert(`FCM Subscription Check Complete! Check console for details.
Analysis:
- You have FCM subs: ${data.analysis?.userHasFcmSubscriptions ? '✅' : '❌'}
- Active subs: ${data.analysis?.activeFcmSubscriptions}
- Found in user query: ${data.analysis?.foundInAllUsersQuery ? '✅' : '❌'}
- User ID matches: ${data.analysis?.userIdMatches ? '✅' : '❌'}
- Potential Issue: ${data.analysis?.potentialIssue ? '❌ Yes' : '✅ No'}`);
                  } catch (error) {
                    console.error('FCM subscription check failed:', error);
                    alert('FCM subscription check failed. Check console for details.');
                  }
                }}
              >
                📱 Debug FCM Details
              </Button>
            </HStack>
          </Box>
        </Box>

        {/* User Info */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="bold">User Status:</Text>
                <Badge colorScheme={session ? 'green' : 'red'}>
                  {session ? 'Logged In' : 'Not Logged In'}
                </Badge>
              </HStack>

              {session && (
                <Box>
                  <Text fontSize="sm" color="gray.600">
                    User ID: {session.user.id}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    User Name: {session.user.name}
                  </Text>
                </Box>
              )}

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="send-to-all" mb="0">
                  Send to All Active Users (Reminders)
                </FormLabel>
                <Switch
                  id="send-to-all"
                  isChecked={sendToAll}
                  onChange={(e) => setSendToAll(e.target.checked)}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="send-to-all-members" mb="0">
                  Send to ALL Members (Event Creation)
                </FormLabel>
                <Switch
                  id="send-to-all-members"
                  isChecked={sendToAllMembers}
                  onChange={(e) => setSendToAllMembers(e.target.checked)}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="create-db-notifications" mb="0">
                  Create Database Notifications
                </FormLabel>
                <Switch
                  id="create-db-notifications"
                  isChecked={createDatabaseNotifications}
                  onChange={(e) => setCreateDatabaseNotifications(e.target.checked)}
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Event Creation Notification */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">🎵 Event Creation Notification</Heading>

              <FormControl>
                <FormLabel>Event Title</FormLabel>
                <Input
                  value={eventForm.eventTitle}
                  onChange={(e) => setEventForm({...eventForm, eventTitle: e.target.value})}
                  placeholder="Enter event title"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Event Date</FormLabel>
                <Input
                  type="date"
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm({...eventForm, eventDate: e.target.value})}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Event Location</FormLabel>
                <Input
                  value={eventForm.eventLocation}
                  onChange={(e) => setEventForm({...eventForm, eventLocation: e.target.value})}
                  placeholder="Enter event location"
                />
              </FormControl>

              <Button
                colorScheme="blue"
                onClick={() => sendNotification('event-creation', {
                  ...eventForm,
                  sendToAllMembers,
                  createDatabaseNotifications
                })}
                isLoading={loading}
                isDisabled={!session}
              >
                🎵 Send Event Creation Notification
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Practice Reminder */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">🎸 3-Day Practice Reminder</Heading>

              <FormControl>
                <FormLabel>Practice Date</FormLabel>
                <Input
                  type="date"
                  value={practiceForm.practiceDate}
                  onChange={(e) => setPracticeForm({...practiceForm, practiceDate: e.target.value})}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Practice Type</FormLabel>
                <Input
                  value={practiceForm.practiceType}
                  onChange={(e) => setPracticeForm({...practiceForm, practiceType: e.target.value})}
                  placeholder="Latihan Rutin, Persiapan Manggung, dll"
                />
              </FormControl>

              <Button
                colorScheme="green"
                onClick={() => sendNotification('practice-reminder', practiceForm)}
                isLoading={loading}
                isDisabled={!session}
              >
                🎸 Send Practice Reminder
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Performance Reminders */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">🎤 Performance Reminders</Heading>

              <FormControl>
                <FormLabel>Performance Title</FormLabel>
                <Input
                  value={performanceForm.performanceTitle}
                  onChange={(e) => setPerformanceForm({...performanceForm, performanceTitle: e.target.value})}
                  placeholder="Enter performance title"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Performance Date & Time</FormLabel>
                <Input
                  type="datetime-local"
                  value={performanceForm.performanceDate.slice(0, 16)}
                  onChange={(e) => setPerformanceForm({...performanceForm, performanceDate: e.target.value})}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Performance Location</FormLabel>
                <Input
                  value={performanceForm.performanceLocation}
                  onChange={(e) => setPerformanceForm({...performanceForm, performanceLocation: e.target.value})}
                  placeholder="Enter performance location"
                />
              </FormControl>

              <HStack spacing={3}>
                <Button
                  colorScheme="orange"
                  onClick={() => sendNotification('performance-reminder', {
                    ...performanceForm,
                    reminderType: 'H1'
                  })}
                  isLoading={loading}
                  isDisabled={!session}
                  flex={1}
                >
                  🎤 Send H-1 Reminder
                </Button>

                <Button
                  colorScheme="red"
                  onClick={() => sendNotification('performance-reminder', {
                    ...performanceForm,
                    reminderType: '2_HOURS'
                  })}
                  isLoading={loading}
                  isDisabled={!session}
                  flex={1}
                >
                  ⏰ Send 2-Hour Reminder
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Team Member Join */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">👥 Team Member Join Notification</Heading>

              <FormControl>
                <FormLabel>New Member Name</FormLabel>
                <Input
                  value={teamMemberForm.newMemberName}
                  onChange={(e) => setTeamMemberForm({...teamMemberForm, newMemberName: e.target.value})}
                  placeholder="Enter new member name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Role</FormLabel>
                <Input
                  value={teamMemberForm.role}
                  onChange={(e) => setTeamMemberForm({...teamMemberForm, role: e.target.value})}
                  placeholder="Gitaris, Drummer, Vokalis, dll"
                />
              </FormControl>

              <Button
                colorScheme="purple"
                onClick={() => sendNotification('team-member', teamMemberForm)}
                isLoading={loading}
                isDisabled={!session}
              >
                👥 Send Team Member Notification
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Member Join Event */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">👥 Member Join Event Notification</Heading>

              <FormControl>
                <FormLabel>Event ID</FormLabel>
                <Input
                  value={memberJoinEventForm.eventId}
                  onChange={(e) => setMemberJoinEventForm({...memberJoinEventForm, eventId: e.target.value})}
                  placeholder="Enter event ID (e.g., evt_123...)"
                />
              </FormControl>

              <FormControl>
                <FormLabel>New Member Name</FormLabel>
                <Input
                  value={memberJoinEventForm.newMemberName}
                  onChange={(e) => setMemberJoinEventForm({...memberJoinEventForm, newMemberName: e.target.value})}
                  placeholder="Enter new member name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Member Role</FormLabel>
                <Input
                  value={memberJoinEventForm.memberRole}
                  onChange={(e) => setMemberJoinEventForm({...memberJoinEventForm, memberRole: e.target.value})}
                  placeholder="Gitaris, Drummer, Vokalis, dll"
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="send-to-existing-only" mb="0">
                  Send to Existing Members Only
                </FormLabel>
                <Switch
                  id="send-to-existing-only"
                  isChecked={memberJoinEventForm.sendToExistingMembersOnly}
                  onChange={(e) => setMemberJoinEventForm({...memberJoinEventForm, sendToExistingMembersOnly: e.target.checked})}
                />
              </FormControl>

              <Button
                colorScheme="teal"
                onClick={() => sendNotification('member-join-event', memberJoinEventForm)}
                isLoading={loading}
                isDisabled={!session || !memberJoinEventForm.eventId}
              >
                👥 Send Member Join Event Notification
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Song Addition */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">🎶 Song Addition Notification</Heading>

              <FormControl>
                <FormLabel>Song Title</FormLabel>
                <Input
                  value={songForm.songTitle}
                  onChange={(e) => setSongForm({...songForm, songTitle: e.target.value})}
                  placeholder="Enter song title"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Artist</FormLabel>
                <Input
                  value={songForm.artist}
                  onChange={(e) => setSongForm({...songForm, artist: e.target.value})}
                  placeholder="Enter artist name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Added By</FormLabel>
                <Input
                  value={songForm.addedBy}
                  onChange={(e) => setSongForm({...songForm, addedBy: e.target.value})}
                  placeholder="Who added this song?"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Difficulty</FormLabel>
                <Select
                  value={songForm.difficulty}
                  onChange={(e) => setSongForm({...songForm, difficulty: e.target.value})}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                </Select>
              </FormControl>

              <Button
                colorScheme="cyan"
                onClick={() => sendNotification('song-addition', songForm)}
                isLoading={loading}
                isDisabled={!session}
              >
                🎶 Send Song Addition Notification
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Result */}
        {result && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="green.600">✅ UKM Band Notification Sent!</Heading>

                <Box p={4} bg="green.50" border="1px" borderColor="green.200" borderRadius="md">
                  <VStack spacing={2} align="stretch">
                    <Text><strong>Message:</strong> {result.message}</Text>
                    <Text><strong>Target Users:</strong> {result.targetUsers}</Text>

                    {result.eventTitle && (
                      <Text><strong>Event:</strong> {result.eventTitle}</Text>
                    )}

                    {result.newMemberName && (
                      <Text><strong>New Member:</strong> {result.newMemberName} ({result.role || result.memberRole})</Text>
                    )}

                    {result.eventId && result.type === 'MEMBER_JOIN_EVENT' && (
                      <Text><strong>Event ID:</strong> {result.eventId}</Text>
                    )}

                    {result.songTitle && (
                      <Text><strong>Song:</strong> {result.songTitle} - {result.artist}</Text>
                    )}
                  </VStack>
                </Box>

                <Alert status="info">
                  <AlertIcon />
                  Check your device notification center for the UKM Band notification!
                </Alert>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
      </VStack>
    </Container>
  );
}