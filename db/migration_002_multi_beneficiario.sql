-- Beneficiarios por solicitud (multi-proveedor)
CREATE TABLE public.solicitud_beneficiarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  proveedor_id UUID NOT NULL REFERENCES public.proveedores(id),
  concepto TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  referencia_interna TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sol_beneficiarios ON public.solicitud_beneficiarios(solicitud_id);

ALTER TABLE public.solicitud_beneficiarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sol_benef_select" ON public.solicitud_beneficiarios FOR SELECT USING (true);
CREATE POLICY "sol_benef_insert" ON public.solicitud_beneficiarios FOR INSERT WITH CHECK (true);
CREATE POLICY "sol_benef_delete" ON public.solicitud_beneficiarios FOR DELETE USING (true);
