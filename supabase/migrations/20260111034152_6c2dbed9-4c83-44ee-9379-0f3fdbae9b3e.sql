-- Constraint única parcial: character_id só pode aparecer uma vez em campaign_members
-- (ignora NULLs, permitindo múltiplos membros sem personagem vinculado)
CREATE UNIQUE INDEX unique_character_per_campaign 
ON public.campaign_members (character_id) 
WHERE character_id IS NOT NULL;