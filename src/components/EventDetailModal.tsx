'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Divider,
  Heading,
  Icon,
  Button,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { EventWithPersonnel } from '@/types';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventWithPersonnel | null;
  currentUserId?: string;
}

export default function EventDetailModal({
  isOpen,
  onClose,
  event,
  currentUserId
}: EventDetailModalProps) {

  const bgCard = useColorModeValue('#ffffff', '#2d3748');
  const textPrimary = useColorModeValue('#1f2937', '#f7fafc');
  const textSecondary = useColorModeValue('#6b7280', '#a0aec0');
  const borderColor = useColorModeValue('#e5e7eb', '#4a5568');
  const accentColor = '#3b82f6';
  const successColor = '#10b981';
  const warningColor = '#f59e0b';
  const dangerColor = '#ef4444';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { bg: '#f0fdf4', color: successColor };
      case 'PENDING':
        return { bg: '#fffbeb', color: warningColor };
      case 'REJECTED':
        return { bg: '#fef2f2', color: dangerColor };
      default:
        return { bg: '#f3f4f6', color: textSecondary };
    }
  };

  // Sekarang hanya mengembalikan karakter string, bukan elemen JSX
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return '✓';
      case 'PENDING': return '…';
      case 'REJECTED': return '✗';
      default: return '?';
    }
  };

  const getPersonnelByRole = () => {
    if (!event) return {};
    console.log('EventDetailModal - Event data:', event);
    console.log('EventDetailModal - Personnel data:', event.personnel);
    const roles = ['Vocal', 'Guitar 1', 'Guitar 2', 'Keyboard', 'Bass', 'Drum'];
    const personnelByRole: Record<string, any[]> = {};
    roles.forEach(role => {
      personnelByRole[role] = (event.personnel || []).filter(p => p.role === role);
      console.log(`Personnel for role ${role}:`, personnelByRole[role]);
    });
    return personnelByRole;
  };

  if (!event) return null;

  const eventDate = new Date(event.date);
  const personnelByRole = getPersonnelByRole();
  const roles = ['Vocal', 'Guitar 1', 'Guitar 2', 'Keyboard', 'Bass', 'Drum'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(4px)" />
      <ModalContent bg={bgCard} borderRadius="xl" boxShadow="2xl">
        <ModalHeader pb="4" borderBottom="1px solid" borderColor={borderColor}>
          <HStack spacing="3">
            <div
              style={{
                backgroundColor: '#eff6ff',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                color: accentColor,
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              EVENT
            </div>
            <VStack align="start" spacing="0" flex="1">
              <Heading size="lg" color={textPrimary} fontWeight="700">
                {event.title}
              </Heading>
              <HStack spacing="3">
                <Badge
                  bg={event.status === 'PUBLISHED' ? '#f0fdf4' : '#f3f4f6'}
                  color={event.status === 'PUBLISHED' ? successColor : textSecondary}
                  px="3"
                  py="1"
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="600"
                  border="1px solid"
                  borderColor={event.status === 'PUBLISHED' ? '#d1fae5' : borderColor}
                >
                  {event.status}
                </Badge>
                {event.isSubmittedByPublic && (
                  <Badge bg="#fdf4ff" color="#9333ea" px="3" py="1" borderRadius="md" fontSize="xs" fontWeight="600">
                    Public Submission
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>

        <ModalCloseButton color={textSecondary} _hover={{ color: textPrimary }} />

        <ModalBody py="6">
          <VStack spacing="4" align="stretch" mb="6">
            <HStack spacing="4" color={textSecondary} fontSize="sm">
              <HStack>
                <Text fontSize="md" color={accentColor}>Date:</Text>
                <Text>
                  {eventDate.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </HStack>
              <HStack>
                <Text fontSize="md" color={accentColor}>Time:</Text>
                <Text>
                  {eventDate.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </HStack>
            </HStack>

            <HStack spacing="2" color={textSecondary} fontSize="sm">
              <Text fontSize="md" color={accentColor}>Location:</Text>
              <Text>{event.location}</Text>
            </HStack>

            {event.description && (
              <div>
                <Text fontSize="sm" fontWeight="600" color={textPrimary} mb="2">
                  Deskripsi
                </Text>
                <Text fontSize="sm" color={textSecondary} lineHeight="1.6">
                  {event.description}
                </Text>
              </div>
            )}

            {event.submittedBy && (
              <div>
                <Text fontSize="sm" fontWeight="600" color={textPrimary} mb="2">
                  Diajukan oleh
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  {event.submittedBy}
                </Text>
              </div>
            )}
          </VStack>

          <Divider borderColor={borderColor} my="6" />

          <VStack spacing="4" align="stretch">
            <Heading size="md" color={textPrimary} fontWeight="600">
              Line Up Personel
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
              {roles.map(role => {
                const rolePersonnel = personnelByRole[role] || [];
                const isCurrentUserInRole = rolePersonnel.some(p => p.userId === currentUserId);

                return (
                  <div
                    key={role}
                    style={{
                      backgroundColor: isCurrentUserInRole ? '#f0f9ff' : '#f9fafb',
                      border: `1px solid ${isCurrentUserInRole ? '#3b82f6' : borderColor}`,
                      borderRadius: '8px',
                      padding: '16px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {isCurrentUserInRole && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '0',
                          right: '0',
                          backgroundColor: accentColor,
                          color: 'white',
                          padding: '4px 8px',
                          borderBottomLeftRadius: '8px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}
                      >
                        ANDA
                      </div>
                    )}

                    <VStack align="start" spacing="3" width="full">
                      <HStack justify="space-between" width="full">
                        <Text fontSize="sm" fontWeight="600" color={textPrimary}>
                          {role}
                        </Text>
                        <Badge
                          bg={rolePersonnel.length > 0 ? '#f0fdf4' : '#fef2f2'}
                          color={rolePersonnel.length > 0 ? successColor : dangerColor}
                          px="2"
                          py="1"
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="600"
                        >
                          {rolePersonnel.length > 0 ? 'Terisi' : 'Kosong'}
                        </Badge>
                      </HStack>

                      {rolePersonnel.length > 0 ? (
                        <VStack spacing="2" align="start" width="full">
                          {rolePersonnel.map(personnel => {
                            const statusColors = getStatusColor(personnel.status);
                            return (
                              <HStack
                                key={personnel.id}
                                bg="white"
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="md"
                                p="2"
                                width="full"
                                justify="space-between"
                              >
                                <HStack spacing="2">
                                  <Avatar
                                    size="xs"
                                    name={personnel.user?.name || 'Unknown'}
                                    bg={accentColor}
                                    color="white"
                                    fontSize="10px"
                                  >
                                    {(personnel.user?.name || 'U').charAt(0).toUpperCase()}
                                  </Avatar>
                                  <VStack align="start" spacing="0">
                                    <Text fontSize="xs" fontWeight="600" color={textPrimary}>
                                      {personnel.user?.name || 'Unknown'}
                                    </Text>
                                    {personnel.user?.nim && (
                                      <Text fontSize="10px" color={textSecondary}>
                                        {personnel.user.nim}
                                      </Text>
                                    )}
                                  </VStack>
                                </HStack>

                                <HStack spacing="1" alignItems="center">
                                  <Icon color={statusColors.color} fontSize="16px" fontWeight="bold">
                                    {getStatusIcon(personnel.status)}
                                  </Icon>
                                  <Badge
                                    bg={statusColors.bg}
                                    color={statusColors.color}
                                    px="2"
                                    py="1"
                                    borderRadius="md"
                                    fontSize="10px"
                                    fontWeight="600"
                                  >
                                    {personnel.status}
                                  </Badge>
                                </HStack>
                              </HStack>
                            );
                          })}
                        </VStack>
                      ) : (
                        <VStack
                          py="4"
                          justify="center"
                          align="center"
                          width="full"
                          bg="white"
                          border="1px dashed"
                          borderColor={borderColor}
                          borderRadius="md"
                        >
                          <Text fontSize="lg" color={textSecondary} fontWeight="bold">
                            No Personnel
                          </Text>
                          <Text fontSize="xs" color={textSecondary} textAlign="center">
                            Belum ada personel terdaftar
                          </Text>
                        </VStack>
                      )}
                    </VStack>
                  </div>
                );
              })}
            </SimpleGrid>
          </VStack>
        </ModalBody>

        <ModalFooter pt="4" borderTop="1px solid" borderColor={borderColor}>
          <Button
            variant="ghost"
            onClick={onClose}
            fontWeight="600"
            _hover={{ bg: '#f3f4f6' }}
          >
            Tutup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
