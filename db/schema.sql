-- ============================================
-- SIGACP - Schema para Supabase
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Tabla de perfiles de usuario (extiende auth.users)
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('sostenibilidad', 'gerencia', 'admin')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Proveedores (se autocompleta con uso)
CREATE TABLE public.proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nit TEXT UNIQUE NOT NULL,
  razon_social TEXT NOT NULL,
  banco TEXT,
  tipo_cuenta TEXT,
  numero_cuenta TEXT,
  contacto TEXT,
  email TEXT,
  telefono TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Solicitudes de pago
CREATE TABLE public.solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero SERIAL,
  fecha_solicitud DATE DEFAULT CURRENT_DATE,
  proveedor_id UUID REFERENCES public.proveedores(id),
  tipo_pago TEXT NOT NULL CHECK (tipo_pago IN (
    'proveedor', 'hotel', 'transporte', 'honorarios',
    'tecnologia', 'eventos', 'seguridad_social', 'nomina', 'otro'
  )),
  concepto TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  fecha_limite DATE NOT NULL,
  centro_costo TEXT,
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente', 'aprobada', 'rechazada', 'aclaracion', 'pagada', 'pagada_parcial'
  )),
  valor_pagado NUMERIC(15,2) DEFAULT 0,
  nota_pago_parcial TEXT,
  -- Campos de aprobación
  aprobado_por UUID REFERENCES public.perfiles(id),
  fecha_aprobacion TIMESTAMPTZ,
  observacion_aprobacion TEXT,
  -- Campos de pago
  fecha_pago DATE,
  numero_comprobante TEXT,
  -- Campos de aclaración
  observacion_aclaracion TEXT,
  -- Meta
  creado_por UUID NOT NULL REFERENCES public.perfiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adjuntos de solicitudes (PDF/JPG, max 2MB)
CREATE TABLE public.adjuntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('factura', 'certificacion_bancaria', 'soporte_pago', 'otro')),
  url TEXT NOT NULL,
  tamano_bytes INTEGER CHECK (tamano_bytes <= 2097152),
  mime_type TEXT CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/jpg')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seguridad Social
CREATE TABLE public.seguridad_social (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_planilla TEXT NOT NULL,
  numero_planilla TEXT,
  periodo_mes INTEGER NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio INTEGER NOT NULL,
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  fecha_limite DATE NOT NULL,
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'pagada')),
  aprobado_por UUID REFERENCES public.perfiles(id),
  fecha_aprobacion TIMESTAMPTZ,
  fecha_pago DATE,
  numero_comprobante TEXT,
  creado_por UUID NOT NULL REFERENCES public.perfiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Nómina
CREATE TABLE public.nomina (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo TEXT NOT NULL,
  tipo_nomina TEXT NOT NULL CHECK (tipo_nomina IN ('quincenal', 'mensual', 'prima', 'cesantias', 'liquidacion', 'otro')),
  valor_total NUMERIC(15,2) NOT NULL CHECK (valor_total > 0),
  cantidad_colaboradores INTEGER,
  fecha_limite DATE NOT NULL,
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'pagada')),
  aprobado_por UUID REFERENCES public.perfiles(id),
  fecha_aprobacion TIMESTAMPTZ,
  fecha_pago DATE,
  numero_comprobante TEXT,
  creado_por UUID NOT NULL REFERENCES public.perfiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auditoría (solo inserción, nunca se borra)
CREATE TABLE public.auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla TEXT NOT NULL,
  registro_id UUID NOT NULL,
  usuario_id UUID NOT NULL REFERENCES public.perfiles(id),
  usuario_nombre TEXT NOT NULL,
  accion TEXT NOT NULL,
  estado_anterior TEXT,
  estado_nuevo TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notificaciones en app
CREATE TABLE public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.perfiles(id),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_solicitudes_estado ON public.solicitudes(estado);
CREATE INDEX idx_solicitudes_creado_por ON public.solicitudes(creado_por);
CREATE INDEX idx_solicitudes_fecha_limite ON public.solicitudes(fecha_limite);
CREATE INDEX idx_proveedores_nit ON public.proveedores(nit);
CREATE INDEX idx_auditoria_registro ON public.auditoria(registro_id);
CREATE INDEX idx_notificaciones_usuario ON public.notificaciones(usuario_id, leida);
CREATE INDEX idx_seguridad_social_estado ON public.seguridad_social(estado);
CREATE INDEX idx_nomina_estado ON public.nomina(estado);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjuntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguridad_social ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nomina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Perfiles: cada quien ve el suyo, admin ve todos
CREATE POLICY "perfiles_select" ON public.perfiles FOR SELECT USING (true);
CREATE POLICY "perfiles_update" ON public.perfiles FOR UPDATE USING (
  id = auth.uid() OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
);

