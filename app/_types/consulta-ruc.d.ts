export interface ConsultaDni {
  success: boolean
  dni: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  codVerifica: number
  codVerificaLetra: string
}

export interface ConsultaRuc {
  ruc: string
  razonSocial: string
  nombreComercial: string | null
  telefonos: string[]
  tipo: null
  estado: 'ACTIVO'
  condicion: 'HABIDO'
  direccion: string | null
  departamento: string | null
  provincia: string | null
  distrito: string | null
  fechaInscripcion: null
  sistEmsion: null
  sistContabilidad: null
  actExterior: null
  actEconomicas: string[]
  cpPago: string[]
  sistElectronica: string[]
  fechaEmisorFe: null
  cpeElectronico: string[]
  fechaPle: null
  padrones: string[]
  fechaBaja: null
  profesion: null
  ubigeo: string | null
  capital: string | null
}
