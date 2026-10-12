-- Explosivos do Livro Base: resultado, consumo e instalação confirmados uma única vez.
CREATE FUNCTION public.confirm_character_explosive_action(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c public.characters; item jsonb; receipt public.character_activity_events; fingerprint text;
 quantity integer; kind text; point text; budget jsonb; dt integer; expert boolean;
 count_dice integer; dice jsonb:='[]'; die integer; total integer:=0; kept integer; keep_low boolean;
 training integer; modifier integer; penalty integer; extra integer; installation jsonb; inventory_after jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 point:=trim(p_request->>'point');
 IF p_operation_id IS NULL OR jsonb_typeof(p_request) IS DISTINCT FROM 'object' OR octet_length(p_request::text)>16000
 OR p_request->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb OR point IS NULL OR length(point) NOT BETWEEN 1 AND 240 THEN
 RAISE EXCEPTION 'Confirme os requisitos e o ponto escolhido.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF; RETURN receipt; END IF;
 budget:=public.get_character_pe_budget(p_character_id);
 SELECT * INTO c FROM public.characters WHERE id=p_character_id FOR UPDATE;
 IF (SELECT count(*) FROM jsonb_array_elements(c.inventory) WHERE value->>'id'=p_request->'item'->>'id')<>1 THEN RAISE EXCEPTION 'Item ausente ou duplicado.' USING ERRCODE='40001'; END IF;
 SELECT value INTO item FROM jsonb_array_elements(c.inventory) WHERE value->>'id'=p_request->'item'->>'id';
 IF item IS DISTINCT FROM p_request->'item' THEN RAISE EXCEPTION 'O item mudou. Atualize.' USING ERRCODE='40001'; END IF;
 kind:=public.explosive_type(item->>'catalogId');
 IF kind IS NULL OR item->>'catalogType' IS DISTINCT FROM 'explosivo' THEN RAISE EXCEPTION 'Explosivo incompatível.' USING ERRCODE='22023'; END IF;
 IF coalesce(item->>'quantity','1') !~ '^[0-9]{1,6}$' THEN RAISE EXCEPTION 'Quantidade inválida.' USING ERRCODE='22023'; END IF;
 quantity:=coalesce((item->>'quantity')::integer,1);
 IF quantity<1 OR (item ? 'uses' AND coalesce(item->>'uses','0') !~ '^[1-9][0-9]{0,5}$') THEN RAISE EXCEPTION 'Explosivo indisponível.' USING ERRCODE='55004'; END IF;
 IF c.agility NOT BETWEEN 0 AND 5 OR c.intellect NOT BETWEEN 0 AND 5 THEN RAISE EXCEPTION 'Confira os atributos.' USING ERRCODE='22023'; END IF;
 SELECT EXISTS(SELECT 1 FROM jsonb_array_elements(
 CASE WHEN jsonb_typeof(c.powers)='array' THEN c.powers ELSE '[]' END ||
 CASE WHEN jsonb_typeof(c.general_powers)='array' THEN c.general_powers ELSE '[]' END) p
 WHERE p->>'id'='perito-explosivos' OR lower(p->>'name')='perito em explosivos' OR p #>> '{}'='perito-explosivos') INTO expert;
 dt:=10+(budget->>'limit')::integer+CASE WHEN kind='mine' THEN c.intellect ELSE c.agility END+CASE WHEN expert THEN c.intellect ELSE 0 END;
 IF kind='smoke' THEN dt:=NULL; END IF;
 IF kind='mine' THEN
 IF length(trim(coalesce(p_request->>'direction',''))) NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Informe a direção do cone.' USING ERRCODE='22023'; END IF;
 SELECT coalesce((value #>> '{}')::integer,0) INTO training FROM jsonb_each(c.skills) WHERE lower(key) IN ('tatica','tática') LIMIT 1;
 IF coalesce(training,0) NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Instalar exige Tática treinada.' USING ERRCODE='55004'; END IF;
 IF coalesce(p_request->>'otherBonuses','0') !~ '^-?[0-9]{1,3}$' OR coalesce(p_request->>'dicePenalty','0') !~ '^[0-9]{1,2}$'
 OR coalesce(p_request->>'extraDice','0') !~ '^[0-9]{1,2}$' THEN RAISE EXCEPTION 'Modificadores inválidos.' USING ERRCODE='22023'; END IF;
 modifier:=coalesce((p_request->>'otherBonuses')::integer,0); penalty:=coalesce((p_request->>'dicePenalty')::integer,0); extra:=coalesce((p_request->>'extraDice')::integer,0);
 IF abs(modifier)>100 OR penalty>10 OR extra>10 THEN RAISE EXCEPTION 'Modificadores fora do limite.' USING ERRCODE='22023'; END IF;
 IF c.intellect=0 THEN count_dice:=2+penalty; keep_low:=true;
 ELSIF c.intellect+extra-penalty>=1 THEN count_dice:=c.intellect+extra-penalty; keep_low:=false;
 ELSE count_dice:=c.intellect+extra+penalty; keep_low:=true; END IF;
 FOR i IN 1..count_dice LOOP die:=floor(random()*20)::integer+1; dice:=dice||to_jsonb(die);
 kept:=CASE WHEN kept IS NULL THEN die WHEN keep_low THEN least(kept,die) ELSE greatest(kept,die) END; END LOOP;
 total:=kept+training*5+modifier;
 installation:=jsonb_build_object('dice',dice,'kept',kept,'trainingBonus',training*5,'declaredOtherBonuses',modifier,'dicePenalty',penalty,'extraDice',extra,'total',total,'dt',15,'passed',total>=15);
 dice:='[]'; total:=0;
 ELSE
 count_dice:=CASE kind WHEN 'fragmentation' THEN 8 WHEN 'incendiary' THEN 6 ELSE 0 END;
 FOR i IN 1..count_dice LOOP die:=floor(random()*6)::integer+1; dice:=dice||to_jsonb(die); total:=total+die; END LOOP;
 END IF;
 SELECT coalesce(jsonb_agg(CASE WHEN value->>'id'=item->>'id' THEN jsonb_set(value,'{quantity}',to_jsonb(quantity-1)) ELSE value END ORDER BY ordinality),'[]')
 INTO inventory_after FROM jsonb_array_elements(c.inventory) WITH ORDINALITY WHERE value->>'id'<>item->>'id' OR quantity>1;
 UPDATE public.characters SET inventory=inventory_after WHERE id=p_character_id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'roll','confirmed',jsonb_build_object(
 'kind','explosive_event','explosiveType',kind,'stage',CASE WHEN kind='mine' THEN CASE WHEN (installation->>'passed')::boolean THEN 'installed' ELSE 'failed' END ELSE 'active' END,
 'installation',installation,'direction',p_request->>'direction','remainingRounds',CASE kind WHEN 'smoke' THEN 2 WHEN 'stun' THEN 1 ELSE 0 END,
 'itemName',item->>'name','point',point,'radius',6,'actionCost',CASE WHEN kind='mine' THEN 'completa' ELSE 'padrão' END,'peCost',0,'consumed',1,'remainingQuantity',quantity-1,
 'requirementsDeclared',true,'dt',dt,'agility',c.agility,'peLimit',(budget->>'limit')::integer,'expertIntellect',CASE WHEN expert THEN c.intellect ELSE 0 END,
 'maxExcludedTargets',CASE WHEN expert THEN c.intellect ELSE 0 END,'targetResolution','pending',
 'result',jsonb_build_object('label','Explosivo: '||(item->>'name'),'dice',dice,'total',total,'damageType',CASE kind WHEN 'incendiary' THEN 'Fogo' WHEN 'fragmentation' THEN 'Perfuração' WHEN 'mine' THEN 'Perfuração' ELSE NULL END)),
 fingerprint) RETURNING * INTO receipt;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.confirm_character_explosive_action(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_character_explosive_action(uuid,uuid,jsonb) TO authenticated;

-- Leitura autenticada mínima; somente o mestre recebe candidatos com PV atuais.
CREATE FUNCTION public.get_character_explosives(p_character_id uuid,p_page integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE master boolean; events jsonb; targets jsonb;
BEGIN
 IF NOT public.can_manage_character_activity(p_character_id) THEN RAISE EXCEPTION 'Ficha não autorizada.' USING ERRCODE='42501'; END IF;
 IF p_page IS NULL OR p_page NOT BETWEEN 0 AND 10000 THEN RAISE EXCEPTION 'Página inválida.' USING ERRCODE='22023'; END IF;
 master:=public.is_fragmentation_master(p_character_id);
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',e.id,'payload',e.payload,'createdAt',e.created_at,
 'targets',coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.target_id,'name',c.name,'hp',c.hp_current,
 'excluded',t.excluded,'applied',t.applied_event_id IS NOT NULL,'active',t.active AND EXISTS(SELECT 1 FROM jsonb_array_elements(c.conditions) cond WHERE cond->>'explosiveSource'=e.id::text),'conditions',CASE WHEN master THEN c.conditions ELSE '[]'::jsonb END)) FROM public.fragmentation_target_resolutions t
 JOIN public.characters c ON c.id=t.target_id WHERE t.explosion_id=e.id),'[]')) ORDER BY e.created_at DESC),'[]')
 INTO events FROM (SELECT * FROM public.character_activity_events WHERE character_id=p_character_id
 AND payload->>'kind' IN ('fragmentation_throw','explosive_event') ORDER BY created_at DESC,id DESC LIMIT 30 OFFSET p_page*30) e;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'hp',c.hp_current) ORDER BY c.name),'[]') INTO targets
 FROM public.characters c WHERE master AND public.is_fragmentation_master(p_character_id,c.id);
 RETURN jsonb_build_object('master',master,'candidates',targets,'explosions',events);
