-- Agregar campo referencia interna a solicitudes
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS referencia_interna TEXT;
