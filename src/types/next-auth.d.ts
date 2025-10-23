import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      nim: string;
      organizationLvl: string;
      instruments: string[];
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    nim: string;
    organizationLvl: string;
    instruments: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    organizationLvl: string;
    instruments: string[];
    nim: string;
  }
}