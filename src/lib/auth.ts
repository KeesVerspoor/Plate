import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[DEBUG-AUTH] authorize called with:', { email: credentials?.email, hasPassword: !!credentials?.password });
        if (!credentials?.email || !credentials?.password) {
          console.warn('[DEBUG-AUTH] missing email or password');
          return null;
        }

        try {
          console.log('[DEBUG-AUTH] attempting prisma query for email:', credentials.email);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            console.warn('[DEBUG-AUTH] user not found in database for email:', credentials.email);
            return null;
          }
          console.log('[DEBUG-AUTH] user found in database, id:', user.id);

          console.log('[DEBUG-AUTH] comparing password hash...');
          const isValid = await bcrypt.compare(credentials.password, user.password);
          console.log('[DEBUG-AUTH] password match result:', isValid);
          
          if (!isValid) {
            console.warn('[DEBUG-AUTH] password comparison failed for user:', user.email);
            return null;
          }

          console.log('[DEBUG-AUTH] login success for:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('[DEBUG-AUTH] error during authorize process:', error);
          if (error instanceof Error) {
            console.error('[DEBUG-AUTH] error message:', error.message);
            console.error('[DEBUG-AUTH] error stack:', error.stack);
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
