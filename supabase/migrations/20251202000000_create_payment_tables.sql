-- ============================================
-- TABELAS DE PAGAMENTOS - FitPlatform
-- ============================================
-- Sistema completo de pagamentos com Stripe
-- Suporta: Assinaturas mensais/anuais e treinos avulsos
-- Divisão de receita: 80/20 padrão, 90/10 com referência
-- ============================================

-- 1. PRODUTOS/PLANOS (Assinaturas e Treinos)
CREATE TABLE IF NOT EXISTS public.payment_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('subscription', 'one_time')),
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  billing_period TEXT CHECK (billing_period IN ('month', 'year')), -- Para assinaturas
  trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL = plano da plataforma
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL, -- Para treinos avulsos
  stripe_product_id TEXT UNIQUE,
  stripe_price_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. ASSINATURAS
CREATE TABLE IF NOT EXISTS public.payment_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.payment_products(id),
  trainer_id UUID REFERENCES auth.users(id), -- Trainer associado (se houver)
  referral_trainer_id UUID REFERENCES auth.users(id), -- Trainer que trouxe o aluno (link de referência)
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. TRANSAÇÕES/PAGAMENTOS
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES auth.users(id), -- Trainer que recebe
  referral_trainer_id UUID REFERENCES auth.users(id), -- Trainer de referência (se houver)
  product_id UUID REFERENCES public.payment_products(id),
  subscription_id UUID REFERENCES public.payment_subscriptions(id),
  type TEXT NOT NULL CHECK (type IN ('subscription', 'one_time')),
  amount DECIMAL(10, 2) NOT NULL, -- Valor total pago
  currency TEXT DEFAULT 'BRL',
  stripe_fee DECIMAL(10, 2) NOT NULL, -- Taxa do Stripe
  net_amount DECIMAL(10, 2) NOT NULL, -- Valor líquido (amount - stripe_fee)
  platform_percentage DECIMAL(5, 2) NOT NULL, -- % da plataforma (20% ou 10%)
  trainer_percentage DECIMAL(5, 2) NOT NULL, -- % do trainer (80% ou 90%)
  platform_fee DECIMAL(10, 2) NOT NULL, -- Valor da plataforma
  trainer_fee DECIMAL(10, 2) NOT NULL, -- Valor do trainer
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_invoice_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- Dados extras
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. SPLITS (Divisões de pagamento)
CREATE TABLE IF NOT EXISTS public.payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('platform', 'trainer')),
  recipient_id UUID REFERENCES auth.users(id), -- NULL se for plataforma
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'transferred', 'failed')),
  stripe_transfer_id TEXT, -- ID da transferência no Stripe
  stripe_payout_id TEXT, -- ID do payout no Stripe
  transferred_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. HISTÓRICO DE PAYOUTS (para trainers)
CREATE TABLE IF NOT EXISTS public.payment_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  stripe_payout_id TEXT UNIQUE,
  stripe_account_id TEXT, -- Stripe Connect account ID
  description TEXT,
  splits_count INTEGER DEFAULT 0, -- Quantos splits foram incluídos neste payout
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_user_id ON public.payment_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_trainer_id ON public.payment_subscriptions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_referral_trainer_id ON public.payment_subscriptions(referral_trainer_id);
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_status ON public.payment_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_subscriptions_stripe_subscription_id ON public.payment_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_trainer_id ON public.payment_transactions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_referral_trainer_id ON public.payment_transactions(referral_trainer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_payment_intent_id ON public.payment_transactions(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_payment_splits_transaction_id ON public.payment_splits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_recipient_id ON public.payment_splits(recipient_id);
CREATE INDEX IF NOT EXISTS idx_payment_splits_status ON public.payment_splits(status);

CREATE INDEX IF NOT EXISTS idx_payment_payouts_trainer_id ON public.payment_payouts(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payment_payouts_status ON public.payment_payouts(status);

CREATE INDEX IF NOT EXISTS idx_payment_products_trainer_id ON public.payment_products(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payment_products_workout_id ON public.payment_products(workout_id);
CREATE INDEX IF NOT EXISTS idx_payment_products_type ON public.payment_products(type);
CREATE INDEX IF NOT EXISTS idx_payment_products_is_active ON public.payment_products(is_active);

-- RLS Policies
ALTER TABLE public.payment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_payouts ENABLE ROW LEVEL SECURITY;

-- Products: todos podem ver produtos ativos
DROP POLICY IF EXISTS "Anyone can view active products" ON public.payment_products;
CREATE POLICY "Anyone can view active products" ON public.payment_products
  FOR SELECT USING (is_active = true);

-- Products: admins podem gerenciar produtos
DROP POLICY IF EXISTS "Admins can manage products" ON public.payment_products;
CREATE POLICY "Admins can manage products" ON public.payment_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Subscriptions: usuários veem suas próprias assinaturas
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.payment_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.payment_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = trainer_id OR auth.uid() = referral_trainer_id);

-- Subscriptions: usuários podem criar suas próprias assinaturas
DROP POLICY IF EXISTS "Users can create own subscriptions" ON public.payment_subscriptions;
CREATE POLICY "Users can create own subscriptions" ON public.payment_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions: usuários podem atualizar suas próprias assinaturas
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.payment_subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.payment_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Transactions: usuários veem suas próprias transações
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = trainer_id OR auth.uid() = referral_trainer_id);

-- Transactions: sistema pode criar transações (via service role)
DROP POLICY IF EXISTS "Service can create transactions" ON public.payment_transactions;
CREATE POLICY "Service can create transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (true); -- Será restringido por service role key

-- Splits: trainers veem seus splits
DROP POLICY IF EXISTS "Trainers can view own splits" ON public.payment_splits;
CREATE POLICY "Trainers can view own splits" ON public.payment_splits
  FOR SELECT USING (auth.uid() = recipient_id OR recipient_type = 'platform');

-- Splits: sistema pode criar splits (via service role)
DROP POLICY IF EXISTS "Service can create splits" ON public.payment_splits;
CREATE POLICY "Service can create splits" ON public.payment_splits
  FOR INSERT WITH CHECK (true); -- Será restringido por service role key

-- Payouts: trainers veem seus payouts
DROP POLICY IF EXISTS "Trainers can view own payouts" ON public.payment_payouts;
CREATE POLICY "Trainers can view own payouts" ON public.payment_payouts
  FOR SELECT USING (auth.uid() = trainer_id);

-- Payouts: admins podem ver todos os payouts
DROP POLICY IF EXISTS "Admins can view all payouts" ON public.payment_payouts;
CREATE POLICY "Admins can view all payouts" ON public.payment_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_products_updated_at
  BEFORE UPDATE ON public.payment_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_subscriptions_updated_at
  BEFORE UPDATE ON public.payment_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_splits_updated_at
  BEFORE UPDATE ON public.payment_splits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

