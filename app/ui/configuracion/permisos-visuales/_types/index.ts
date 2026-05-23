export interface NavItem {
  id?: string;
  key?: string;
  label?: string;
  permission?: string | null;
  route?: string | null;
  items?: NavItem[];
  type?: string;
  icon?: string;
  action?: string;
}

export interface Role {
  id: number;
  descripcion: string;
  restrictions: { name: string }[];
}

export interface ModuloCardData {
  label: string;
  permission: string;
  visible: boolean;
  icon: string;
  hasComponent: boolean;
  authModulo: string | null;
  isExpanded: boolean;
  authCount: number;
}

export interface VistaActiva {
  label: string;
  permission: string;
  component: React.LazyExoticComponent<any>;
}

export interface ItemSeleccionado {
  label: string;
  permission: string;
}

export type Accion = 'crear' | 'editar' | 'eliminar';

export interface AuthConfigHelper {
  modulo: string;
  accion: Accion;
  requiere_autorizacion: boolean;
  autorizador_id: string | null;
}