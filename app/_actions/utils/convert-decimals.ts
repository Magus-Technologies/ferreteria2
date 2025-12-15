import { Prisma } from '@prisma/client'

/**
 * Convierte recursivamente todos los objetos Decimal de Prisma a números
 * para que puedan ser serializados y enviados a Client Components
 */
export function convertDecimalsToNumbers<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  
  if (obj instanceof Prisma.Decimal) {
    return Number(obj) as T
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertDecimalsToNumbers(item)) as T
  }
  
  if (typeof obj === 'object') {
    const converted: any = {}
    for (const key in obj) {
      converted[key] = convertDecimalsToNumbers(obj[key])
    }
    return converted
  }
  
  return obj
}
