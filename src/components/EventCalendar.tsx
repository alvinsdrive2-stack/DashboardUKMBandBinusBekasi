'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Badge,
  VStack,
  HStack,
  Icon,
  Heading,
  Divider,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import { EventWithPersonnel } from '@/types';
import EventDetailModal from './EventDetailModal';

interface EventCalendarProps {
  events: EventWithPersonnel[];
  userId?: string;
  onEventClick?: (event: EventWithPersonnel) => void;
}

export default function EventCalendar({ events, userId, onEventClick }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventWithPersonnel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Color scheme
  const bgCard = '#ffffff';
  const textPrimary = '#1f2937';
  const textSecondary = '#6b7280';
  const borderColor = '#e5e7eb';
  const accentColor = '#3b82f6';
  const accentBg = '#eff6ff';
  const todayBg = 'rgba(59, 130, 246, 0.1)';
  const todayBorder = '#3b82f6';
  const eventDotColors = {
    PUBLISHED: '#10b981',
    FINISHED: '#6b7280',
    DRAFT: '#f59e0b',
    SUBMITTED: '#8b5cf6',
    REJECTED: '#ef4444'
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!date) return [];

    // Use local timezone to avoid +1 day issue
    const formatDateToYYYYMMDD = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dateStr = formatDateToYYYYMMDD(date);
    return events.filter(event => {
      const eventDate = formatDateToYYYYMMDD(new Date(event.date));
      return eventDate === dateStr;
    });
  };

  const getUserEventsForDate = (date: Date) => {
    if (!date || !userId) return [];

    // Use local timezone to avoid +1 day issue
    const formatDateToYYYYMMDD = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dateStr = formatDateToYYYYMMDD(date);
    return events.filter(event => {
      const eventDate = formatDateToYYYYMMDD(new Date(event.date));
      const isUserEvent = event.personnel.some(p => p.userId === userId);
      return eventDate === dateStr && isUserEvent;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: EventWithPersonnel) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    onEventClick?.(event);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const formatMonth = (date: Date) => {
    // Use UTC date to avoid timezone issues
    return date.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta'
    });
  };

  const formatDayHeader = (dayIndex: number) => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return days[dayIndex];
  };

  const days = getDaysInMonth(currentDate);
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const selectedDateUserEvents = selectedDate ? getUserEventsForDate(selectedDate) : [];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <Box bg={bgCard} borderRadius="lg" border="1px" borderColor={borderColor} boxShadow="md" p="6">
      {/* Calendar Header */}
      <HStack justify="space-between" align="center" mb="6">
        <HStack>
          <Icon as={CalendarDaysIcon} width={7} height={7} color={accentColor} />
          <Heading size="md" color={textPrimary} fontWeight="600">
            Kalender Event
          </Heading>
        </HStack>
        <HStack spacing="2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePrevMonth}
            _hover={{ bg: accentBg }}
            borderRadius="md"
          >
            <ChevronLeftIcon width={16} height={16} />
          </Button>
          <Text minW="140px" textAlign="center" fontWeight="600" color={textPrimary}>
            {formatMonth(currentDate)}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleNextMonth}
            _hover={{ bg: accentBg }}
            borderRadius="md"
          >
            <ChevronRightIcon width={16} height={16} />
          </Button>
        </HStack>
      </HStack>

      {/* Calendar Grid - Full Width */}
        <Box mb="6">
          {/* Day Headers */}
          <HStack spacing="1" mb="2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, index) => (
              <Box
                key={index}
                flex="1"
                textAlign="center"
                py="2"
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight="600"
                color={textSecondary}
                textTransform="uppercase"
              >
                {day}
              </Box>
            ))}
          </HStack>

          {/* Calendar Days */}
          <VStack spacing="1" align="stretch">
            {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => (
              <HStack key={weekIndex} spacing="1">
                {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
                  const dateEvents = date ? getEventsForDate(date) : [];
                  const userEvents = date ? getUserEventsForDate(date) : [];
                  const hasEvents = dateEvents.length > 0;
                  const hasUserEvents = userEvents.length > 0;

                  return (
                    <Box
                      key={dayIndex}
                      flex="1"
                      aspectRatio="1"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      position="relative"
                      bg={
                        date && selectedDate?.toDateString() === date.toDateString()
                          ? accentBg
                          : date && isToday(date)
                          ? todayBg
                          : 'transparent'
                      }
                      border={
                        date && isToday(date)
                          ? `2px solid ${todayBorder}`
                          : date && selectedDate?.toDateString() === date.toDateString()
                          ? `2px solid ${accentColor}`
                          : '1px solid'
                      }
                      borderColor={borderColor}
                      borderRadius="md"
                      cursor={date ? 'pointer' : 'default'}
                      onClick={() => date && handleDateClick(date)}
                      transition="all 0.2s"
                      _hover={date ? { bg: accentBg, transform: 'scale(1.05)' } : {}}
                      opacity={date && isCurrentMonth(date) ? 1 : 0.3}
                    >
                      {date && (
                        <>
                          <Text
                            fontSize={{ base: 'xs', sm: 'sm' }}
                            fontWeight={isToday(date) ? '700' : '500'}
                            color={
                              isToday(date)
                                ? accentColor
                                : isCurrentMonth(date)
                                ? textPrimary
                                : textSecondary
                            }
                          >
                            {date.getDate()}
                          </Text>

                          {/* Event indicators */}
                          <HStack spacing="1" mt="1">
                            {hasUserEvents && (
                              <Box
                                w="2"
                                h="2"
                                bg="#f59e0b"
                                borderRadius="full"
                                title="Event Anda"
                              />
                            )}
                            {hasEvents && !hasUserEvents && (
                              <Box
                                w="2"
                                h="2"
                                bg={eventDotColors[dateEvents[0].status] || accentColor}
                                borderRadius="full"
                                title="Event Tersedia"
                              />
                            )}
                          </HStack>
                        </>
                      )}
                    </Box>
                  );
                })}
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* Event List - Below Calendar */}
        {selectedDate && (
          <Box>
            <VStack spacing="4" align="stretch">
              <Box>
                <Heading size="md" color={textPrimary} fontWeight="600" mb="2">
                  {selectedDate.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Asia/Jakarta'
                  })}
                </Heading>
                <Text fontSize="sm" color={textSecondary}>
                  Event yang dijadwalkan pada tanggal ini
                </Text>
              </Box>

              {/* User Events */}
              {selectedDateUserEvents.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="600" color={textPrimary} mb="3">
                    🎵 Partisipasi Anda
                  </Text>
                  <VStack spacing="3" align="stretch">
                    {selectedDateUserEvents.map(event => (
                      <Box
                        key={`user-${event.id}`}
                        bg="#fef3c7"
                        border="1px solid #f59e0b"
                        borderRadius="lg"
                        p="4"
                        cursor="pointer"
                        onClick={() => handleEventClick(event)}
                        _hover={{ bg: '#fde68a', transform: 'translateY(-2px)', boxShadow: 'md' }}
                        transition="all 0.2s"
                        boxShadow="sm"
                      >
                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing="2" flex="1">
                            <HStack>
                              <MusicalNoteIcon width={16} height={16} color="#d97706" />
                              <Text fontSize="md" fontWeight="600" color="#92400e">
                                {event.title}
                              </Text>
                              <Badge bg="#f59e0b" color="white" fontSize="xs">
                                {event.personnel.find(p => p.userId === userId)?.role}
                              </Badge>
                            </HStack>
                            <HStack spacing="4" color="#78350f" fontSize="sm">
                              <HStack>
                                <ClockIcon width={14} height={14} />
                                <Text>
                                  {new Date(event.date).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Text>
                              </HStack>
                              <HStack>
                                <MapPinIcon width={14} height={14} />
                                <Text>{event.location}</Text>
                              </HStack>
                            </HStack>
                          </VStack>
                          <Button
                            size="xs"
                            bg="#d97706"
                            color="white"
                            _hover={{ bg: '#b45309' }}
                            fontWeight="600"
                          >
                            Detail
                          </Button>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* Other Events */}
              {selectedDateEvents.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="600" color={textPrimary} mb="3">
                    📅 Event Tersedia
                  </Text>
                  <VStack spacing="3" align="stretch">
                    {selectedDateEvents
                      .filter(event => !selectedDateUserEvents.some(ue => ue.id === event.id))
                      .map(event => (
                        <Box
                          key={`available-${event.id}`}
                          bg={event.status === 'PUBLISHED' ? '#f0fdf4' : '#f8fafc'}
                          border="1px solid"
                          borderColor={eventDotColors[event.status] || borderColor}
                          borderRadius="lg"
                          p="4"
                          cursor="pointer"
                          onClick={() => handleEventClick(event)}
                          _hover={{
                            bg: event.status === 'PUBLISHED' ? '#dcfce7' : '#f1f5f9',
                            transform: 'translateY(-2px)',
                            boxShadow: 'md'
                          }}
                          transition="all 0.2s"
                          boxShadow="sm"
                        >
                          <HStack justify="space-between" align="start">
                            <VStack align="start" spacing="2" flex="1">
                              <HStack>
                                <MusicalNoteIcon width={16} height={16} color={eventDotColors[event.status]} />
                                <Text fontSize="md" fontWeight="600" color={textPrimary}>
                                  {event.title}
                                </Text>
                                <Badge
                                  bg={eventDotColors[event.status]}
                                  color="white"
                                  fontSize="xs"
                                >
                                  {event.status}
                                </Badge>
                              </HStack>
                              <HStack spacing="4" color={textSecondary} fontSize="sm">
                                <HStack>
                                  <ClockIcon width={14} height={14} />
                                  <Text>
                                    {new Date(event.date).toLocaleTimeString('id-ID', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </Text>
                                </HStack>
                                <HStack>
                                  <MapPinIcon width={14} height={14} />
                                  <Text>{event.location}</Text>
                                </HStack>
                              </HStack>
                            </VStack>
                            <Button
                              size="xs"
                              bg={accentColor}
                              color="white"
                              _hover={{ bg: '#2563eb' }}
                              fontWeight="600"
                            >
                              Lihat Detail
                            </Button>
                          </HStack>
                        </Box>
                      ))}
                  </VStack>
                </Box>
              )}

              {/* No Events */}
              {selectedDateEvents.length === 0 && selectedDateUserEvents.length === 0 && (
                <Box
                  p="8"
                  bg={accentBg}
                  border="1px solid"
                  borderColor={accentColor}
                  borderRadius="lg"
                  textAlign="center"
                >
                  <Box mb="3" display="flex" justifyContent="center">
                    <CalendarDaysIcon width={48} height={48} color={accentColor} />
                  </Box>
                  <Text fontSize="md" color={textPrimary} fontWeight="600" mb="1">
                    Tidak ada event pada tanggal ini
                  </Text>
                  <Text fontSize="sm" color={textSecondary}>
                    Pilih tanggal lain untuk melihat event yang tersedia
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        )}

        {/* No Date Selected */}
        {!selectedDate && (
          <Box
            p="8"
            bg={accentBg}
            border="1px solid"
            borderColor={accentColor}
            borderRadius="lg"
            textAlign="center"
          >
            <Box mb="3" display="flex" justifyContent="center">
              <CalendarDaysIcon width={48} height={48} color={accentColor} />
            </Box>
            <Text fontSize="md" color={textPrimary} fontWeight="600" mb="1">
              Pilih Tanggal pada Kalender
            </Text>
            <Text fontSize="sm" color={textSecondary}>
              Klik pada tanggal untuk melihat event yang dijadwalkan
            </Text>
          </Box>
        )}

      {/* Legend */}
      <Box mt="6" pt="4" borderTop="1px solid" borderColor={borderColor}>
        <HStack spacing="4" fontSize="xs" color={textSecondary}>
          <HStack spacing="1">
            <Box w="3" h="3" bg="#f59e0b" borderRadius="full" />
            <Text>Partisipasi Anda</Text>
          </HStack>
          <HStack spacing="1">
            <Box w="3" h="3" bg="#10b981" borderRadius="full" />
            <Text>Event Published</Text>
          </HStack>
          <HStack spacing="1">
            <Box w="3" h="3" bg="#f59e0b" borderRadius="full" />
            <Text>Event Draft</Text>
          </HStack>
          <HStack spacing="1">
            <Box w="3" h="3" bg="#8b5cf6" borderRadius="full" />
            <Text>Event Submitted</Text>
          </HStack>
        </HStack>
      </Box>

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        currentUserId={userId}
      />
    </Box>
  );
}