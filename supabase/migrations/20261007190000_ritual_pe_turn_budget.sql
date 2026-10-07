-- Orçamento confirmado para conjuração e manutenção. Não classifica edições de PE como habilidades.
-- Turnos manuais existentes ficam inativos até um novo início explícito; nada é cobrado retroativamente.
ALTER TABLE public.character_manual_turns ADD COLUMN active boolean NOT NULL DEFAULT false;
CREATE TABLE public.ritual_minimum_pe_costs(ritual_id text PRIMARY KEY,minimum_cost integer NOT NULL CHECK(minimum_cost>=0));
ALTER TABLE public.ritual_minimum_pe_costs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ritual_minimum_pe_costs FROM PUBLIC,anon,authenticated;
INSERT INTO public.ritual_minimum_pe_costs VALUES
('amaldicoar-arma-conhecimento',1),
('compreensao-paranormal',1),
('enfeiticar',1),
('ouvir-os-sussurros',1),
('perturbacao',1),
('tecer-ilusao',1),
('terceiro-olho',1),
('amaldicoar-arma-energia',1),
('amaldicoar-tecnologia',1),
('coincidencia-forcada',1),
('eletrocussao',1),
('embaralhar',1),
('luz',1),
('polarizacao-caotica',1),
('cineraria',1),
('amaldicoar-arma-morte',1),
('cicatrizacao',1),
('consumir-manancial',1),
('decadencia',1),
('definhar',1),
('espirais-da-perdicao',1),
('nuvem-de-cinzas',1),
('amaldicoar-arma-sangue',1),
('arma-atroz',1),
('armadura-de-sangue',1),
('corpo-adaptado',1),
('distorcer-aparencia',1),
('fortalecimento-sensorial',1),
('odio-incontrolavel',1),
('aprimorar-mente',3),
('deteccao-de-ameacas',3),
('esconder-dos-olhos',3),
('invadir-mente',3),
('localizacao',3),
('chamas-do-caos',3),
('contencao-fantasmagorica',3),
('dissonancia-acustica',3),
('sopro-do-caos',3),
('tela-de-ruido',3),
('protecao-contra-rituais',3),
('rejeitar-nevoa',3),
('desacelerar-impacto',3),
('eco-espiral',3),
('miasma-entropico',3),
('paradoxo',3),
('velocidade-mortal',3),
('aprimorar-fisico',3),
('descarnar',3),
('flagelo-de-sangue',3),
('hemofagia',3),
('transfusao-vital',3),
('alterar-memoria',6),
('contato-paranormal',6),
('mergulho-mental',6),
('videncia',6),
('convocacao-instantanea',6),
('salto-fantasma',6),
('transfigurar-agua',6),
('transfigurar-terra',6),
('dissipar-ritual',6),
('ancora-temporal',6),
('poeira-da-podridao',6),
('tentaculos-de-lodo',6),
('zerar-entropia',6),
('ferver-sangue',6),
('forma-monstruosa',6),
('purgatorio',6),
('vomitar-pestes',6),
('controle-mental',10),
('inexistir',10),
('possessao',10),
('alterar-destino',10),
('deflagracao-de-energia',10),
('teletransporte',10),
('canalizar-o-medo',10),
('conhecendo-o-medo',10),
('lamina-do-medo',10),
('medo-tangivel',10),
('presenca-do-medo',10),
('convocar-o-algoz',10),
('distorcao-temporal',10),
('fim-inevitavel',10),
('capturar-o-coracao',10),
('involucro-de-carne',10),
('vinculo-de-sangue',10);
CREATE TABLE public.character_pe_turn_spending(
 operation_id uuid PRIMARY KEY REFERENCES public.character_activity_events(id) ON DELETE CASCADE,
 character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
 turn_key text, cost integer NOT NULL CHECK(cost>=0), kind text NOT NULL CHECK(kind IN ('ritual','maintenance'))
);
CREATE INDEX character_pe_turn_spending_context ON public.character_pe_turn_spending(character_id,turn_key);
ALTER TABLE public.character_pe_turn_spending ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_pe_turn_spending FROM PUBLIC,anon,authenticated;

