"use client";

import { useState, useEffect } from "react";
import { Box, Button, VStack, Text, Icon, Fade } from "@chakra-ui/react";
import { DownloadIcon, CloseIcon } from "@chakra-ui/icons";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if already installed
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  };

  useEffect(() => {
    if (sessionStorage.getItem("pwa-prompt-dismissed")) {
      setShowPrompt(false);
    }
  }, []);

  if (isInstalled || !deferredPrompt || !showPrompt) {
    return null;
  }

  return (
    <Fade in={showPrompt}>
      <Box
        position="fixed"
        bottom={4}
        left={4}
        right={4}
        bg="white"
        borderRadius="lg"
        boxShadow="lg"
        p={4}
        zIndex={100000}
        border="1px solid"
        borderColor="gray.200"
      >
        <VStack spacing={3} align="stretch">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <VStack spacing={1} align="start" flex={1}>
              <Text fontWeight="bold" fontSize="md" color="black">
                Install BandHub App
              </Text>
              <Text fontSize="sm" color="darkgrey">
                Install aplikasi untuk akses lebih cepat dan pengalaman yang lebih baik
              </Text>
            </VStack>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              aria-label="Tutup"
            >
              <CloseIcon />
            </Button>
          </Box>
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="red"
            size="sm"
            onClick={handleInstallClick}
            w="full"
          >
            Install Sekarang
          </Button>
        </VStack>
      </Box>
    </Fade>
  );
}