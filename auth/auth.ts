import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { schemaLogin } from './schema'
import { getUserFromDb } from './utils/getUserFromDb'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '~/db/db'

console.log(
  '🚀 ~ file: auth.ts:10 ~ process.env.AUTH_TRUST_HOST:',
  process.env.AUTH_TRUST_HOST
)
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

        console.log(
          '🚀 ~ file: auth.ts:37 ~ process.env.AUTH_TRUST_HOST:',
          process.env.AUTH_TRUST_HOST
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
