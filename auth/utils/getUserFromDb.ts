// import argon2 from 'argon2'

export const getUserFromDb = async (email: string, pwHash: string) => {
  console.log('🚀 ~ file: getUserFromDb.ts:4 ~ pwHash:', pwHash)
  console.log('🚀 ~ file: getUserFromDb.ts:4 ~ email:', email)
  //   const user = await db.user.findUnique({
  //     where: { email },
  //   })
  const user = null

  if (!user) return null

  //   const isPasswordValid = await argon2.verify(user.password, pwHash)

  //   if (!isPasswordValid) return null

  return user
}
