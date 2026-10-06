-- Executar após a migration, com acesso administrativo, sempre em transação.
-- Usa a ficha QA existente apenas para obter seu dono; todas as gravações abaixo
-- atingem fixtures com IDs exclusivos e são revertidas. Não cria contas.
BEGIN;
SELECT set_config('test.qa_owner', user_id::text, true)
FROM public.characters WHERE id = 'ecde39f9-2d41-4d39-ad20-c8d013e11ee7';
DO $$ BEGIN
  IF nullif(current_setting('test.qa_owner', true), '') IS NULL THEN
    RAISE EXCEPTION 'Fixture QA não encontrada';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND policyname LIKE 'Block anonymous%' AND permissive='PERMISSIVE') THEN
    RAISE EXCEPTION 'Guard permissivo ainda presente';
  END IF;
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('test.qa_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub',current_setting('test.qa_owner'),'role','authenticated')::text,true);
DO $$
DECLARE affected integer;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.characters WHERE id='ecde39f9-2d41-4d39-ad20-c8d013e11ee7') THEN
    RAISE EXCEPTION 'Dono não consegue ler ficha QA';
  END IF;
  INSERT INTO public.characters(id,user_id,name,origin,class,hp_current,hp_max)
  VALUES('872a85d3-1806-4bf4-aea3-27ef410ccf90',auth.uid(),'QA RLS ROLLBACK','Vítima','Combatente',10,10);
  UPDATE public.characters SET hp_current=9 WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf90';
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>1 THEN RAISE EXCEPTION 'Dono não consegue atualizar fixture'; END IF;
  INSERT INTO public.character_change_history(id,character_id,user_id,change_type,field_name)
  VALUES('872a85d3-1806-4bf4-aea3-27ef410ccf91','872a85d3-1806-4bf4-aea3-27ef410ccf90',auth.uid(),'stats','hp_current');
  INSERT INTO public.character_sustained_rituals(id,character_id,user_id,ritual_id,ritual_name,element)
  VALUES('872a85d3-1806-4bf4-aea3-27ef410ccf92','872a85d3-1806-4bf4-aea3-27ef410ccf90',auth.uid(),'qa','QA RLS','Conhecimento');
  INSERT INTO public.campaigns(id,master_id,name)
  VALUES('872a85d3-1806-4bf4-aea3-27ef410ccf93',auth.uid(),'QA RLS ROLLBACK');
  INSERT INTO public.campaign_members(campaign_id,user_id,character_id,role)
  VALUES('872a85d3-1806-4bf4-aea3-27ef410ccf93',auth.uid(),'872a85d3-1806-4bf4-aea3-27ef410ccf90','master')
  -- A criação da campanha já pode adicionar seu mestre por trigger.
  ON CONFLICT (campaign_id,user_id) DO UPDATE SET character_id=EXCLUDED.character_id;
  INSERT INTO public.campaign_ritual_casts(id,campaign_id,character_id,user_id,ritual_id,ritual_name,ritual_element,ritual_circle,pe_cost,pe_before,pe_after)
  VALUES('872a85d3-1806-4bf4-aea3-27ef410ccf94','872a85d3-1806-4bf4-aea3-27ef410ccf93','872a85d3-1806-4bf4-aea3-27ef410ccf90',auth.uid(),'qa','QA RLS','Conhecimento',1,1,4,3);
  IF NOT EXISTS(SELECT 1 FROM public.character_change_history WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf91')
    OR NOT EXISTS(SELECT 1 FROM public.character_sustained_rituals WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf92')
    OR NOT EXISTS(SELECT 1 FROM public.campaign_ritual_casts WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf94') THEN
    RAISE EXCEPTION 'Dono/mestre não consegue ler histórico/sustentação/conjuração';
  END IF;
END $$;

-- Identidade sem vínculo: leitura vazia, UPDATE/DELETE sem atingir linhas,
-- INSERT em nome de outra identidade rejeitado pela política do proprietário.
SELECT set_config('request.jwt.claim.sub','872a85d3-1806-4bf4-aea3-27ef410ccf99',true);
SELECT set_config('request.jwt.claims','{"sub":"872a85d3-1806-4bf4-aea3-27ef410ccf99","role":"authenticated"}',true);
DO $$
DECLARE affected integer;
BEGIN
  IF EXISTS(SELECT 1 FROM public.characters WHERE id IN ('ecde39f9-2d41-4d39-ad20-c8d013e11ee7','872a85d3-1806-4bf4-aea3-27ef410ccf90'))
    OR EXISTS(SELECT 1 FROM public.character_change_history WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf91')
    OR EXISTS(SELECT 1 FROM public.character_sustained_rituals WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf92')
    OR EXISTS(SELECT 1 FROM public.campaigns WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf93')
    OR EXISTS(SELECT 1 FROM public.campaign_ritual_casts WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf94') THEN
    RAISE EXCEPTION 'Dados vazaram para identidade sem vínculo';
  END IF;
  UPDATE public.characters SET hp_current=0 WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf90';
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Estranho alterou fixture'; END IF;
  DELETE FROM public.characters WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf90';
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>0 THEN RAISE EXCEPTION 'Estranho removeu fixture'; END IF;
  BEGIN
    INSERT INTO public.characters(user_id,name,origin,class)
    VALUES(current_setting('test.qa_owner')::uuid,'QA INSERT NEGADO','Vítima','Combatente');
    RAISE EXCEPTION 'Estranho criou ficha em nome do dono';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{}',true);
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.characters WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf90')
    OR EXISTS(SELECT 1 FROM public.character_change_history WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf91')
    OR EXISTS(SELECT 1 FROM public.character_sustained_rituals WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf92')
    OR EXISTS(SELECT 1 FROM public.campaign_ritual_casts WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf94') THEN
    RAISE EXCEPTION 'Dados vazaram para anônimo';
  END IF;
END $$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',current_setting('test.qa_owner'),true);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.qa_owner'),'role','authenticated')::text,true);
DO $$
DECLARE affected integer;
BEGIN
  IF (SELECT hp_current FROM public.characters WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf90') IS DISTINCT FROM 9 THEN
    RAISE EXCEPTION 'Recurso da fixture foi alterado por estranho';
  END IF;
  DELETE FROM public.characters WHERE id='872a85d3-1806-4bf4-aea3-27ef410ccf90';
  GET DIAGNOSTICS affected=ROW_COUNT;
  IF affected<>1 THEN RAISE EXCEPTION 'Dono não consegue remover fixture'; END IF;
END $$;
ROLLBACK;
