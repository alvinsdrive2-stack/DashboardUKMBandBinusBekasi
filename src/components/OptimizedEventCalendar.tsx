'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Button,
  Text,
  Badge,
  VStack,
  HStack,
  Heading,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { EventWithPersonnel } from '@/types';
import EventDetailModal from './EventDetailModal';
import { CalendarSkeleton } from './LoadingSkeleton';

interface OptimizedEventCalendarProps {
  events: EventWithPersonnel[];
  userId?: string;
  onEventClick?: (event: EventWithPersonnel) => void;
  loading?: boolean;
  viewMode?: 'member' | 'manager';
}

// Memoized components to prevent unnecessary re-renders
const DayHeader = memo(({ day }: { day: string }) => (
  <Box
    flex="1"
    textAlign="center"
    py="2"
    fontSize={{ base: 'xs', sm: 'sm' }}
    fontWeight="600"
    color="#6b7280"
    textTransform="uppercase"
  >
    {day}
  </Box>
));

DayHeader.displayName = 'DayHeader';

const CalendarDay = memo(({
  date,
  isToday,
  isSelected,
  isCurrentMonth,
  hasEvents,
  hasUserEvents,
  onClick
}: {
  date: Date | null;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  hasEvents: boolean;
  hasUserEvents: boolean;
  onClick: () => void;
}) => {
  const handleClick = useCallback(() => {
    if (date) onClick();
  }, [date, onClick]);

  return (
    <Box
      flex="1"
      aspectRatio="1"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      position="relative"
      bg={
        isSelected
          ? '#eff6ff'
          : isToday
          ? 'rgba(59, 130, 246, 0.1)'
          : 'transparent'
      }
      border={
        isToday
          ? '2px solid #3b82f6'
          : isSelected
          ? '2px solid #3b82f6'
          : '1px solid #e5e7eb'
      }
      borderRadius="md"
      cursor={date ? 'pointer' : 'default'}
      onClick={handleClick}
      transition="all 0.2s"
      _hover={date ? { bg: '#eff6ff', transform: 'scale(1.05)' } : {}}
      opacity={isCurrentMonth ? 1 : 0.3}
    >
      {date && (
        <>
          <Text
            fontSize={{ base: 'xs', sm: 'sm' }}
            fontWeight={isToday ? '700' : '500'}
            color={
              isToday
                ? '#3b82f6'
                : isCurrentMonth
                ? '#1f2937'
                : '#6b7280'
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
                bg="#10b981"
                borderRadius="full"
                title="Event Tersedia"
              />
            )}
          </HStack>
        </>
      )}
    </Box>
  );
});

CalendarDay.displayName = 'CalendarDay';

