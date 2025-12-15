-- Migração para corrigir a patente dos personagens existentes baseado no NEX
-- Recalcula a patente usando a mesma lógica de getPatentByNex

UPDATE public.characters
SET patent = CASE
  WHEN nex >= 90 THEN 'Veterano'
  WHEN nex >= 75 THEN 'Oficial de Elite'
  WHEN nex >= 60 THEN 'Agente de Elite'
  WHEN nex >= 45 THEN 'Oficial de Operações'
  WHEN nex >= 30 THEN 'Agente Especial'
  WHEN nex >= 15 THEN 'Operador'
  ELSE 'Recruta'
END
WHERE patent != CASE
  WHEN nex >= 90 THEN 'Veterano'
  WHEN nex >= 75 THEN 'Oficial de Elite'
  WHEN nex >= 60 THEN 'Agente de Elite'
  WHEN nex >= 45 THEN 'Oficial de Operações'
  WHEN nex >= 30 THEN 'Agente Especial'
  WHEN nex >= 15 THEN 'Operador'
  ELSE 'Recruta'
END;