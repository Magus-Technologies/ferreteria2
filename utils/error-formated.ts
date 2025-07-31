export function errorFormated(error: unknown) {
  return {
    error: {
      message: error instanceof Error ? error.message : 'Error desconocido',
      data: error,
    },
  }
}
