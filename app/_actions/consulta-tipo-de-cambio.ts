"use server";

async function consultaTipoDeCambio() {
  // TODO: Implementar consulta real a API externa de tipo de cambio
  // const url = `https://dniruc.apisperu.com/api/v1/exchange-rate`
  // const response = await fetch(url)
  // const data = await response.json()
  // return { data: data.rate }

  // Por ahora devolvemos 1 (equivale a transacciones en soles)
  return { data: 1 };
}

export { consultaTipoDeCambio };
