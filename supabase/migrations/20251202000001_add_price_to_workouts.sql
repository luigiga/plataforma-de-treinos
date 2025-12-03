-- ============================================
-- ADICIONAR CAMPOS DE PREÇO AOS WORKOUTS
-- ============================================

-- Adicionar campos de preço e controle de acesso
ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS purchase_type TEXT CHECK (purchase_type IN ('subscription', 'one_time', 'free')) DEFAULT 'free';

-- Índice para busca de workouts pagos
CREATE INDEX IF NOT EXISTS idx_workouts_is_paid ON public.workouts(is_paid);
CREATE INDEX IF NOT EXISTS idx_workouts_purchase_type ON public.workouts(purchase_type);

-- Comentários
COMMENT ON COLUMN public.workouts.price IS 'Preço do treino em BRL (para treinos avulsos)';
COMMENT ON COLUMN public.workouts.is_paid IS 'Se o treino requer pagamento';
COMMENT ON COLUMN public.workouts.purchase_type IS 'Tipo de compra: subscription (requer assinatura), one_time (compra avulsa), free (gratuito)';

