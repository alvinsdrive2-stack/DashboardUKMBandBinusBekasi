"use client";

import {
  Box,
  Container,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

export default function Footer() {
  return (
    <Box
      bg={useColorModeValue("#ffffff", "#1a202c")}
      color={useColorModeValue("#6b7280", "#a0aec0")}
      py={3}
      mt={6}
      borderTop="1px solid"
      borderColor={useColorModeValue("#e5e7eb", "#2d3748")}
    >
      <Container maxW="container.xl">
        <Text fontSize="sm" textAlign="center">
          © {new Date().getFullYear()} UKM Band Binus Bekasi. All rights reserved.
        </Text>
        <Text fontSize="xs" textAlign="center" mt={1} opacity={0.8}>
          Made by Ananda Alviansyah P.P. Sudarmawan for UKM Band Binus Bekasi
        </Text>
      </Container>
    </Box>
  );
}