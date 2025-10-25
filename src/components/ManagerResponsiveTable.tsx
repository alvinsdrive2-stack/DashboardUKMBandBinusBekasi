'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  Flex,
  Spacer,
  useBreakpointValue,
} from '@chakra-ui/react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
  mobile?: boolean; // Show this column on mobile
}

interface ManagerResponsiveTableProps {
  data: any[];
  columns: Column[];
  title?: string;
  subtitle?: string;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  actionButtons?: (item: any) => React.ReactNode;
}

export default function ManagerResponsiveTable({
  data,
  columns,
  title,
  subtitle,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
  emptyMessage = "Tidak ada data tersedia",
  actionButtons,
}: ManagerResponsiveTableProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch">
        {[1, 2, 3, 4, 5].map((item) => (
          <Card key={item} variant="outline" borderRadius="lg">
            <CardBody p={4}>
              <VStack spacing={3}>
                <Box w="100%" h="12px" bg="#e2e8f0" borderRadius="full" />
                <Box w="80%" h="8px" bg="#e2e8f0" borderRadius="full" />
                <Box w="60%" h="8px" bg="#e2e8f0" borderRadius="full" />
              </VStack>
            </CardBody>
          </Card>
        ))}
      </VStack>
    );
  }

  if (data.length === 0) {
    return (
      <Card
        variant="outline"
        borderRadius="lg"
        textAlign="center"
        py={{ base: 12, md: 16 }}
      >
        <Text color="#718096" fontSize={{ base: 'md', md: 'lg' }}>
          {emptyMessage}
        </Text>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <VStack spacing={4} align="stretch">
        {title && (
          <Box>
            <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="#1a202c">
              {title}
            </Text>
            {subtitle && (
              <Text fontSize={{ base: 'sm', md: 'md' }} color="#718096" mt={1}>
                {subtitle}
              </Text>
            )}
          </Box>
        )}

        {data.map((item, index) => (
          <Card
            key={index}
            variant="outline"
            borderRadius="lg"
            shadow="sm"
            _hover={{ shadow: 'md' }}
            transition="all 0.2s ease"
          >
            <CardBody p={{ base: 4, md: 5 }}>
              <VStack spacing={3} align="stretch">
                {/* Primary Info */}
                {columns
                  .filter(col => col.mobile)
                  .map((column) => (
                    <HStack key={column.key} justify="space-between" align="flex-start">
                      <Text
                        fontSize="sm"
                        fontWeight="600"
                        color="#4a5568"
                        minW="0"
                        flexShrink={0}
                      >
                        {column.label}:
                      </Text>
                      <Box
                        flex="1"
                        textAlign="right"
                        minW="0"
                        overflow="hidden"
                        textOverflow="ellipsis"
                      >
                        {column.render
                          ? column.render(item[column.key], item)
                          : item[column.key]}
                      </Box>
                    </HStack>
                  ))}

                {/* Secondary Info - Hidden/Expandable */}
                <VStack spacing={2} align="stretch">
                  {columns
                    .filter(col => !col.mobile)
                    .slice(0, 2) // Show only first 2 non-mobile columns
                    .map((column) => (
                      <HStack
                        key={column.key}
                        justify="space-between"
                        align="flex-start"
                        fontSize="xs"
                        color="#718096"
                      >
                        <Text minW="0" flexShrink={0}>
                          {column.label}:
                        </Text>
                        <Box
                          flex="1"
                          textAlign="right"
                          minW="0"
                          overflow="hidden"
                          textOverflow="ellipsis"
                        >
                          {column.render
                            ? column.render(item[column.key], item)
                            : item[column.key]}
                        </Box>
                      </HStack>
                    ))}
                </VStack>

                {/* Actions */}
                {(onEdit || onDelete || onView || actionButtons) && (
                  <Flex
                    justify="flex-end"
                    gap={2}
                    pt={2}
                    borderTop="1px solid"
                    borderColor="#e2e8f0"
                  >
                    {onView && (
                      <IconButton
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        aria-label="View details"
                        icon={<EyeIcon width={4} height={4} />}
                        onClick={() => onView(item)}
                      />
                    )}
                    {onEdit && (
                      <IconButton
                        size="sm"
                        variant="ghost"
                        colorScheme="green"
                        aria-label="Edit"
                        icon={<PencilIcon width={4} height={4} />}
                        onClick={() => onEdit(item)}
                      />
                    )}
                    {onDelete && (
                      <IconButton
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        aria-label="Delete"
                        icon={<TrashIcon width={4} height={4} />}
                        onClick={() => onDelete(item)}
                      />
                    )}
                    {actionButtons && actionButtons(item)}
                  </Flex>
                )}
              </VStack>
            </CardBody>
          </Card>
        ))}
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {title && (
        <Box>
          <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="#1a202c">
            {title}
          </Text>
          {subtitle && (
            <Text fontSize={{ base: 'sm', md: 'md' }} color="#718096" mt={1}>
              {subtitle}
            </Text>
          )}
        </Box>
      )}

      <Card
        variant="outline"
        borderRadius="lg"
        shadow="sm"
        overflow="hidden"
      >
        <Box overflowX="auto">
          <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
            <Thead bg="#f8fafc">
              <Tr>
                {columns.map((column) => (
                  <Th
                    key={column.key}
                    fontSize={{ base: 'xs', md: 'sm' }}
                    fontWeight="600"
                    color="#4a5568"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    py={{ base: 3, md: 4 }}
                    px={{ base: 3, md: 4 }}
                    whiteSpace="nowrap"
                  >
                    {column.label}
                  </Th>
                ))}
                <Th
                  fontSize={{ base: 'xs', md: 'sm' }}
                  fontWeight="600"
                  color="#4a5568"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  py={{ base: 3, md: 4 }}
                  px={{ base: 3, md: 4 }}
                  textAlign="center"
                >
                  Aksi
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((item, index) => (
                <Tr key={index} _hover={{ bg: '#f8fafc' }}>
                  {columns.map((column) => (
                    <Td
                      key={column.key}
                      fontSize={{ base: 'sm', md: 'md' }}
                      py={{ base: 3, md: 4 }}
                      px={{ base: 3, md: 4 }}
                      whiteSpace="nowrap"
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : item[column.key]}
                    </Td>
                  ))}
                  <Td
                    fontSize={{ base: 'sm', md: 'md' }}
                    py={{ base: 3, md: 4 }}
                    px={{ base: 2, md: 4 }}
                    textAlign="center"
                  >
                    <Flex justify="center" gap={1}>
                      {onView && (
                        <IconButton
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          aria-label="View details"
                          icon={<EyeIcon width={4} height={4} />}
                          onClick={() => onView(item)}
                        />
                      )}
                      {onEdit && (
                        <IconButton
                          size="sm"
                          variant="ghost"
                          colorScheme="green"
                          aria-label="Edit"
                          icon={<PencilIcon width={4} height={4} />}
                          onClick={() => onEdit(item)}
                        />
                      )}
                      {onDelete && (
                        <IconButton
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          aria-label="Delete"
                          icon={<TrashIcon width={4} height={4} />}
                          onClick={() => onDelete(item)}
                        />
                      )}
                      {actionButtons && actionButtons(item)}
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Card>
    </VStack>
  );
}