'use server'

import { withAuth } from '~/auth/middleware-server-actions'

async function consultaTipoDeCambioWA() {
  // const url = `https://dniruc.apisperu.com/api/v1/`
  // const response = await fetch(url)
  // const data = (await response.json()) as ConsultaDni | ConsultaRuc
  return { data: 1 }
}
export const consultaTipoDeCambio = withAuth(consultaTipoDeCambioWA)
