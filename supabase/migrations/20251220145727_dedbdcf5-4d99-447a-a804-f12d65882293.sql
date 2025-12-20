-- Adiciona coluna dedicada para bônus condicionais ativos
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS active_conditional_bonuses text[] DEFAULT '{}'::text[];

-- Migra dados existentes do active_buffs para a nova coluna
UPDATE public.characters 
SET active_conditional_bonuses = COALESCE(
  (active_buffs::jsonb->>'conditionalBonuses')::text[],
  '{}'::text[]
)
WHERE active_buffs IS NOT NULL 
  AND active_buffs::jsonb ? 'conditionalBonuses';

-- Comentário explicativo
COMMENT ON COLUMN public.characters.active_conditional_bonuses IS 'Array de IDs dos bônus condicionais ativos do personagem';