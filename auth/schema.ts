import { z } from 'zod'

export const schemaLogin = z.object({
  email: z.email(),
  password: z.string(),
})
