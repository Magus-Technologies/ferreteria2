"use server";

import { ConsultaDni, ConsultaRuc } from "../_types/consulta-ruc";

async function consultaReniec({ search }: { search: string }) {
  if (search.length !== 8 && search.length !== 11)
    throw new Error("El número del documento debe tener 8 u 11 caracteres");

  const token = process.env.DECOLECTA_TOKEN;
  if (!token) throw new Error("Falta DECOLECTA_TOKEN en .env");

  const isDni = search.length === 8;
  const url = isDni
    ? `https://api.decolecta.com/v1/reniec/dni?numero=${search}`
    : `https://api.decolecta.com/v1/sunat/ruc?numero=${search}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error consultando ${isDni ? "DNI" : "RUC"}: ${response.status}`);
  }

  const raw = await response.json();

  if (isDni) {
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

export { consultaReniec };
