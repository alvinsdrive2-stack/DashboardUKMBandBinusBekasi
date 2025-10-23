'use client';

import { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Tooltip,
  useToast,
  Card,
  CardBody,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';
import {
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { EventWithPersonnel } from '@/types';

// Simplified types for calendar events
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
  personnelCount: number;
  availableSlots: number;
  hasRegistered: boolean;
  isUpcoming: boolean;
}

interface ParticipationInsight {
  date: string;
  events: number;
  registeredEvents: number;
  participationRate: number;
}

export default function MemberCalendar({
  events,
  userRegistrations
}: {
  events: EventWithPersonnel[];
  userRegistrations: Array<{ eventId: string; status: string; eventDate: string; }>;
}) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const toast = useToast();

  // Process events for calendar
  const processCalendarEvents = (): CalendarEvent[] => {
    return events.map(event => {
      const eventDate = new Date(event.date);
      const availableSlots = event.personnel ? event.personnel.filter((p: any) => !p.userId).length : 6; // Default 6 slots

      return {
        id: event.id,
        title: event.title,
        date: eventDate.toISOString().split('T')[0], // Convert Date to string format YYYY-MM-DD
        location: event.location,
        status: event.status,
        personnelCount: event.personnel?.length || 0,
        availableSlots,
        hasRegistered: userRegistrations.some(reg => reg.eventId === event.id),
        isUpcoming: eventDate >= new Date(new Date().setHours(0, 0, 0, 0))
      };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return '#48bb78'; // Green for active
      case 'FINISHED':
        return '#e53935'; // Orange for completed
      case 'DRAFT':
        return '#ef4444'; // Red for draft
      default:
        return '#94a3b8'; // Blue for others
    }
  };

  return (
    <VStack spacing="6">
      {/* Calendar Header */}
      <Card bg="rgba(255, 255, 255, 0.05)" border="1px solid rgba(220, 38, 38, 0.15)" borderRadius="lg">
        <CardBody>
          <HStack justify="space-between" align="center" mb="4">
            <Heading size="lg" color="white" fontWeight="600">
              📅 Event Calendar
            </Heading>
            <HStack spacing="4">
              <Button
                leftIcon={<Icon as={CalendarDaysIcon} width={20} height={20} />}
                onClick={() => window.location.reload()}
                size="sm"
                bg="rgba(255, 255, 255, 0.1)"
                color="white"
                _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
              >
                Hari Ini
              </Button>
              <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long'
                })}
              </Text>
            </HStack>
          </HStack>
          </CardBody>
        </Card>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="6">
        {/* Simplified Event List */}
        <Card bg="rgba(255, 255, 255, 0.05)" border="1px solid rgba(220, 38, 38, 0.15)" borderRadius="lg">
          <CardBody p="6">
            <VStack spacing="4" align="stretch">
              <Heading size="md" color="white" fontWeight="600">
                📋 Upcoming Events
              </Heading>

              {processCalendarEvents()
                .filter(event => event.isUpcoming)
                .slice(0, 5)
                .map((event) => (
                <Box
                  key={event.id}
                  bg="rgba(255, 255, 255, 0.05)"
                  p="4"
                  borderRadius="lg"
                  border="1px solid rgba(220, 38, 38, 0.2)"
                  cursor="pointer"
                  onClick={() => setSelectedEvent(event)}
                  _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                >
                  <HStack justify="space-between" align="start" mb="3">
                    <VStack align="start" spacing="1">
                      <Text color="white" fontWeight="600" fontSize="sm">
                        {event.title}
                      </Text>
                      <HStack color="rgba(255, 255, 255, 0.7)" fontSize="xs" spacing="3">
                        <HStack>
                          <Icon as={ClockIcon} width={14} height={14} />
                          <Text>
                            {new Date(event.date).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </HStack>
                        <HStack>
                          <Icon as={MapPinIcon} width={14} height={14} />
                          <Text>{event.location}</Text>
                        </HStack>
                      </HStack>
                    </VStack>
                    <Badge
                      bg={getStatusColor(event.status)}
                      color="white"
                      px="3"
                      py="1"
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="600"
                    >
                      {event.status}
                    </Badge>
                  </HStack>

                  {event.hasRegistered && (
                    <Badge colorScheme="green" fontSize="xs" mt="2">
                      ✓ Anda Terdaftar
                    </Badge>
                  )}

                  {!event.hasRegistered && event.availableSlots > 0 && (
                    <Text color="rgba(255, 255, 255, 0.7)" fontSize="xs" mt="2">
                      {event.availableSlots} slot tersedia
                    </Text>
                  )}
                </Box>
              ))}

              {processCalendarEvents().filter(event => event.isUpcoming).length === 0 && (
                <Box textAlign="center" py="8">
                  <CalendarDaysIcon width={48} height={48} color="rgba(255, 255, 255, 0.5)" />
                  <Text color="rgba(255, 255, 255, 0.7)" fontSize="lg" mt="4">
                    Tidak ada event mendatang
                  </Text>
                  <Text color="rgba(255, 255, 255, 0.5)" fontSize="sm">
                    Cek kembali nanti untuk update terbaru
                  </Text>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Event Details Modal */}
        {selectedEvent && (
          <Card bg="rgba(255, 255, 255, 0.05)" border="1px solid rgba(220, 38, 38, 0.15)" borderRadius="lg" size="lg">
            <CardBody>
              <HStack justify="space-between" mb="4">
                <Heading size="md" color="white" fontWeight="600">
                  📅 {selectedEvent.title}
                </Heading>
                <Button
                  onClick={() => setSelectedEvent(null)}
                  size="sm"
                  bg="rgba(220, 38, 38, 0.2)"
                  color="white"
                  _hover={{ bg: "rgba(220, 38, 38, 0.3)" }}
                >
                  ✕
                </Button>
              </HStack>

              <VStack spacing="4" color="white">
                <HStack spacing="3" mb="2">
                  <Icon as={CalendarDaysIcon} width={20} height={20} color="#f1f5f9" />
                  <Text>
                    <Text fontWeight="600" color="#f1f5f9">Tanggal:</Text>
                    <Text color="#cbd5e1"> {new Date(selectedEvent.date).toLocaleDateString('id-ID')}</Text>
                  </Text>
                </HStack>

                <HStack spacing="3" mb="2">
                  <Icon as={MapPinIcon} width={20} height={20} color="#f1f5f9" />
                  <Text>
                    <Text fontWeight="600" color="#f1f5f9">Lokasi:</Text>
                    <Text color="#cbd5e1"> {selectedEvent.location}</Text>
                  </Text>
                </HStack>

                <HStack spacing="3" mb="2">
                  <Icon as={ClockIcon} width={20} height={20} color="#f1f5f9" />
                  <Text>
                    <Text fontWeight="600" color="#f1f5f9">Status:</Text>
                    <Badge
                      bg={getStatusColor(selectedEvent.status)}
                      color="white"
                      px="3"
                      py="1"
                      borderRadius="md"
                      fontSize="sm"
                      fontWeight="600"
                    >
                      {selectedEvent.status}
                    </Badge>
                  </Text>
                </HStack>

                <HStack spacing="3" mb="2">
                  <Text fontWeight="600" color="#f1f5f9">Personel:</Text>
                  <Text color="#cbd5e1">{selectedEvent.personnelCount} orang terdaftar</Text>
                </HStack>

                <HStack spacing="3" mb="2">
                  <Text fontWeight="600" color="#f1f5f9">Slot Tersedia:</Text>
                  <Text color="#cbd5e1">{selectedEvent.availableSlots} slot kosong</Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}
      </SimpleGrid>
    </VStack>
  );
}