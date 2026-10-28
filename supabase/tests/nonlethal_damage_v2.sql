-- Livro Base v1.3 p. 88. Ensaio transacional sem dados permanentes.
BEGIN;
INSERT INTO auth.users(id) VALUES ('a2800000-0000-4000-8000-000000000001');
INSERT INTO public.characters(
 id,user_id,name,origin,class,nex,hp_current,hp_max,pe_current,pe_max,
 san_current,san_max,abilities,powers,class_power_choices,inventory,conditions,nonlethal_damage)
VALUES(
 'a2800000-0000-4000-8000-000000000011','a2800000-0000-4000-8000-000000000001',
 'QA Não Letal','Lutador','Combatente',20,8,20,4,4,12,12,
 '["artista-marcial"]','[]','[]','[{"id":"faca-qa","itemType":"weapon","type":"Corpo a Corpo","name":"Faca"}]',
 '[{"id":"inconsciente","name":"Inconsciente","sourceKind":"nonlethal_damage",
   "sourceOperationId":"a2800000-0000-4000-8000-000000000099"},
  {"id":"condicao-caseira","name":"Condição caseira"}]',8);

-- As validações privadas continuam sendo exercitadas como administrador da
-- migration, mas com a identidade real do proprietário da ficha.
SELECT set_config('request.jwt.claim.sub','a2800000-0000-4000-8000-000000000001',true);

DO $$
DECLARE ficha public.characters; mode_result jsonb; healing jsonb;
BEGIN
 UPDATE public.characters SET conditions=conditions
  WHERE id='a2800000-0000-4000-8000-000000000011';
 SELECT * INTO ficha FROM public.characters
  WHERE id='a2800000-0000-4000-8000-000000000011';
 IF ficha.conditions#>>'{0,sourceOperationId}'<>'a2800000-0000-4000-8000-000000000099' THEN
  RAISE EXCEPTION 'Reconciliação perdeu a origem da condição não letal'; END IF;

 healing:=public.apply_character_healing_priority(ficha.id,4,8,8,
  'a2800000-0000-4000-8000-000000000090');
 SELECT * INTO ficha FROM public.characters
  WHERE id='a2800000-0000-4000-8000-000000000011';
 IF ficha.hp_current<>8 OR ficha.nonlethal_damage<>4
  OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(ficha.conditions) item(value)
   WHERE value->>'id'='condicao-caseira') THEN
  RAISE EXCEPTION 'Cura não priorizou dano não letal ou removeu condição desconhecida'; END IF;

 -- RED: PV cheio não pode esconder a quantidade de cura solicitada do
 -- reservatório não letal.
 PERFORM set_config('ordem_roll.nonlethal_internal','1',true);
 UPDATE public.characters SET hp_current=20,nonlethal_damage=10 WHERE id=ficha.id;
 PERFORM set_config('ordem_roll.nonlethal_internal','0',true);
 healing:=public.apply_character_healing_priority(ficha.id,4,20,NULL,
  'a2800000-0000-4000-8000-000000000091');
 IF healing->>'hpAfter'<>'20' OR healing->>'nonlethalAfter'<>'6'
  OR healing->>'nonlethalHealed'<>'4' OR healing->>'effectiveHealing'<>'4' THEN
  RAISE EXCEPTION 'Cura em PV cheio não removeu dano não letal'; END IF;

 -- Com 19/20 PV e 10 não letal, 12 pontos curam os 10 não letais primeiro,
 -- recuperam 1 PV e informam 11 pontos efetivos; o excedente não é inventado.
 PERFORM set_config('ordem_roll.nonlethal_internal','1',true);
 UPDATE public.characters SET hp_current=19,nonlethal_damage=10 WHERE id=ficha.id;
 PERFORM set_config('ordem_roll.nonlethal_internal','0',true);
 healing:=public.apply_character_healing_priority(ficha.id,12,19,NULL,
  'a2800000-0000-4000-8000-000000000092');
 IF healing->>'hpAfter'<>'20' OR healing->>'nonlethalAfter'<>'0'
  OR healing->>'nonlethalHealed'<>'10' OR healing->>'hpHealed'<>'1'
  OR healing->>'effectiveHealing'<>'11' THEN
  RAISE EXCEPTION 'Cura 19/20 com dano não letal calculada incorretamente'; END IF;

 IF NOT public.resgate_reviewable_effect(
  '{"kind":"heal","effectiveHealing":4,"nonlethalHealed":4,
    "before":{"hp_current":20},"after":{"hp_current":20}}') THEN
  RAISE EXCEPTION 'Resgate ignorou cura efetiva apenas de dano não letal'; END IF;

 mode_result:=public.validate_combat_damage_mode(
  ficha.id,
  '{"weaponId":"__unarmed__","damageMode":"lethal","damageModePenalty":0}',
  '{"entry":{"otherBonuses":0},"damageModeSnapshot":{"mode":"lethal","penalty":0,"baseOtherBonuses":0,"finalOtherBonuses":0}}');
 IF mode_result->>'naturalDamageMode'<>'nonlethal' OR (mode_result->>'damageModePenalty')::integer<>0 THEN
  RAISE EXCEPTION 'Artista Marcial não liberou dano letal sem apagar o modo não letal natural'; END IF;
 BEGIN
  PERFORM public.validate_combat_damage_mode(
   ficha.id,
   '{"weaponId":"faca-qa","damageMode":"nonlethal","damageModePenalty":-5}',
   '{"entry":{"otherBonuses":0},"damageModeSnapshot":{"mode":"nonlethal","penalty":-5,"baseOtherBonuses":0,"finalOtherBonuses":0}}');
  RAISE EXCEPTION 'Penalidade declarada sem redução no total foi aceita';
 EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 PERFORM set_config('ordem_roll.nonlethal_internal','1',true);
 UPDATE public.characters SET hp_current=19,nonlethal_damage=10 WHERE id=ficha.id;
 PERFORM set_config('ordem_roll.nonlethal_internal','0',true);
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a2800000-0000-4000-8000-000000000001',true);
DO $$
BEGIN
 BEGIN
  UPDATE public.characters SET hp_current=20
   WHERE id='a2800000-0000-4000-8000-000000000011';
  RAISE EXCEPTION 'Aumento direto de PV ignorou dano não letal';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
 BEGIN
  UPDATE public.characters SET nonlethal_damage=99
   WHERE id='a2800000-0000-4000-8000-000000000011';
  RAISE EXCEPTION 'Escrita direta de dano não letal foi aceita';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
END $$;
ROLLBACK;
