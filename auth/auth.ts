import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { schemaLogin } from './schema'
import { getUserFromDb } from './utils/getUserFromDb'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '~/db/db'

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

        const { AUTH_TRUST_HOST, NODE_ENV, AUTH_URL } = process.env
        console.log(
          '🚀 ~ file: auth.ts:32 ~ {AUTH_TRUST_HOST, NODE_ENV, AUTH_URL}:',
          { AUTH_TRUST_HOST, NODE_ENV, AUTH_URL }
        )

        if (!user) return null

        return user
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
})
