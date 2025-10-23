import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        nim: { label: 'NIM (ID Database)', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.nim) {
          return null;
        }

        // Authenticate using email and database ID (NIM)
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email,
            id: credentials.nim
          }
        });

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          nim: user.id, // Use database ID as NIM
          organizationLvl: user.organizationLvl,
          instruments: user.instruments,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.organizationLvl = user.organizationLvl;
        token.instruments = user.instruments;
        token.nim = user.nim;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.organizationLvl = token.organizationLvl as string;
        (session.user as any).instruments = token.instruments;
        (session.user as any).nim = token.nim;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
  }
};