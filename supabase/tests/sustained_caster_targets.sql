-- Conjurador e alvo têm donos distintos. Toda a fixture é revertida.
BEGIN;
INSERT INTO auth.users(id) VALUES ('00000000-0000-4000-8000-000000000611'),('00000000-0000-4000-8000-000000000612');
INSERT INTO public.characters(id,user_id,name,origin,class,pe_current,pe_max,active_buffs) VALUES
 ('00000000-0000-4000-8000-000000000601','00000000-0000-4000-8000-000000000611','QA conjurador','Vítima','Ocultista',10,10,'[]'),
 ('00000000-0000-4000-8000-000000000602','00000000-0000-4000-8000-000000000612','QA alvo distinto','Vítima','Ocultista',3,3,'[{"id":"personalizado"}]');
INSERT INTO public.campaigns_v2(id,master_id,name) VALUES ('00000000-0000-4000-8000-000000000603','00000000-0000-4000-8000-000000000611','QA alvos sustentados');
UPDATE public.campaign_members_v2 SET character_id='00000000-0000-4000-8000-000000000601'
WHERE campaign_id='00000000-0000-4000-8000-000000000603' AND user_id='00000000-0000-4000-8000-000000000611';
INSERT INTO public.campaign_members_v2(campaign_id,user_id,character_id,role) VALUES
 ('00000000-0000-4000-8000-000000000603','00000000-0000-4000-8000-000000000612','00000000-0000-4000-8000-000000000602','player');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000611',true);
DO $$
DECLARE caster uuid:='00000000-0000-4000-8000-000000000601'; target uuid:='00000000-0000-4000-8000-000000000602';
 campaign uuid:='00000000-0000-4000-8000-000000000603'; cast_event public.character_activity_events;
 receipt public.character_activity_events; operation uuid:=gen_random_uuid(); expected jsonb;
BEGIN
 cast_event:=public.cast_character_ritual(gen_random_uuid(),caster,10,1,'{"ritualId":"arma-atroz","ritualName":"Arma Atroz"}',campaign,'v2');
 PERFORM public.apply_character_effect(gen_random_uuid(),target,'weapon_buff',
  '{"ritualId":"arma-atroz","ritualName":"Arma Atroz","element":"Sangue","duration":"sustentado","attackBonus":2,"enhancements":[]}',
  '{"active_buffs":[{"id":"personalizado"}]}',cast_event.id,campaign,'v2');
 PERFORM public.apply_character_effect(gen_random_uuid(),target,'sustain',
  '{"ritualId":"arma-atroz","ritualName":"Arma Atroz","element":"Sangue","circle":1,"selectedEnhancements":[],"sustainConfig":{"action":"free"}}',
  '{}',cast_event.id,campaign,'v2');
 IF (SELECT count(*) FROM public.list_character_sustained_rituals(caster))<>1 THEN RAISE EXCEPTION 'Conjurador não vê a manutenção'; END IF;
 SELECT jsonb_agg(jsonb_build_object('id',r->'id','ritual_id',r->'ritual_id','turns_active',r->'turns_active',
  'pe_spent_total',r->'pe_spent_total','sustain_config',r->'sustain_config','is_concentrating',r->'is_concentrating') ORDER BY r->>'id')
 INTO expected FROM public.list_character_sustained_rituals(caster) r;
 receipt:=public.confirm_sustained_ritual_action(operation,caster,'maintain',expected,9);
 PERFORM public.confirm_sustained_ritual_action(operation,caster,'maintain',expected,9);
 IF (SELECT pe_current FROM public.characters WHERE id=caster)<>8 OR (SELECT pe_current FROM public.characters WHERE id=target)<>3
 OR (SELECT turns_active FROM public.character_sustained_rituals WHERE character_id=target)<>1 THEN RAISE EXCEPTION 'Cobrança duplicada ou no alvo'; END IF;
 BEGIN
  PERFORM public.confirm_sustained_ritual_action(gen_random_uuid(),caster,'maintain',expected,8);
  RAISE EXCEPTION 'Snapshot antigo aceito'; EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 -- O jogador alvo pode ler o efeito, mas não pagar pela conjuração alheia.
 PERFORM set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000612',true);
 SELECT jsonb_agg(jsonb_build_object('id',r->'id','ritual_id',r->'ritual_id','turns_active',r->'turns_active',
  'pe_spent_total',r->'pe_spent_total','sustain_config',r->'sustain_config','is_concentrating',r->'is_concentrating') ORDER BY r->>'id')
 INTO expected FROM public.list_character_sustained_rituals(target) r;
 BEGIN
  PERFORM public.confirm_sustained_ritual_action(gen_random_uuid(),target,'maintain',expected,3);
  RAISE EXCEPTION 'Alvo pagou PE'; EXCEPTION WHEN SQLSTATE '0A000' THEN NULL;
 END;
 PERFORM set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000611',true);
 receipt:=public.confirm_sustained_ritual_end(gen_random_uuid(),caster,'end',expected,'{"kind":"voluntario","rangeConfirmed":true}');
 IF EXISTS(SELECT 1 FROM public.list_character_sustained_rituals(caster))
 OR (SELECT active_buffs FROM public.characters WHERE id=target)<>'[{"id":"personalizado"}]'::jsonb
 OR (SELECT pe_current FROM public.characters WHERE id=caster)<>8
 OR jsonb_array_length(receipt.payload->'targets')<>1 THEN RAISE EXCEPTION 'Encerramento incorreto ou perdeu efeito personalizado'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