-- Bloqueio estável: campanhas antes da ficha; serializa duas abas e avanço do tracker.
CREATE FUNCTION public.lock_character_pe_turn(p_character_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.campaign_combat_state_v2 WHERE campaign_id IN
  (SELECT campaign_id FROM public.campaign_members_v2 WHERE character_id=p_character_id) ORDER BY campaign_id FOR UPDATE;
 PERFORM 1 FROM public.characters WHERE id=p_character_id FOR UPDATE;
END $$;
REVOKE ALL ON FUNCTION public.lock_character_pe_turn(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.get_character_pe_budget(p_character_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE ficha public.characters; combat record; matches integer:=0; context jsonb; clock public.character_manual_turns;
 base_limit integer; ritual_limit integer; spent integer; actor text; key text;
BEGIN
 PERFORM public.lock_character_pe_turn(p_character_id);
 SELECT * INTO ficha FROM public.characters WHERE id=p_character_id;
 IF ficha.nex NOT BETWEEN 0 AND 99 THEN RAISE EXCEPTION 'NEX exige revisão.' USING ERRCODE='0A000'; END IF;
 base_limit:=CASE WHEN ficha.nex=99 THEN 20 ELSE greatest(1,floor(ficha.nex/5.0)::integer) END;
 IF lower(ficha.origin) IN ('universitário','universitario') THEN base_limit:=base_limit+1; END IF;
 ritual_limit:=base_limit;
 IF lower(ficha.class)='ocultista' AND lower(ficha.class_track)='intuitivo' AND ficha.nex>=40 THEN
  ritual_limit:=ritual_limit+greatest(0,ficha.presence);
 END IF;
 FOR combat IN SELECT s.* FROM public.campaign_combat_state_v2 s JOIN public.campaign_members_v2 m ON m.campaign_id=s.campaign_id
  JOIN public.characters c ON c.id=m.character_id AND c.user_id=m.user_id
  WHERE c.id=p_character_id AND s.state->'active'='true'::jsonb LOOP
  matches:=matches+1;
  actor:=combat.state->'combatants'->((combat.state->>'currentTurnIndex')::integer)->>'id';
  IF actor IS NULL THEN RAISE EXCEPTION 'Combate sem turno válido.' USING ERRCODE='0A000'; END IF;
  key:=concat('v2:',combat.campaign_id,':',combat.scene_number,':',combat.state->>'round',':',actor);
  context:=jsonb_build_object('mode','combat','tracked',true,'key',key,'campaignId',combat.campaign_id,
   'scene',combat.scene_number,'round',(combat.state->>'round')::integer,'actorId',actor);
 END LOOP;
 IF matches>1 THEN RAISE EXCEPTION 'Mais de um combate ativo.' USING ERRCODE='0A000'; END IF;
 IF matches=0 THEN
  SELECT * INTO clock FROM public.character_manual_turns WHERE character_id=p_character_id;
  IF coalesce(clock.active,false) THEN
   key:=concat('manual:',p_character_id,':',clock.turn_number);
   context:=jsonb_build_object('mode','manual','tracked',true,'key',key,'number',clock.turn_number);
  ELSE context:=jsonb_build_object('mode','untracked','tracked',false,'key',NULL); END IF;
 END IF;
 SELECT coalesce(sum(cost),0)::integer INTO spent FROM public.character_pe_turn_spending
  WHERE character_id=p_character_id AND turn_key=key;
 RETURN context||jsonb_build_object('spent',spent,'limit',base_limit,'ritualLimit',ritual_limit,
  'remaining',greatest(0,base_limit-spent),'ritualRemaining',greatest(0,ritual_limit-spent));
END $$;
REVOKE ALL ON FUNCTION public.get_character_pe_budget(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_pe_budget(uuid) TO authenticated;

-- Conserva o contador manual e a assinatura anterior; pausar não encerra efeitos ou estorna PE.
ALTER FUNCTION public.get_character_ritual_turn(uuid) RENAME TO get_character_ritual_turn_budget_core;
REVOKE ALL ON FUNCTION public.get_character_ritual_turn_budget_core(uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.get_character_ritual_turn(p_character_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 result:=public.get_character_ritual_turn_budget_core(p_character_id);
 IF result->>'mode'='manual' THEN result:=result||jsonb_build_object('eligible',coalesce((SELECT active FROM public.character_manual_turns WHERE character_id=p_character_id),false)); END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_character_ritual_turn(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_ritual_turn(uuid) TO authenticated;

ALTER FUNCTION public.begin_character_manual_turn(uuid,uuid,integer) RENAME TO begin_character_manual_turn_budget_core;
REVOKE ALL ON FUNCTION public.begin_character_manual_turn_budget_core(uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.begin_character_manual_turn(p_operation_id uuid,p_character_id uuid,p_expected_turn integer)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; existing boolean;
BEGIN
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 existing:=EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id);
 receipt:=public.begin_character_manual_turn_budget_core(p_operation_id,p_character_id,p_expected_turn);
 -- Recuperar um início antigo depois de pausar não reativa o controle.
 IF NOT existing THEN UPDATE public.character_manual_turns SET active=true WHERE character_id=p_character_id; END IF;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.begin_character_manual_turn(uuid,uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.begin_character_manual_turn(uuid,uuid,integer) TO authenticated;

CREATE FUNCTION public.pause_character_manual_turn(p_operation_id uuid,p_character_id uuid,p_expected_turn integer)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; fingerprint text;
BEGIN
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 IF p_operation_id IS NULL OR p_expected_turn IS NULL OR p_expected_turn<1 THEN RAISE EXCEPTION 'Turno inválido.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array('manual_turn_pause',p_character_id,p_expected_turn)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN
  IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF;
  RETURN receipt;
 END IF;
 IF public.get_character_ritual_turn(p_character_id)->>'mode'<>'manual' THEN RAISE EXCEPTION 'Combate ativo.' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.character_manual_turns WHERE character_id=p_character_id AND active AND turn_number=p_expected_turn) THEN
  RAISE EXCEPTION 'Turno mudou.' USING ERRCODE='40001'; END IF;
 UPDATE public.character_manual_turns SET active=false WHERE character_id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',
  jsonb_build_object('kind','manual_turn_pause','turnNumber',p_expected_turn,'peCost',0),fingerprint) RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.pause_character_manual_turn(uuid,uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.pause_character_manual_turn(uuid,uuid,integer) TO authenticated;

-- Executado após o débito, na mesma transação: rejeição desfaz PE, SAN e evento juntos.
CREATE FUNCTION public.record_ritual_pe_budget(p_event_id uuid,p_budget jsonb,p_cost integer,p_kind text,p_minimum boolean)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE receipt public.character_activity_events; total integer; maximum integer; exception boolean; summary jsonb;
BEGIN
 SELECT * INTO receipt FROM public.character_activity_events WHERE id=p_event_id;
 IF EXISTS(SELECT 1 FROM public.character_pe_turn_spending WHERE operation_id=p_event_id) THEN RETURN receipt; END IF;
 maximum:=CASE WHEN p_kind='ritual' THEN (p_budget->>'ritualLimit')::integer ELSE (p_budget->>'limit')::integer END;
 total:=(p_budget->>'spent')::integer+p_cost;
 exception:=p_minimum AND (p_budget->>'spent')::integer=0;
 IF p_budget->'tracked'='true'::jsonb AND p_cost>0 AND total>maximum AND NOT exception THEN
  RAISE EXCEPTION 'Limite de PE do turno excedido. Nenhuma cobrança.' USING ERRCODE='55002'; END IF;
 INSERT INTO public.character_pe_turn_spending(operation_id,character_id,turn_key,cost,kind)
 VALUES(p_event_id,receipt.character_id,p_budget->>'key',p_cost,p_kind);
 summary:=p_budget||jsonb_build_object('cost',p_cost,'spentAfter',CASE WHEN p_budget->'tracked'='true'::jsonb THEN total ELSE 0 END,
  'minimumCostException',p_budget->'tracked'='true'::jsonb AND p_cost>0 AND total>maximum AND exception);
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('peBudget',summary) WHERE id=p_event_id RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.record_ritual_pe_budget(uuid,jsonb,integer,text,boolean) FROM PUBLIC,anon,authenticated;

ALTER FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) RENAME TO cast_character_ritual_budget_core;
REVOKE ALL ON FUNCTION public.cast_character_ritual_budget_core(uuid,uuid,integer,integer,jsonb,uuid,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.cast_character_ritual(p_operation_id uuid,p_character_id uuid,p_expected_pe integer,p_pe_cost integer,p_payload jsonb,
 p_campaign_id uuid DEFAULT NULL,p_campaign_version text DEFAULT NULL)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE budget jsonb; receipt public.character_activity_events; minimum_cost integer; minimum boolean:=false;
BEGIN
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 IF EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
  RETURN public.cast_character_ritual_budget_core(p_operation_id,p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version);
 END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 SELECT minimum_costs.minimum_cost INTO minimum_cost FROM public.ritual_minimum_pe_costs minimum_costs WHERE ritual_id=p_payload->>'ritualId';
 minimum:=minimum_cost IS NOT NULL AND p_pe_cost<=minimum_cost AND coalesce(p_payload->'enhancements','[]'::jsonb)='[]'::jsonb;
 receipt:=public.cast_character_ritual_budget_core(p_operation_id,p_character_id,p_expected_pe,p_pe_cost,p_payload,p_campaign_id,p_campaign_version);
 RETURN public.record_ritual_pe_budget(receipt.id,budget,p_pe_cost,'ritual',minimum);
END $$;
REVOKE ALL ON FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cast_character_ritual(uuid,uuid,integer,integer,jsonb,uuid,text) TO authenticated;

ALTER FUNCTION public.confirm_sustained_ritual_maintenance(uuid,uuid,jsonb,integer,jsonb) RENAME TO confirm_sustained_ritual_maintenance_budget_core;
REVOKE ALL ON FUNCTION public.confirm_sustained_ritual_maintenance_budget_core(uuid,uuid,jsonb,integer,jsonb) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.confirm_sustained_ritual_maintenance(p_operation_id uuid,p_character_id uuid,p_expected jsonb,p_expected_pe integer,p_turn jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE budget jsonb; receipt public.character_activity_events;
BEGIN
 IF p_operation_id IS NULL THEN RAISE EXCEPTION 'ID obrigatório.' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 PERFORM public.lock_character_pe_turn(p_character_id);
 IF EXISTS(SELECT 1 FROM public.character_activity_events WHERE operation_id=p_operation_id) THEN
  RETURN public.confirm_sustained_ritual_maintenance_budget_core(p_operation_id,p_character_id,p_expected,p_expected_pe,p_turn);
 END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 receipt:=public.confirm_sustained_ritual_maintenance_budget_core(p_operation_id,p_character_id,p_expected,p_expected_pe,p_turn);
 RETURN public.record_ritual_pe_budget(receipt.id,budget,(receipt.payload->>'peCost')::integer,'maintenance',false);
END $$;
REVOKE ALL ON FUNCTION public.confirm_sustained_ritual_maintenance(uuid,uuid,jsonb,integer,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_sustained_ritual_maintenance(uuid,uuid,jsonb,integer,jsonb) TO authenticated;