END $$;

-- Lista é imutável após conferência. Exclusões exigem Perito e respeitam seu Intelecto salvo.
CREATE FUNCTION public.confirm_character_explosive_targets(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e public.character_activity_events; receipt public.character_activity_events; fingerprint text; entry jsonb; target uuid;
BEGIN
 IF NOT public.is_fragmentation_master(p_character_id) THEN RAISE EXCEPTION 'Somente o mestre confirma a área.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR jsonb_typeof(p_request->'targets') IS DISTINCT FROM 'array'
 OR jsonb_array_length(p_request->'targets')>50 OR p_request->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb THEN
 RAISE EXCEPTION 'Confirme alvos e exclusões da área.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF; RETURN receipt; END IF;
 SELECT * INTO e FROM public.character_activity_events WHERE id=(p_request->>'explosionId')::uuid AND character_id=p_character_id AND payload->>'kind' IN ('fragmentation_throw','explosive_event') FOR UPDATE;
 IF NOT FOUND OR coalesce(e.payload->>'stage','active')<>'active'
 OR (e.payload->>'explosiveType' IN ('smoke','stun') AND (e.payload->>'remainingRounds')::integer<=0)
 OR (e.payload->'areaConfirmed'='true' AND e.payload->>'explosiveType' IS DISTINCT FROM 'smoke') THEN RAISE EXCEPTION 'Explosão ausente ou área já confirmada.' USING ERRCODE='55004'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(p_request->'targets'))<>(SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(p_request->'targets'))
 OR (SELECT count(*) FROM jsonb_array_elements(p_request->'targets') WHERE value->'excluded'='true')>(e.payload->>'maxExcludedTargets')::integer THEN
 RAISE EXCEPTION 'Alvos repetidos ou exclusões além do limite de Perito.' USING ERRCODE='22023'; END IF;
 FOR entry IN SELECT value FROM jsonb_array_elements(p_request->'targets') LOOP
 target:=(entry->>'id')::uuid;
 IF NOT public.is_fragmentation_master(p_character_id,target) OR jsonb_typeof(entry->'excluded') IS DISTINCT FROM 'boolean' THEN
 RAISE EXCEPTION 'Alvo não vinculado à campanha ou exclusão inválida.' USING ERRCODE='42501'; END IF;
 INSERT INTO public.fragmentation_target_resolutions(explosion_id,target_id,excluded) VALUES(e.id,target,(entry->>'excluded')::boolean)
 ON CONFLICT(explosion_id,target_id) DO UPDATE SET applied_event_id=NULL,excluded=EXCLUDED.excluded
 WHERE e.payload->>'explosiveType'='smoke' AND (NOT fragmentation_target_resolutions.active OR NOT EXISTS(
  SELECT 1 FROM public.characters actual,jsonb_array_elements(actual.conditions) cond
  WHERE actual.id=fragmentation_target_resolutions.target_id AND cond->>'explosiveSource'=e.id::text));
 END LOOP;
 IF (SELECT count(*) FROM public.fragmentation_target_resolutions WHERE explosion_id=e.id AND excluded)>(e.payload->>'maxExcludedTargets')::integer THEN
 RAISE EXCEPTION 'Exclusões totais além do limite de Perito.' USING ERRCODE='22023'; END IF;
 UPDATE public.character_activity_events SET payload=payload||jsonb_build_object('areaConfirmed',true) WHERE id=e.id;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',jsonb_build_object('kind','explosive_area','explosiveType',coalesce(e.payload->>'explosiveType','fragmentation'),
 'explosionId',e.id,'targetCount',jsonb_array_length(p_request->'targets'),'targets',p_request->'targets'),fingerprint) RETURNING * INTO receipt;
 RETURN receipt;
