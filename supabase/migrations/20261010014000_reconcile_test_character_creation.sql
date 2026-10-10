-- Revisão autorizada das fichas de teste existentes. Preserva dados e escolhas não recuperáveis.
BEGIN;
CREATE TABLE IF NOT EXISTS public.character_creation_backups (
  character_id uuid PRIMARY KEY,
  snapshot jsonb NOT NULL,
  sanity_loss_snapshot jsonb,
  saved_at timestamptz NOT NULL DEFAULT now(),
  reconciled_at timestamptz
);
ALTER TABLE public.character_creation_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.character_creation_backups FROM PUBLIC,anon,authenticated;

INSERT INTO public.character_creation_backups(character_id,snapshot,sanity_loss_snapshot)
SELECT c.id,to_jsonb(c),to_jsonb(ledger)
FROM public.characters c LEFT JOIN public.character_paranormal_san_losses ledger ON ledger.character_id=c.id
WHERE c.creation_data IS NULL
ON CONFLICT(character_id) DO NOTHING;

-- Normalização limitada a identificadores conhecidos; nomes personalizados continuam preservados.
CREATE OR REPLACE FUNCTION public.creation_identifier(p_value text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT replace(translate(lower(coalesce(p_value,'')),'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc'),' ','-')
$$;

DO $$
<<reconciliation>>
DECLARE
 c public.characters; cat jsonb:=public.character_creation_catalog(); cls jsonb; ori jsonb; track jsonb;
 origin_id text; track_id text; issues jsonb; abilities jsonb; paranormal jsonb; existing jsonb; known jsonb;
 proficiencies jsonb; powers jsonb; skill text; source text; key text; choices jsonb; hp integer; pe integer; san integer;
 lev integer; transcends integer; recorded_paranormal integer; loss integer; effective_san integer; hp_spent integer; pe_spent integer; san_spent integer;
 valid_nex boolean; valid_attrs boolean; new_hp integer; new_pe integer; new_san integer;
BEGIN
 FOR c IN SELECT ch.* FROM public.characters ch JOIN public.character_creation_backups b ON b.character_id=ch.id WHERE b.reconciled_at IS NULL FOR UPDATE OF ch LOOP
  issues:='["A criação antiga não registrou a origem de todas as escolhas; revise com o mestre antes de usar como ficha homologada."]';
  origin_id:=public.creation_identifier(c.origin); ori:=cat->'origins'->origin_id;
  IF ori IS NULL THEN SELECT id,item INTO origin_id,ori FROM jsonb_each(cat->'origins') AS x(id,item) WHERE public.creation_identifier(item->>'name')=public.creation_identifier(c.origin) LIMIT 1; END IF;
  cls:=cat->'classes'->c.class; track_id:=public.creation_identifier(c.class_track); track:=cat->'tracks'->track_id;
  IF track IS NULL AND c.class_track IS NOT NULL THEN SELECT id,item INTO track_id,track FROM jsonb_each(cat->'tracks') AS x(id,item) WHERE public.creation_identifier(item->>'name')=public.creation_identifier(c.class_track) LIMIT 1; END IF;
  IF ori IS NULL THEN issues:=issues || '["Origem fora do Livro Base ou sem identificação recuperável."]'; END IF;
  valid_nex:=c.nex=99 OR c.nex BETWEEN 5 AND 95 AND c.nex%5=0;
  IF NOT valid_nex THEN issues:=issues || '["NEX precisa ser ajustado para um patamar do Livro Base; nenhum patamar foi escolhido automaticamente."]'; END IF;
  lev:=CASE WHEN c.nex=99 THEN 20 ELSE greatest(1,c.nex/5) END;
  valid_attrs:=c.agility+c.strength+c.intellect+c.presence+c.vigor=9+(CASE WHEN c.nex>=20 THEN 1 ELSE 0 END)+(CASE WHEN c.nex>=50 THEN 1 ELSE 0 END)+(CASE WHEN c.nex>=80 THEN 1 ELSE 0 END)+(CASE WHEN c.nex>=95 THEN 1 ELSE 0 END);
  IF NOT valid_attrs THEN issues:=issues || '["A distribuição dos atributos precisa de revisão; os valores existentes foram preservados."]'; END IF;
  IF c.nex>=10 AND (track IS NULL OR track->>'classId'<>c.class) THEN issues:=issues || '["Escolha uma trilha da classe."]'; END IF;
  abilities:='[]';
  FOR existing IN SELECT jsonb_array_elements(coalesce(c.abilities,'[]')) LOOP
   known:=cat->'powers'->(existing #>> '{}');
   abilities:=abilities || jsonb_build_array(CASE WHEN known->>'classId'=c.class THEN known->>'name' ELSE existing #>> '{}' END);
  END LOOP;
  IF valid_nex AND cls IS NOT NULL THEN
   FOR source IN SELECT jsonb_array_elements_text(cls->'core'->c.nex::text) LOOP IF NOT abilities ? source THEN abilities:=abilities || jsonb_build_array(source); END IF; END LOOP;
  END IF;
  IF track->>'classId'=c.class THEN
   FOR known IN SELECT item FROM jsonb_array_elements(track->'abilities') AS x(item) WHERE (item->>'minNex')::integer<=c.nex LOOP IF NOT abilities ? (known->>'name') THEN abilities:=abilities || jsonb_build_array(known->>'name'); END IF; END LOOP;
  END IF;
  paranormal:='[]';
  FOR existing IN SELECT jsonb_array_elements(coalesce(c.paranormal_powers,'[]')) LOOP
   known:=cat->'paranormal'->(existing->>'id');
   IF known IS NULL THEN SELECT item INTO known FROM jsonb_each(cat->'paranormal') AS x(id,item) WHERE public.creation_identifier(item->>'name')=public.creation_identifier(coalesce(existing->>'name',existing #>> '{}')) LIMIT 1; END IF;
   IF known IS NULL THEN paranormal:=paranormal || jsonb_build_array(existing); issues:=issues || '["Poder paranormal não reconhecido preservado para revisão."]'; CONTINUE; END IF;
   choices:=existing->'choices'; source:=known->>'element';
   IF known->>'choice'='ritual' THEN
    source:=cat->'rituals'->(choices->>'ritualId')->>'element';
    IF source IS NULL THEN issues:=issues || '["Aprender Ritual: a escolha do ritual não foi registrada."]'; END IF;
   ELSIF known->>'choice'='element_resistance' THEN
    source:=choices->>'resistElement';
    IF source NOT IN ('sangue','morte','conhecimento','energia') OR source IS NULL THEN issues:=issues || '["Resistir a Elemento: escolha o elemento."]'; END IF;
   ELSIF known->>'id'='expansao-de-conhecimento' AND coalesce(jsonb_array_length(choices->'classPowerIds'),0)=0 THEN issues:=issues || '["Expansão de Conhecimento: escolha o poder concedido."]'; END IF;
   paranormal:=paranormal || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object('id',known->>'id','name',known->>'name','description',known->>'description','element',coalesce(source,known->>'element'),'choices',choices)));
  END LOOP;
  SELECT count(*) INTO transcends FROM jsonb_array_elements_text(abilities) AS x(name) WHERE public.creation_identifier(name) LIKE 'transcender%';
  recorded_paranormal:=jsonb_array_length(paranormal)-(CASE WHEN origin_id='cultista-arrependido' THEN 1 ELSE 0 END);
  IF transcends>recorded_paranormal THEN issues:=issues || '["Transcender: há aquisições sem um poder paranormal registrado."]'; END IF;
  IF origin_id='cultista-arrependido' AND jsonb_array_length(paranormal)=0 THEN issues:=issues || '["Cultista Arrependido: escolha o poder paranormal da origem."]'; END IF;
  IF c.class='Especialista' AND NOT EXISTS(SELECT 1 FROM jsonb_each(coalesce(c.class_power_choices,'{}')) AS x(key,item) WHERE item->>'powerId'='perito' AND jsonb_array_length(item->'chosenValues')=2) THEN issues:=issues || '["Perito: escolha duas perícias treinadas, exceto Luta e Pontaria."]'; END IF;
  IF origin_id='amnesico' THEN issues:=issues || '["Amnésico: confirme com o mestre quais duas perícias vieram da origem."]'; END IF;
  IF c.nex>=35 AND coalesce(jsonb_array_length(c.training_grade_choices->'nex35'),0)=0 THEN issues:=issues || '["Registre os aumentos de grau de NEX 35%."]'; END IF;
  IF c.nex>=70 AND coalesce(jsonb_array_length(c.training_grade_choices->'nex70'),0)=0 THEN issues:=issues || '["Registre os aumentos de grau de NEX 70%."]'; END IF;
  IF c.nex>=50 AND c.versatility_track IS NULL THEN issues:=issues || '["Confirme a escolha de Versatilidade: poder de classe ou outra trilha."]'; END IF;
  IF track_id IN ('graduado','lamina-paranormal') THEN issues:=issues || '["Rituais extras da trilha: confira quais foram aprendidos por cada fonte."]'; END IF;
  FOR key,known IN SELECT * FROM jsonb_each(cat->'powers') WHERE value->'choice' IS NOT NULL LOOP
   IF abilities ? (known->>'name') AND NOT EXISTS(SELECT 1 FROM jsonb_each(coalesce(c.class_power_choices,'{}')) AS x(key,item) WHERE item->>'powerId'=known->>'id' AND jsonb_array_length(item->'chosenValues')=coalesce((known->'choice'->>'count')::integer,1)) THEN issues:=issues || jsonb_build_array((known->>'name')||': complete a escolha adicional.'); END IF;
  END LOOP;
  IF origin_id IN ('engenheiro','operario') OR track_id='aniquilador' THEN
   key:=CASE WHEN origin_id='engenheiro' THEN 'ferramenta-favorita' WHEN origin_id='operario' THEN 'ferramenta-de-trabalho' ELSE 'a-favorita' END;
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(c.inventory) AS x(item) WHERE item->>'favoriteAbilityId'=key OR key='a-favorita' AND item->>'favoriteAbilityId' IN ('tecnica-secreta','maquina-de-matar')) THEN issues:=issues || '["Vincule o equipamento ao benefício da origem ou trilha."]'; END IF;
  END IF;
  proficiencies:=coalesce(c.proficiencies,'[]');
  FOR source IN SELECT jsonb_array_elements_text(coalesce(cls->'proficiencies','[]')) LOOP IF NOT proficiencies ? source THEN proficiencies:=proficiencies || jsonb_build_array(source); END IF; END LOOP;
  powers:=c.powers;
  IF ori IS NOT NULL THEN
   FOR source IN SELECT jsonb_array_elements_text(ori->'powers') LOOP
    SELECT coalesce(jsonb_agg(CASE WHEN item->>'name'=source THEN item || jsonb_build_object('description',ori->>'powerDescription') ELSE item END),'[]') INTO powers FROM jsonb_array_elements(powers) AS x(item);
    IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(powers) AS x(item) WHERE item->>'name'=source) THEN powers:=powers || jsonb_build_array(jsonb_build_object('name',source,'description',ori->>'powerDescription')); END IF;
   END LOOP;
  END IF;
  hp:=c.hp_max;pe:=c.pe_max;san:=c.san_max;
  SELECT coalesce(l.loss,0) INTO loss FROM (SELECT 1) d LEFT JOIN public.character_paranormal_san_losses l ON l.character_id=c.id;
  IF valid_nex AND cls IS NOT NULL THEN
   hp:=(cls->>'hp')::integer+c.vigor+(lev-1)*((cls->>'hpGain')::integer+c.vigor)+(CASE WHEN origin_id='desgarrado' THEN lev ELSE 0 END)+(CASE WHEN c.nex>=10 AND (track_id='tropa-choque' OR c.versatility_track->>'trackId'='tropa-choque') THEN lev ELSE 0 END);
   pe:=(cls->>'pe')::integer+c.presence+(lev-1)*((cls->>'peGain')::integer+c.presence)+(CASE WHEN origin_id='universitario' THEN 1+(lev-1)/2 ELSE 0 END);
   -- Se faltam aquisições, não estima a penalidade de SAN nem inventa poderes.
   IF transcends>=recorded_paranormal THEN san:=greatest(0,(cls->>'san')::integer+(lev-1-transcends)*(cls->>'sanGain')::integer+(CASE WHEN origin_id='vitima' THEN lev WHEN origin_id='cultista-arrependido' THEN -((cls->>'san')::integer/2) ELSE 0 END)-loss);
   ELSE issues:=issues || '["Sanidade: confirme quantas vezes Transcender foi adquirido antes de recalcular a progressão."]'; END IF;
  END IF;
  hp_spent:=greatest(0,c.hp_max-c.hp_current);pe_spent:=greatest(0,c.pe_max-c.pe_current);san_spent:=greatest(0,c.san_max-c.san_current);
  new_hp:=greatest(0,hp-hp_spent);new_pe:=greatest(0,pe-pe_spent);new_san:=greatest(0,san-san_spent);
  -- Sincroniza o máximo efetivo antes da escrita: o gatilho não desconta a mesma perda duas vezes.
  UPDATE public.character_paranormal_san_losses SET effective_max=san WHERE character_id=c.id;
  UPDATE public.characters SET origin=CASE WHEN ori IS NOT NULL THEN origin_id ELSE c.origin END,class_track=CASE WHEN track IS NOT NULL THEN track_id ELSE c.class_track END,abilities=reconciliation.abilities,powers=reconciliation.powers,proficiencies=reconciliation.proficiencies,paranormal_powers=paranormal,
   hp_max=hp,hp_current=new_hp,pe_max=pe,pe_current=new_pe,san_max=san,san_current=new_san,movement=9,defense=10+c.agility,creation_review=issues
  WHERE id=c.id;
  UPDATE public.character_creation_backups SET reconciled_at=now() WHERE character_id=c.id;
 END LOOP;
END $$;
COMMIT;
