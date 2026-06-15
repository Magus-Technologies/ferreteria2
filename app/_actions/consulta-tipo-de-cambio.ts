"use server";

async function consultaTipoDeCambio(fecha?: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const url = fecha
      ? `${baseUrl}/tipo-cambio?fecha=${encodeURIComponent(fecha)}`
      : `${baseUrl}/tipo-cambio`;
    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = await response.json();
      return { data: data.venta ?? data.compra ?? 1 };
    }
  } catch {
    // Si falla la consulta, retornar valor por defecto
  }

  return { data: 1 };
}

export { consultaTipoDeCambio };