const EventCard = memo(({
  event,
  isUserEvent,
  onClick
}: {
  event: EventWithPersonnel;
  isUserEvent: boolean;
  onClick: () => void;
}) => {
  const eventDate = new Date(event.date);

  return (
    <Box
      bg={isUserEvent ? '#fef3c7' : '#f0fdf4'}
      border="1px solid"
      borderColor={isUserEvent ? '#f59e0b' : '#10b981'}
      borderRadius="lg"
      p="4"
      cursor="pointer"
      onClick={onClick}
      _hover={{
        bg: isUserEvent ? '#fde68a' : '#dcfce7',
        transform: 'translateY(-2px)',
        boxShadow: 'md'
      }}
      transition="all 0.2s"
      boxShadow="sm"
    >
      <HStack justify="space-between" align="start">
        <VStack align="start" spacing="2" flex="1">
          <HStack>
            <MapPinIcon width={16} height={16} color={isUserEvent ? '#d97706' : '#059669'} />
            <Text fontSize="md" fontWeight="600" color={isUserEvent ? '#92400e' : '#1f2937'}>
              {event.title}
            </Text>
            <Badge
              bg={isUserEvent ? '#f59e0b' : '#10b981'}
              color="white"
              fontSize="xs"
            >
              {event.status}
            </Badge>
          </HStack>
          <HStack spacing="4" color={isUserEvent ? '#78350f' : '#6b7280'} fontSize="sm">
            <HStack>
              <ClockIcon width={14} height={14} />
              <Text>
                {eventDate.toLocaleTimeString('id-ID', {
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
          bg={isUserEvent ? '#d97706' : '#3b82f6'}
          color="white"
          _hover={{ bg: isUserEvent ? '#b45309' : '#2563eb' }}
          fontWeight="600"
        >
          Detail
        </Button>
      </HStack>
    </Box>
  );
});

EventCard.displayName = 'EventCard';

export default memo(function OptimizedEventCalendar({
  events,
  userId,
  onEventClick,
  loading = false,
  viewMode = 'member'
}: OptimizedEventCalendarProps) {
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

  // Memoized calculations
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Calculate total cells and add empty cells at the end to complete the grid
    const totalCells = days.length;
    const remainingCells = totalCells % 7;
    const emptyCellsAtEnd = remainingCells > 0 ? 7 - remainingCells : 0;

    // Add empty cells at the end
    for (let i = 0; i < emptyCellsAtEnd; i++) {
      days.push(null);
    }

    return days;
  }, [currentDate]);

  const getEventsForDate = useCallback((date: Date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  }, [events]);

  const getUserEventsForDate = useCallback((date: Date) => {
    if (!date || !userId) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      const isUserEvent = event.personnel && event.personnel.some(p => p.userId === userId);
      return eventDate === dateStr && isUserEvent;
    });
  }, [events, userId]);

  const selectedDateEvents = useMemo(() =>
    selectedDate ? getEventsForDate(selectedDate) : [],
    [selectedDate, getEventsForDate]
  );

  const selectedDateUserEvents = useMemo(() =>
    selectedDate ? getUserEventsForDate(selectedDate) : [],
    [selectedDate, getUserEventsForDate]
  );

  // Event handlers
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  }, [currentDate]);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  }, [currentDate]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleEventClick = useCallback((event: EventWithPersonnel) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    onEventClick?.(event);
  }, [onEventClick]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  }, []);

  const formatMonth = useCallback((date: Date) => {
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, []);

  const formatSelectedDate = useCallback((date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  const isCurrentMonth = useCallback((date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  }, [currentDate]);

  // Show loading skeleton
  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <Box bg={bgCard} borderRadius="lg" border="1px solid" borderColor={borderColor} boxShadow="md" p="6">
      {/* Calendar Header */}
      <HStack justify="space-between" align="center" mb="6">
        <HStack>
          <CalendarDaysIcon width={24} height={24} color={accentColor} />
          <Heading size="md" color={textPrimary} fontWeight="600">
            Kalender Event
          </Heading>
        </HStack>
        <HStack spacing="2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePrevMonth}
            _hover={{ bg: '#eff6ff' }}
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
            _hover={{ bg: '#eff6ff' }}
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
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
            <DayHeader key={day} day={day} />
          ))}
        </HStack>

        {/* Calendar Days */}
        <VStack spacing="1" align="stretch">
          {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
            <HStack key={weekIndex} spacing="1">
              {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
                const dateEvents = date ? getEventsForDate(date) : [];
                const userEvents = date ? getUserEventsForDate(date) : [];
                const hasEvents = dateEvents.length > 0;
                const hasUserEvents = userEvents.length > 0;

                return (
                  <CalendarDay
                    key={`${weekIndex}-${dayIndex}`}
                    date={date}
                    isToday={date ? isToday(date) : false}
                    isSelected={date ? selectedDate?.toDateString() === date.toDateString() : false}
                    isCurrentMonth={date ? isCurrentMonth(date) : false}
                    hasEvents={hasEvents}
                    hasUserEvents={hasUserEvents}
                    onClick={() => date && handleDateClick(date)}
                  />
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
                {formatSelectedDate(selectedDate)}
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
                    <EventCard
                      key={`user-${event.id}`}
                      event={event}
                      isUserEvent={true}
                      onClick={() => handleEventClick(event)}
                    />
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
                      <EventCard
                        key={`available-${event.id}`}
                        event={event}
                        isUserEvent={false}
                        onClick={() => handleEventClick(event)}
                      />
                    ))}
                </VStack>
              </Box>
            )}

            {/* No Events */}
            {selectedDateEvents.length === 0 && selectedDateUserEvents.length === 0 && (
              <Box
                p="8"
                bg="#eff6ff"
                border="1px solid"
                borderColor={accentColor}
                borderRadius="lg"
                textAlign="center"
              >
                <CalendarDaysIcon width={48} height={48} color={accentColor} mb="3" />
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
          bg="#eff6ff"
          border="1px solid"
          borderColor={accentColor}
          borderRadius="lg"
          textAlign="center"
        >
          <CalendarDaysIcon width={48} height={48} color={accentColor} mb="3" />
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
});