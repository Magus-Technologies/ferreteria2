"use server";

import { ConsultaDni, ConsultaRuc } from "../_types/consulta-ruc";

async function consultaReniec({ search }: { search: string }) {
  if (search.length !== 8 && search.length !== 11)
    throw new Error("El número del documento debe tener 8 u 11 caracteres");
  const tipo = search.length === 8 ? "dni" : "ruc";
  const url = `https://dniruc.apisperu.com/api/v1/${tipo}/${search}?token=${process.env.RENIEC_TOKEN}`;
  const response = await fetch(url);
  const raw = await response.json() as Record<string, unknown>;
  console.log(`[consultaReniec] tipo=${tipo} search=${search} raw=`, raw);
  return { data: raw as unknown as ConsultaDni | ConsultaRuc };
}

export { consultaReniec, consultaReniec as consultaDni };
