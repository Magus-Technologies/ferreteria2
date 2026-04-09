"use server";

import { ConsultaDni, ConsultaRuc } from "../_types/consulta-ruc";

async function fetchDecolecta(endpoint: string) {
  const token = process.env.DECOLECTA_TOKEN;
  if (!token) throw new Error("Falta DECOLECTA_TOKEN en .env");

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error en consulta: ${response.status}`);
  }

  return response.json();
}

async function consultaDni({ search }: { search: string }): Promise<{ data: ConsultaDni }> {
  if (search.length !== 8)
    throw new Error("El DNI debe tener 8 caracteres");

  const raw = await fetchDecolecta(`https://api.decolecta.com/v1/reniec/dni?numero=${search}`);

  const data: ConsultaDni = {
    success: true,
    dni: raw.document_number ?? search,
    nombres: raw.first_name ?? "",
    apellidoPaterno: raw.first_last_name ?? "",
    apellidoMaterno: raw.second_last_name ?? "",
    codVerifica: 0,
    codVerificaLetra: "",
  };
  return { data };
}

async function consultaRuc({ search }: { search: string }): Promise<{ data: ConsultaRuc }> {
  if (search.length !== 11)
    throw new Error("El RUC debe tener 11 caracteres");

  const raw = await fetchDecolecta(`https://api.decolecta.com/v1/sunat/ruc?numero=${search}`);

  const data: ConsultaRuc = {
    ruc: raw.ruc ?? search,
    razonSocial: raw.razon_social ?? raw.business_name ?? "",
    nombreComercial: raw.nombre_comercial ?? raw.commercial_name ?? null,
    telefonos: [],
    tipo: null,
    estado: raw.estado ?? "ACTIVO",
    condicion: raw.condicion ?? "HABIDO",
    direccion: raw.direccion ?? raw.address ?? null,
    departamento: raw.departamento ?? null,
    provincia: raw.provincia ?? null,
    distrito: raw.distrito ?? null,
    fechaInscripcion: null,
    sistEmsion: null,
    sistContabilidad: null,
    actExterior: null,
    actEconomicas: [],
    cpPago: [],
    sistElectronica: [],
    fechaEmisorFe: null,
    cpeElectronico: [],
    fechaPle: null,
    padrones: [],
    fechaBaja: null,
    profesion: null,
    ubigeo: raw.ubigeo ?? null,
    capital: null,
  };
  return { data };
}

async function consultaReniec({ search }: { search: string }): Promise<{ data: ConsultaDni | ConsultaRuc }> {
  if (search.length === 8) return consultaDni({ search });
  if (search.length === 11) return consultaRuc({ search });
  throw new Error("El número del documento debe tener 8 u 11 caracteres");
}

export { consultaDni, consultaRuc, consultaReniec };
