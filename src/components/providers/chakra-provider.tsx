'use client';

import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react';

// Abu-abu gelap (Dark Mode) yang lebih lembut
const darkSurface = {
  900: '#121212', // Background utama
  800: '#1e1e1e', // Elevated surfaces/Cards
  700: '#272727', // Hover/Active states
};

// Skala warna Merah (Brand/Highlight)
const brandRed = {
  50: '#FDECEC',
  100: '#F6B6B7',
  200: '#EE8889',
  300: '#E65A5B',
  400: '#E02C2E',
  500: '#D61A1D', // Primary Red (Strong Highlight)
  600: '#C01719',
  700: '#9B1315',
  800: '#750E10',
  900: '#4F0A0B',
};

// Skala warna Hijau untuk Success (Standar profesional)
const semanticGreen = {
    50: '#E6FFFA',
    100: '#B2F5EA',
    200: '#81E6D9',
    300: '#4FD1C5',
    400: '#38B2AC',
    500: '#319795', // Primary Green
    600: '#2C7A7B',
    700: '#285E61',
    800: '#234E52',
    900: '#1D4044',
};

// Skala warna Biru untuk Info
const semanticBlue = {
    50: '#EBF8FF',
    100: '#BEE3F8',
    200: '#90CDF4',
    300: '#63B3ED',
    400: '#4299E1',
    500: '#3182CE', // Primary Blue
    600: '#2B6CB0',
    700: '#254E78',
    800: '#1D4044',
    900: '#1D4044',
};

// Skala warna Oranye untuk Warning
const semanticOrange = {
    50: '#FFF5E7',
    100: '#FEEBC8',
    200: '#FBD38D',
    300: '#F6AD55',
    400: '#ED8936',
    500: '#DD6B20', // Primary Orange
    600: '#C05621',
    700: '#9C4221',
    800: '#7B341E',
    900: '#652B19',
};


const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  
  colors: {
    brand: brandRed, 
    
    // Netral/Surface yang disesuaikan untuk Dark Mode
    gray: {
      ...darkSurface,
      50: '#F7FAFC', // Untuk Light Mode jika diaktifkan
      // Tambahkan warna abu-abu terang untuk teks
      200: '#e2e8f0', // Teks terang (foreground)
      400: '#a0aec0', // Teks sekunder
      600: '#4a5568', // Garis
    },
    
    // Skema Warna Semantik Standar & Profesional
    success: semanticGreen, 
    warning: semanticOrange, 
    danger: brandRed, 
    info: semanticBlue, 
    
    // Hapus definisi 'yellow' dan 'accentYellow'
  },

  styles: {
    global: (props: any) => ({
      body: {
        // Teks diubah dari kuning menjadi abu-abu terang/putih
        bg: darkSurface[900], 
        color: 'gray.200', // Warna teks yang nyaman di Dark Mode
        transition: 'background-color 0.2s ease, color 0.2s ease',
      },
    }),
  },

  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      baseStyle: {
        fontWeight: 'bold',
        borderRadius: 'md', 
        transition: 'all 0.2s ease',
      },
      variants: {
        // Tombol solid tetap Merah dengan Teks Putih
        solid: (props: any) => ({
          bg: 'brand.500',
          color: 'white',
          _hover: { bg: 'brand.600' },
          _active: { bg: 'brand.700' },
        }),
        // Outline Button: Border Merah Gelap, Teks Merah Gelap
        outline: (props: any) => ({
          color: 'brand.400',
          borderColor: 'brand.400',
          _hover: {
            bg: 'brand.900', // Hover yang sangat gelap
            color: 'brand.300',
          }
        }),
        // Ghost Button: Teks Merah Gelap
        ghost: (props: any) => ({
            color: 'brand.400',
            _hover: {
                bg: 'gray.800',
            }
        })
      }
    },
    Card: {
      baseStyle: {
        bg: darkSurface[800], 
        // Border diubah dari kuning menjadi merah gelap/abu-abu
        borderColor: 'gray.700', // Border netral
        borderWidth: '1px',
        borderRadius: 'lg',
        boxShadow: 'dark-lg', 
        _hover: {
          transform: 'scale(1.01)', 
          boxShadow: 'xl', 
          borderColor: 'brand.500', // Highlight merah saat hover
        }
      },
    },
  },
});

export function ChakraProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorModeScript
        initialColorMode={theme.config.initialColorMode}
        type="localStorage"
      />
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
    </>
  );
}