'use client';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  useBreakpointValue,
  Stack,
} from '@chakra-ui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import NextLink from 'next/link';
import type { ReactNode } from 'react';

interface ManagerResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  isCentered?: boolean;
  scrollBehavior?: 'inside' | 'outside';
}

export default function ManagerResponsiveModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  footer,
  showCloseButton = true,
  closeOnOverlayClick = true,
  isCentered = false,
  scrollBehavior = 'inside',
}: ManagerResponsiveModalProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  const modalSize = isMobile ? 'full' : size;
  const modalProps = isMobile
    ? {
        isCentered: false,
        scrollBehavior: 'inside' as const,
        motionPreset: 'slideInBottom' as const,
      }
    : {
        isCentered,
        scrollBehavior,
        motionPreset: 'scale' as const,
      };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      closeOnOverlayClick={closeOnOverlayClick}
      isCentered={modalProps.isCentered}
      motionPreset={modalProps.motionPreset}
      blockScrollOnMount={false}
    >
      <ModalOverlay bg="rgba(0, 0, 0, 0.6)" backdropFilter="blur(4px)" />
      <ModalContent
        bg="white"
        borderRadius={{ base: '0', md: 'xl' }}
        my={{ base: 0, md: 8 }}
        mx={{ base: 0, md: 4 }}
        maxW={{ base: '100vw', md: modalSize === 'full' ? '95vw' : '600px' }}
        maxH={{ base: '100vh', md: '90vh' }}
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <ModalHeader
            borderBottom="1px solid"
            borderColor="#e2e8f0"
            py={{ base: 4, md: 6 }}
            px={{ base: 4, md: 6 }}
          >
            <VStack spacing={2} align="flex-start" flex="1">
              {title && (
                <Heading
                  size={{ base: 'md', md: 'lg' }}
                  color="#1a202c"
                  fontWeight="600"
                  lineHeight="1.2"
                >
                  {title}
                </Heading>
              )}
              {subtitle && (
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  color="#718096"
                  lineHeight="1.4"
                >
                  {subtitle}
                </Text>
              )}
            </VStack>
            {showCloseButton && (
              <ModalCloseButton size={{ base: 'sm', md: 'md' }} onClick={onClose} />
            )}
          </ModalHeader>
        )}

        {/* Body */}
        <ModalBody p={{ base: 4, md: 6 }} flex="1" overflowY="auto">
          {children}
        </ModalBody>

        {/* Footer */}
        {footer && (
          <>
            <Divider borderColor="#e2e8f0" />
            <ModalFooter py={{ base: 4, md: 6 }} px={{ base: 4, md: 6 }} borderTop="none">
              <Stack direction={{ base: 'column', md: 'row' }} spacing={3} width="100%" justify="flex-end">
                {footer}
              </Stack>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// ---------------------------------------
// ✅ Modal Actions
// ---------------------------------------
export function ModalActions({
  cancelText = 'Batal',
  confirmText = 'Simpan',
  onCancel,
  onConfirm,
  isLoading = false,
  isDisabled = false,
  cancelColor = 'gray',
  confirmColor = 'blue',
  confirmLoading = false,
  confirmLoadingText = 'Memproses...',
}: {
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  cancelColor?: string;
  confirmColor?: string;
  confirmLoading?: boolean;
  confirmLoadingText?: string;
}) {
  return (
    <Stack direction={{ base: 'column', md: 'row' }} spacing={3} width="100%">
      <Button
        variant="outline"
        colorScheme={cancelColor}
        onClick={onCancel}
        size={{ base: 'sm', md: 'md' }}
        w={{ base: 'full', md: 'auto' }}
      >
        {cancelText}
      </Button>
      <Button
        colorScheme={confirmColor}
        onClick={onConfirm}
        isLoading={confirmLoading}
        isDisabled={isDisabled}
        size={{ base: 'sm', md: 'md' }}
        w={{ base: 'full', md: 'auto' }}
      >
        {confirmLoading && confirmLoadingText ? confirmLoadingText : confirmText}
      </Button>
    </Stack>
  );
}

// ---------------------------------------
// ✅ Quick Actions (Final Type-Safe, Build Passed)
// ---------------------------------------
export interface QuickActionProps {
  label: string;
  icon?: React.ReactElement; // ✅ ubah dari ReactNode jadi ReactElement optional
  color: string;
  bg?: string;
  onClick?: () => void;
  href?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
}

export function QuickActions({
  actions,
  direction = 'row',
}: {
  actions: QuickActionProps[];
  direction?: 'row' | 'column';
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (!actions || !Array.isArray(actions)) return null;

  return (
    <HStack
      direction={direction}
      spacing={2}
      wrap="wrap"
      justify={isMobile ? 'flex-start' : 'flex-end'}
    >
      {actions.map((action, index) => {
        const {
          href,
          onClick,
          icon,
          color,
          bg,
          label,
          isDisabled,
          isLoading,
        } = action;

        // ✅ Kalau ada href → pakai NextLink
        if (href) {
          return (
            <Button
              key={index}
              as={NextLink}
              href={href}
              size={{ base: 'sm', md: 'md' }}
              leftIcon={icon ?? undefined} // ✅ aman walau undefined
              colorScheme={color}
              bg={bg}
              variant={bg ? 'solid' : 'outline'}
              isDisabled={isDisabled || isLoading}
              isLoading={isLoading}
              flex={{ base: 1, md: 'auto' }}
              _hover={{ textDecoration: 'none', opacity: 0.9 }}
            >
              {label}
            </Button>
          );
        }

        // ✅ Kalau tidak ada href → tombol biasa
        return (
          <Button
            key={index}
            onClick={onClick}
            size={{ base: 'sm', md: 'md' }}
            leftIcon={icon ?? undefined} // ✅ tetap aman
            colorScheme={color}
            bg={bg}
            variant={bg ? 'solid' : 'outline'}
            isDisabled={isDisabled || isLoading}
            isLoading={isLoading}
            flex={{ base: 1, md: 'auto' }}
            _hover={{ opacity: 0.9 }}
          >
            {label}
          </Button>
        );
      })}
    </HStack>
  );
}
