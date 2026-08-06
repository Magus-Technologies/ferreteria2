"use server";

import { ConsultaDni, ConsultaRuc } from "../_types/consulta-ruc";

interface ApiPeruResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface ApiPeruDni {
  numero: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  codigo_verificacion: string;
}

interface ApiPeruRuc {
  ruc: string;
  nombre_o_razon_social: string;
  direccion: string | null;
  direccion_completa: string | null;
  estado: string;
  condicion: string;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  ubigeo_sunat: string | null;
}

async function fetchApiPeru<T>(tipo: "dni" | "ruc", search: string): Promise<T> {
  const token = process.env.APIPERU_TOKEN;
  if (!token) throw new Error("Falta APIPERU_TOKEN en .env");

  const response = await fetch(`https://apiperu.dev/api/${tipo}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ [tipo]: search }),
    cache: "no-store",
  });

  const raw = await response.json() as ApiPeruResponse<T>;
  if (!response.ok || !raw.success || !raw.data) {
    throw new Error(raw.message || `No se pudo consultar el ${tipo.toUpperCase()}`);
  }

  return raw.data;
}
//DSAWD
async function consultaDni({ search }: { search: string }): Promise<{ data: ConsultaDni }> {
  if (!/^\d{8}$/.test(search)) throw new Error("El DNI debe tener 8 dígitos");

  const raw = await fetchApiPeru<ApiPeruDni>("dni", search);
  const data: ConsultaDni = {
    success: true,
    dni: raw.numero || search,
    nombres: raw.nombres || "",
    apellidoPaterno: raw.apellido_paterno || "",
    apellidoMaterno: raw.apellido_materno || "",
    codVerifica: Number(raw.codigo_verificacion) || 0,
    codVerificaLetra: "",
  };

  return { data };
}

async function consultaRuc({ search }: { search: string }): Promise<{ data: ConsultaRuc }> {
  if (!/^\d{11}$/.test(search)) throw new Error("El RUC debe tener 11 dígitos");

  const raw = await fetchApiPeru<ApiPeruRuc>("ruc", search);
  const data: ConsultaRuc = {
    ruc: raw.ruc || search,
    razonSocial: raw.nombre_o_razon_social || "",
    nombreComercial: null,
    telefonos: [],
    tipo: null,
    estado: raw.estado || "",
    condicion: raw.condicion || "",
    direccion: raw.direccion_completa || raw.direccion,
    departamento: raw.departamento,
    provincia: raw.provincia,
    distrito: raw.distrito,
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
    ubigeo: raw.ubigeo_sunat,
    capital: null,
  };

  return { data };
}

async function consultaReniec(
  { search }: { search: string },
): Promise<{ data: ConsultaDni | ConsultaRuc }> {
  if (search.length === 8) return consultaDni({ search });
  if (search.length === 11) return consultaRuc({ search });
  throw new Error("El número del documento debe tener 8 u 11 dígitos");
}

export { consultaDni, consultaRuc, consultaReniec };
