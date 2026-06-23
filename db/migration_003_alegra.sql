-- Campos para integración con Alegra
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS alegra_id TEXT;
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS alegra_number TEXT;

-- Permitir estado 'borrador' para solicitudes importadas de Alegra
ALTER TABLE public.solicitudes DROP CONSTRAINT IF EXISTS solicitudes_estado_check;
ALTER TABLE public.solicitudes ADD CONSTRAINT solicitudes_estado_check
  CHECK (estado IN ('borrador', 'pendiente', 'aprobada', 'rechazada', 'aclaracion', 'pagada', 'pagada_parcial'));

-- Índice para evitar duplicados de Alegra
CREATE UNIQUE INDEX IF NOT EXISTS idx_solicitudes_alegra_id ON public.solicitudes(alegra_id) WHERE alegra_id IS NOT NULL;

-- Permitir creado_por con UUID cero (sistema)
-- Ya está manejado con COALESCE en el trigger
