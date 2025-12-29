import NextAuth, { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import Credentials from 'next-auth/providers/credentials'
import { cache } from 'react'
import { schemaLogin } from './schema'
import { getUserFromDb } from './utils/getUserFromDb'
import { prisma } from '~/db/db'

export type EmpresaSession = {
  id: number
  ruc: string
  razon_social: string
  direccion: string
  telefono: string
  email: string
  serie_ingreso: number
  serie_salida: number
  serie_recepcion_almacen: number
  almacen_id: number
  marca_id: number
  logo: string | null
}

declare module 'next-auth' {
  interface Session {
    user: {
      all_permissions: string[]
      empresa: EmpresaSession | null
      efectivo: number
      id: string
    } & DefaultSession['user']
  }
  interface User {
    all_permissions: string[]
    empresa: EmpresaSession | null
    efectivo: number
    id: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}

// Función cacheada para obtener datos del usuario
const getUserData = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      efectivo: true,
      empresa: {
        select: {
          id: true,
          ruc: true,
          razon_social: true,
          direccion: true,
          telefono: true,
          email: true,
          serie_ingreso: true,
          serie_salida: true,
          serie_recepcion_almacen: true,
          almacen_id: true,
          marca_id: true,
          logo: true,
        },
      },
      permissions: {
        select: {
          name: true,
        },
      },
      roles: {
        select: {
          permissions: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  }) as {
    efectivo: any
    empresa: EmpresaSession | null
    permissions: { name: string }[]
    roles: { permissions: { name: string }[] }[]
  } | null

  if (!user) return null

  const all_permissions = Array.from(
    new Set([
      ...user.permissions.map((p) => p.name),
      ...user.roles.flatMap((role) => role.permissions.map((p) => p.name)),
    ])
  )

  return {
    efectivo: user.efectivo.toNumber(),
    empresa: user.empresa || null,
    all_permissions,
  }
})

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
      authorize: async (credentials) => {
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
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Solo guardar el ID del usuario en el JWT (reduce cookie de ~8KB a ~500 bytes)
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string

        // Obtener datos frescos del usuario desde la BD
        // Esta función está cacheada, por lo que solo se ejecuta una vez por request
        const userData = await getUserData(token.id as string)

        if (userData) {
          session.user.efectivo = userData.efectivo
          session.user.empresa = userData.empresa
          session.user.all_permissions = userData.all_permissions
        }
      }
      return session
    },
  },
})
