-- Ensaio transacional: usuário, ficha, gastos e recibos são desfeitos ao final.
BEGIN;
INSERT INTO auth.users(id) VALUES('00000000-0000-4000-8000-000000000951');
INSERT INTO public.characters(id,user_id,name,origin,class,class_track,nex,hp_current,hp_max,pe_current,pe_max,san_current,san_max,inventory)
VALUES('00000000-0000-4000-8000-000000000952','00000000-0000-4000-8000-000000000951','QA compatibilidade Disparo','Militar','Especialista','atirador-elite',40,20,20,20,20,30,30,
'[{"id":"qa-rifle","name":"Rifle QA","itemType":"weapon","isEquipped":true}]');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000951',true);
DO $$
DECLARE c uuid:='00000000-0000-4000-8000-000000000952';
 receipt public.character_activity_events; repeated public.character_activity_events;
 track_id text; current_pe integer; event_count integer;
 selection jsonb:='{"weaponId":"qa-rifle","specialAttackIncrements":0,"sneakAttack":false,"lethalShot":true,"techniques":[],"lethalCount":0,"otherPaidBonuses":[]}';
 payload jsonb:='{"entry":{"type":"attack","label":"Disparo QA","results":[12],"diceCount":1,"bestResult":12,"skillBonus":5,"otherBonuses":0,"bonus":5,"total":17}}';
BEGIN
 -- ID do catálogo, legado e nomes normalizados devem cobrar uma única vez.
 FOREACH track_id IN ARRAY ARRAY['atirador-elite','atirador-de-elite','Atirador de Elite','atirador_elite'] LOOP
  UPDATE public.characters SET class_track=track_id WHERE id=c;
  SELECT pe_current INTO current_pe FROM public.characters WHERE id=c;
  receipt:=public.confirm_character_combat_attack(gen_random_uuid(),c,current_pe,1,NULL,selection,payload);
  repeated:=public.confirm_character_combat_attack(receipt.operation_id,c,current_pe,1,NULL,selection,payload);
  IF receipt.id<>repeated.id OR receipt.payload->>'peCost'<>'1'
   OR (SELECT pe_current FROM public.characters WHERE id=c)<>current_pe-1
   OR (SELECT count(*) FROM public.character_activity_events WHERE operation_id=receipt.operation_id)<>1 THEN
   RAISE EXCEPTION 'Alias % ou repetição incorreta',track_id;
  END IF;
 END LOOP;
 SELECT pe_current INTO current_pe FROM public.characters WHERE id=c;
 SELECT count(*) INTO event_count FROM public.character_activity_events WHERE character_id=c;
 -- Mesmo UUID com conteúdo diferente continua recusado.
 BEGIN
  PERFORM public.confirm_character_combat_attack(receipt.operation_id,c,current_pe,1,NULL,selection,payload);
  RAISE EXCEPTION 'UUID reutilizado aceito';
 EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;
 -- Nenhuma outra trilha recebe Disparo; NEX e classe continuam obrigatórios.
 FOREACH track_id IN ARRAY ARRAY['infiltrador','atirador','atirador-elite-extra',''] LOOP
  UPDATE public.characters SET class_track=track_id WHERE id=c;
  BEGIN
   PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,current_pe,1,NULL,selection,payload);
   RAISE EXCEPTION 'Trilha inválida aceita: %',track_id;
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 END LOOP;
 UPDATE public.characters SET class_track='atirador-elite',nex=35 WHERE id=c;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,current_pe,1,NULL,selection,payload);
  RAISE EXCEPTION 'NEX insuficiente aceito';
 EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 UPDATE public.characters SET nex=40,class='Combatente' WHERE id=c;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,current_pe,1,NULL,selection,payload);
  RAISE EXCEPTION 'Classe inválida aceita';
 EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 UPDATE public.characters SET class='Especialista' WHERE id=c;
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),c,current_pe,0,NULL,selection,payload);
  RAISE EXCEPTION 'Custo adulterado aceito';
 EXCEPTION WHEN SQLSTATE '22023' THEN NULL; END;
 IF (SELECT pe_current FROM public.characters WHERE id=c)<>current_pe
  OR (SELECT count(*) FROM public.character_activity_events WHERE character_id=c)<>event_count THEN
  RAISE EXCEPTION 'Recusa alterou PE ou histórico'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000953',true);
DO $$ BEGIN
 BEGIN
  PERFORM public.confirm_character_combat_attack(gen_random_uuid(),'00000000-0000-4000-8000-000000000952',16,1,NULL,'{}','{}');
  RAISE EXCEPTION 'Outra conta autorizada';
 EXCEPTION WHEN SQLSTATE '42501' THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'lethal_shot_track_compatibility: passed; fixtures rolled back' AS result;
