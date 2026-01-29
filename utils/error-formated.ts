import { ZodError } from 'zod'

export function errorFormated(error: unknown) {
  return {
    error: {
      message:
        error instanceof ZodError
          ? 'Los tipos de datos no son correctos'
          : error instanceof Error
          ? error.message
          : 'Error desconocido',
      data: error instanceof ZodError ? error.errors : error,
    },
  }
}
