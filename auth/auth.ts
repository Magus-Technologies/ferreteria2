import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import argon2 from 'argon2'
import { schemaLogin } from './schema'
import { getUserFromDb } from './utils/getUserFromDb'

export const { handlers, signIn, signOut, auth } = NextAuth({
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
        if (!result.success) throw new Error('Invalid credentials.')
        const { email, password } = result.data
        const pwHash = await argon2.hash(password)

        const user = await getUserFromDb(email, pwHash)

        if (!user) throw new Error('Invalid credentials.')

        return user
      },
    }),
  ],
})