END $$;

-- Reflexos/RD declarados pelo mestre. Servidor calcula metade, temporários e PV, sem aceitar dano arbitrário.
CREATE FUNCTION public.confirm_character_explosive_effect(p_operation_id uuid,p_character_id uuid,p_request jsonb)
RETURNS public.character_activity_events LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE e public.character_activity_events; receipt public.character_activity_events; t public.fragmentation_target_resolutions;
 c public.characters; fingerprint text; test integer; rd integer; damage integer; temp integer; hp integer; passed boolean; target_event uuid:=gen_random_uuid(); application_payload jsonb; kind text; ids text[]; next_conditions jsonb; immune_damage boolean; immune_effect boolean;
BEGIN
 IF NOT public.is_fragmentation_master(p_character_id,(p_request->>'targetId')::uuid) THEN RAISE EXCEPTION 'Somente o mestre aplica aos alvos vinculados.' USING ERRCODE='42501'; END IF;
 IF p_operation_id IS NULL OR p_request->'requirementsConfirmed' IS DISTINCT FROM 'true'::jsonb
 OR coalesce(p_request->>'resistanceTotal','') !~ '^-?[0-9]{1,3}$' OR coalesce(p_request->>'damageReduction','') !~ '^[0-9]{1,3}$'
 OR coalesce(p_request->>'expectedHp','') !~ '^[0-9]{1,6}$' THEN RAISE EXCEPTION 'Confira Reflexos, RD e PV.' USING ERRCODE='22023'; END IF;
 fingerprint:=md5(jsonb_build_array(p_character_id,p_request)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_operation_id::text,0));
 SELECT * INTO receipt FROM public.character_activity_events WHERE operation_id=p_operation_id;
 IF FOUND THEN IF receipt.author_id<>auth.uid() OR receipt.request_hash<>fingerprint THEN RAISE EXCEPTION 'Operação reutilizada.' USING ERRCODE='23505'; END IF; RETURN receipt; END IF;
 SELECT * INTO e FROM public.character_activity_events WHERE id=(p_request->>'explosionId')::uuid AND character_id=p_character_id AND payload->>'kind' IN ('fragmentation_throw','explosive_event') FOR UPDATE;
 IF NOT FOUND OR e.payload->'areaConfirmed' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'Confirme primeiro a área.' USING ERRCODE='55004'; END IF;
 SELECT * INTO t FROM public.fragmentation_target_resolutions WHERE explosion_id=e.id AND target_id=(p_request->>'targetId')::uuid FOR UPDATE;
 IF NOT FOUND OR t.excluded OR t.applied_event_id IS NOT NULL THEN RAISE EXCEPTION 'Alvo excluído, ausente ou já resolvido.' USING ERRCODE='55004'; END IF;
 SELECT * INTO c FROM public.characters WHERE id=t.target_id FOR UPDATE;
 IF p_request->'expectedConditions' IS DISTINCT FROM c.conditions THEN RAISE EXCEPTION 'Condições mudaram. Atualize.' USING ERRCODE='40001'; END IF;
 IF c.hp_current<>(p_request->>'expectedHp')::integer THEN RAISE EXCEPTION 'PV mudou. Atualize antes de aplicar.' USING ERRCODE='40001'; END IF;
 kind:=coalesce(e.payload->>'explosiveType','fragmentation');
 IF coalesce(e.payload->>'stage','active')<>'active' OR (kind IN ('smoke','stun') AND (e.payload->>'remainingRounds')::integer<=0) THEN
 RAISE EXCEPTION 'Efeito encerrado ou mina não detonada.' USING ERRCODE='55004'; END IF;
 IF (p_request ? 'immuneDamage' AND jsonb_typeof(p_request->'immuneDamage')<>'boolean') OR (p_request ? 'immuneEffect' AND jsonb_typeof(p_request->'immuneEffect')<>'boolean') THEN
 RAISE EXCEPTION 'Imunidade inválida.' USING ERRCODE='22023'; END IF;
 immune_damage:=coalesce((p_request->>'immuneDamage')::boolean,false); immune_effect:=coalesce((p_request->>'immuneEffect')::boolean,false);
 test:=(p_request->>'resistanceTotal')::integer; rd:=(p_request->>'damageReduction')::integer;
 passed:=CASE WHEN kind='smoke' THEN false ELSE test>=(e.payload->>'dt')::integer END;
 damage:=(e.payload->'result'->>'total')::integer;
 IF passed THEN damage:=floor(damage/2.0)::integer; END IF;
 damage:=CASE WHEN immune_damage THEN 0 ELSE greatest(0,damage-rd) END;
 ids:=CASE WHEN immune_effect THEN ARRAY[]::text[] WHEN kind='incendiary' AND NOT passed THEN ARRAY['em_chamas'] WHEN kind='stun' THEN CASE WHEN passed THEN ARRAY['ofuscado','surdo'] ELSE ARRAY['atordoado'] END WHEN kind='smoke' THEN ARRAY['cego','camuflagem-total'] ELSE ARRAY[]::text[] END;
 next_conditions:=public.explosive_conditions(c.conditions,e.id,ids);
 temp:=public.consume_temporary_resource(c.id,'hp',damage,CASE WHEN kind='incendiary' THEN 'Fogo' ELSE 'Perfuração' END);
 hp:=greatest(0,c.hp_current-damage+temp);
 UPDATE public.characters SET hp_current=hp,conditions=next_conditions WHERE id=c.id;
 application_payload:=jsonb_build_object('kind','explosive_application','explosiveType',kind,'immuneDamage',immune_damage,'immuneEffect',immune_effect,'addedConditions',to_jsonb(ids),'explosionId',e.id,'targetName',c.name,'targetId',c.id,
 'resistanceTotal',test,'dt',(e.payload->>'dt')::integer,'passed',passed,'declaredDamageReduction',rd,
 'damage',damage,'temporaryHPUsed',temp,'hpBefore',c.hp_current,'hpAfter',hp);
 IF c.id<>p_character_id THEN
  INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
  VALUES(target_event,target_event,c.id,auth.uid(),'application','confirmed',application_payload,fingerprint);
 ELSE target_event:=p_operation_id; END IF;
 INSERT INTO public.character_activity_events(id,operation_id,character_id,author_id,category,status,payload,request_hash)
 VALUES(p_operation_id,p_operation_id,p_character_id,auth.uid(),'application','confirmed',application_payload,fingerprint) RETURNING * INTO receipt;
 UPDATE public.fragmentation_target_resolutions SET applied_event_id=target_event,effect_conditions=ids,active=cardinality(ids)>0 WHERE explosion_id=e.id AND target_id=c.id;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.get_character_explosives(uuid,integer),public.confirm_character_explosive_targets(uuid,uuid,jsonb),public.confirm_character_explosive_effect(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_character_explosives(uuid,integer),public.confirm_character_explosive_targets(uuid,uuid,jsonb),public.confirm_character_explosive_effect(uuid,uuid,jsonb) TO authenticated;