-- Proveedores: todos leen, sostenibilidad y gerencia insertan/editan
CREATE POLICY "proveedores_select" ON public.proveedores FOR SELECT USING (true);
CREATE POLICY "proveedores_insert" ON public.proveedores FOR INSERT WITH CHECK (true);
CREATE POLICY "proveedores_update" ON public.proveedores FOR UPDATE USING (true);

-- Solicitudes: sostenibilidad ve las suyas, gerencia y admin ven todas
CREATE POLICY "solicitudes_select" ON public.solicitudes FOR SELECT USING (
  creado_por = auth.uid()
  OR EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('gerencia', 'admin'))
);
CREATE POLICY "solicitudes_insert" ON public.solicitudes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('sostenibilidad', 'admin'))
);
CREATE POLICY "solicitudes_update" ON public.solicitudes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('gerencia', 'admin'))
  OR (creado_por = auth.uid() AND estado = 'aclaracion')
);

-- Adjuntos: mismas reglas que solicitudes
CREATE POLICY "adjuntos_select" ON public.adjuntos FOR SELECT USING (true);
CREATE POLICY "adjuntos_insert" ON public.adjuntos FOR INSERT WITH CHECK (true);

-- Seguridad social y nómina: todos leen, sostenibilidad crea, gerencia aprueba
CREATE POLICY "ss_select" ON public.seguridad_social FOR SELECT USING (true);
CREATE POLICY "ss_insert" ON public.seguridad_social FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('sostenibilidad', 'admin'))
);
CREATE POLICY "ss_update" ON public.seguridad_social FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('gerencia', 'admin'))
);

CREATE POLICY "nomina_select" ON public.nomina FOR SELECT USING (true);
CREATE POLICY "nomina_insert" ON public.nomina FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('sostenibilidad', 'admin'))
);
CREATE POLICY "nomina_update" ON public.nomina FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('gerencia', 'admin'))
);

-- Auditoría: todos leen, nadie borra, solo service_role inserta
CREATE POLICY "auditoria_select" ON public.auditoria FOR SELECT USING (true);
CREATE POLICY "auditoria_insert" ON public.auditoria FOR INSERT WITH CHECK (true);

-- Notificaciones: cada quien ve las suyas
CREATE POLICY "notif_select" ON public.notificaciones FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "notif_update" ON public.notificaciones FOR UPDATE USING (usuario_id = auth.uid());
CREATE POLICY "notif_insert" ON public.notificaciones FOR INSERT WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET para adjuntos
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('adjuntos', 'adjuntos', false);

CREATE POLICY "adjuntos_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'adjuntos');
CREATE POLICY "adjuntos_storage_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'adjuntos');

-- ============================================
-- FUNCIÓN para registrar auditoría automática
-- ============================================
CREATE OR REPLACE FUNCTION public.registrar_auditoria()
RETURNS TRIGGER AS $$
DECLARE
  _nombre TEXT;
  _accion TEXT;
  _estado_ant TEXT;
  _estado_new TEXT;
BEGIN
  SELECT nombre INTO _nombre FROM public.perfiles WHERE id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    _accion := 'crear';
    _estado_ant := NULL;
    _estado_new := NEW.estado;
  ELSIF TG_OP = 'UPDATE' THEN
    _accion := 'actualizar';
    _estado_ant := OLD.estado;
    _estado_new := NEW.estado;
  END IF;

  INSERT INTO public.auditoria (tabla, registro_id, usuario_id, usuario_nombre, accion, estado_anterior, estado_nuevo)
  VALUES (TG_TABLE_NAME, NEW.id, COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'), COALESCE(_nombre, 'sistema'), _accion, _estado_ant, _estado_new);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers de auditoría
CREATE TRIGGER audit_solicitudes AFTER INSERT OR UPDATE ON public.solicitudes
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

CREATE TRIGGER audit_seguridad_social AFTER INSERT OR UPDATE ON public.seguridad_social
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

CREATE TRIGGER audit_nomina AFTER INSERT OR UPDATE ON public.nomina
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
