import NextAuth, { DefaultSession } from 'next-auth'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JWT } from 'next-auth/jwt'
import Credentials from 'next-auth/providers/credentials'
import { schemaLogin } from './schema'
import { getUserFromDb } from './utils/getUserFromDb'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '~/db/db'

declare module 'next-auth' {
  interface Session {
    user: {
      all_permissions: string[]
    } & DefaultSession['user']
  }
  interface User {
    all_permissions: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    all_permissions: string[]
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: {
          type: 'email',
          label: 'Email',
          placeholder: 'johndoe@gmail.com',
        },
        password: {
          type: 'password',
          label: 'Password',
          placeholder: '*****',
        },
      },
      authorize: async credentials => {
        const result = schemaLogin.safeParse(credentials)
        if (!result.success) return null
        const { email, password } = result.data

        const user = await getUserFromDb(email, password)

        if (!user) return null

        return user
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.all_permissions = user.all_permissions
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.all_permissions = token.all_permissions
      return session
    },
  },
})
