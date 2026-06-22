export type Rol = 'sostenibilidad' | 'gerencia' | 'admin'

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'aclaracion' | 'pagada' | 'pagada_parcial'

export type TipoPago = 'proveedor' | 'hotel' | 'transporte' | 'honorarios' | 'tecnologia' | 'eventos' | 'seguridad_social' | 'nomina' | 'otro'

export interface Perfil {
  id: string
  email: string
  nombre: string
  rol: Rol
  activo: boolean
}

export interface Proveedor {
  id: string
  nit: string
  razon_social: string
  banco: string | null
  tipo_cuenta: string | null
  numero_cuenta: string | null
  contacto: string | null
  email: string | null
  telefono: string | null
}

export interface Solicitud {
  id: string
  numero: number
  fecha_solicitud: string
  proveedor_id: string
  tipo_pago: TipoPago
  concepto: string
  valor: number
  fecha_limite: string
  centro_costo: string | null
  observaciones: string | null
  estado: EstadoSolicitud
  valor_pagado: number
  nota_pago_parcial: string | null
  aprobado_por: string | null
  fecha_aprobacion: string | null
  observacion_aprobacion: string | null
  fecha_pago: string | null
  numero_comprobante: string | null
  observacion_aclaracion: string | null
  creado_por: string
  created_at: string
  proveedor?: Proveedor
  perfil_creador?: Perfil
}

export interface SeguridadSocial {
  id: string
  tipo_planilla: string
  numero_planilla: string | null
  periodo_mes: number
  periodo_anio: number
  valor: number
  fecha_limite: string
  observaciones: string | null
  estado: 'pendiente' | 'aprobada' | 'pagada'
  fecha_pago: string | null
  numero_comprobante: string | null
  creado_por: string
  created_at: string
}

export interface Nomina {
  id: string
  periodo: string
  tipo_nomina: string
  valor_total: number
  cantidad_colaboradores: number | null
  fecha_limite: string
  observaciones: string | null
  estado: 'pendiente' | 'aprobada' | 'pagada'
  fecha_pago: string | null
  numero_comprobante: string | null
  creado_por: string
  created_at: string
}

export interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  leida: boolean
  url: string | null
  created_at: string
}

export interface Auditoria {
  id: string
  tabla: string
  registro_id: string
  usuario_id: string
  usuario_nombre: string
  accion: string
  estado_anterior: string | null
  estado_nuevo: string | null
  observaciones: string | null
  created_at: string
}
