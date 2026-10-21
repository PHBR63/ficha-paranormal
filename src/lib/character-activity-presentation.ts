import type { CharacterActivityEvent } from '@/types/character-activity';
import type { Json } from '@/integrations/supabase/types';
import { resolveConditionId } from '@/lib/conditions/condition-identity';
import { RITUAL_END_REASONS } from '@/lib/rituals/ritual-ending';
import { getRitualById } from '@/lib/rituals/ritual-registry';
import { getExplosiveByType } from '@/lib/explosives';
import { describeConcealment, parseConcealmentResult } from '@/lib/attack-concealment';
import { parseSneakAttackResult } from '@/lib/sneak-attack-context';

/** Explica o orçamento salvo na operação, sem aplicar o estado atual a eventos antigos. */
function describePETurnBudget(value: Json | undefined): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  if (value.tracked === false) return ' · Sem controle de turnos ativo';
  if (value.tracked !== true || typeof value.spentAfter !== 'number') return '';
  const context = value.mode === 'manual' ? `Turno manual ${value.number}` : `Rodada ${value.round}`;
  return ` · ${context}: ${value.spentAfter} PE gastos${value.minimumCostException === true ? ' · Exceção do custo mínimo' : ''}`;
}

/** Exibe somente o consumo médico efetivamente confirmado pelo servidor. */
function describeMedicalAction(value: Json | undefined): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  if (value.tracked === false) return ' · Ação padrão declarada sem controle de turnos';
  if (value.tracked === true && typeof value.spentAfter === 'number')
    return ` · Ação padrão médica registrada (${value.spentAfter} usada(s) neste turno)`;
  return '';
}

/** Mostra somente a ação realmente reservada no turno pelo servidor. */
function describeCombatAction(value: Json | undefined): string {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.tracked !== true) return '';
  const label = { standard: 'padrão', movement: 'movimento', full: 'completa', reaction: 'reação' }[String(value.kind)];
  return label ? ` · Ação ${label} registrada no turno pelo servidor` : '';
}

/** Compara instâncias por identidade; aceita strings antigas e não inventa dados ausentes. */
function describeConditionChanges(before: Json | undefined, after: Json | undefined): string {
  if (!Array.isArray(before) || !Array.isArray(after)) return '';
  const entries = (values: Json[]) => values.flatMap(value => {
    const id = typeof value === 'string' ? value
      : value && typeof value === 'object' && !Array.isArray(value) && typeof value.id === 'string' ? value.id : undefined;
    if (!id) return [];
    const name = value && typeof value === 'object' && !Array.isArray(value) && typeof value.name === 'string' ? value.name : id;
    return [{ id: resolveConditionId(id), name }];
  });
  const removed = entries(before);
  const added = entries(after).filter(condition => {
    const index = removed.findIndex(previous => previous.id === condition.id);
    if (index < 0) return true;
    removed.splice(index, 1);
    return false;
  });
  const changes = [...added.map(condition => `+${condition.name}`), ...removed.map(condition => `−${condition.name}`)];
  return changes.length ? ` · Condições: ${changes.join('; ')}` : '';
}

/** Apresenta o payload sem inventar dados ausentes em registros antigos. */
export function describeCharacterActivity(event: CharacterActivityEvent): string {
  const payload = event.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'Registro sem detalhes';
  if (payload.kind === 'mirar') {
    const turn = payload.mode === 'manual' ? `no turno manual ${payload.turnNumber}`
      : payload.mode === 'untracked' ? 'sem controle de turnos' : `na rodada ${payload.round}`;
    const outcome = payload.dismissedAt ? 'preparo encerrado sem estorno'
      : payload.consumedByAttackId ? 'preparo consumido pelo próximo ataque' : 'próximo ataque no prazo';
    const review = payload.mode === 'untracked' ? 'alvo, alcance e prazo conferidos pela mesa'
      : 'alvo e alcance conferidos pela mesa';
    return `Mirar com ${payload.weaponName ?? 'arma equipada'} · ação de movimento registrada ${turn} · ${payload.peCost ?? 0} PE ${payload.lethalShotPrepaid === true ? 'gasto para Disparo Letal' : '(registro antigo, sem Disparo Letal pré-pago)'} · ${outcome}; ${review}${describeCombatAction(payload.combatAction)}`;
  }
  if (payload.kind === 'post_attack_stealth') {
    const result = payload.result;
    if (!result || typeof result !== 'object' || Array.isArray(result)) return 'Furtividade após ataque: registro incompleto; confira o histórico.';
    const dice = Array.isArray(result.dice) ? result.dice.join(', ') : '';
    return `Esconder-se após atacar com ${payload.itemName} · Ação livre no fim do turno declarado${payload.turnContext === 'attack_receipt' ? ' · Ataque com esta arma confirmado no turno pelo servidor' : ' · Ataque e turno confirmados pela mesa'} · Penalidade situacional −${payload.situationalDicePenalty}d20${payload.silencerApplied ? ' · Silenciador reduz dois dados' : ''}${payload.gatunoApplied ? ' · Gatuno remove a penalidade de movimento' : ''} · Dados [${dice}], ${result.isDisadvantage ? 'menor' : 'maior'} ${result.keptDice} · treino +${result.skillBonus} · equipamento +${result.equipmentBonus} · outros bônus declarados ${result.declaredOtherBonuses} → ${result.total} · Percepção oposta pendente por observador; ocultação não garantida · Sem gasto de PE`;
  }
  if (payload.kind === 'explosive_event') {
    const rule = getExplosiveByType(typeof payload.explosiveType === 'string' ? payload.explosiveType : undefined);
    const result = payload.result as { total?: number; dice?: number[] } | undefined;
    const install = payload.installation as { total?: number; dice?: number[]; passed?: boolean } | undefined;
    if (rule?.type === 'mine') return `Mina instalada em ${payload.point} · direção ${payload.direction} · Tática [${install?.dice?.join(', ') ?? ''}] → ${install?.total} / DT 15 · ${install?.passed ? `sucesso; Percepção DT ${install.total} para encontrar` : 'falha; inutilizada'} · 1 mina consumida · detonação registrada separadamente`;
    return `${rule?.name ?? 'Explosivo'} · ${payload.point} · raio 6 m · 1 unidade consumida${rule?.dice ? ` · [${result?.dice?.join(', ') ?? ''}] → ${result?.total} de ${rule.damage}` : ' · sem dano'}${payload.dt !== null ? ` · ${rule?.resistance} DT ${payload.dt}` : ' · sem resistência'}${rule?.rounds ? ` · duração ${rule.rounds} rodada(s), confirmada pelo mestre` : ''} · alvos/aplicações registrados separadamente`;
  }
  if (payload.kind === 'explosive_area') return `Área de ${getExplosiveByType(String(payload.explosiveType))?.name ?? 'explosivo'} confirmada pelo mestre · ${payload.targetCount} alvo(s) nesta confirmação, incluindo exclusões`;
  if (payload.kind === 'explosive_application') return `Explosivo em ${payload.targetName} · resistência declarada ${payload.resistanceTotal} / DT ${payload.dt ?? 'não se aplica'}${payload.dt !== null ? ` · ${payload.passed ? 'sucesso' : 'falha'}` : ''} · RD declarada ${payload.declaredDamageReduction} · imunidade ao dano ${payload.immuneDamage ? 'confirmada' : 'não declarada'} · imunidade aos efeitos ${payload.immuneEffect ? 'confirmada' : 'não declarada'} · dano ${payload.damage} · PV temporários usados ${payload.temporaryHPUsed} · PV ${payload.hpBefore} → ${payload.hpAfter} · condições ${Array.isArray(payload.addedConditions) && payload.addedConditions.length ? payload.addedConditions.join(', ') : 'nenhuma'} · confirmado pelo mestre`;
  if (payload.kind === 'explosive_control') {
    if (payload.action === 'detonate') return `Mina detonada · ação padrão e alcance longo declarados · 12d6 [${Array.isArray(payload.dice) ? payload.dice.join(', ') : ''}] → ${payload.total} de perfuração · sem segundo consumo`;
    if (payload.action === 'extinguish') return `Chamas apagadas em ${payload.targetName} · ${payload.method === 'water' ? 'imersão em água' : 'ação padrão com as mãos'} · sem teste inventado`;
    if (payload.action === 'leave') return `${payload.targetName} saiu da fumaça · encerradas somente condições desta fonte`;
    return `${payload.action === 'expired' ? 'Duração encerrada' : `Rodada confirmada · restam ${payload.remainingRounds} rodada(s)`} · ${payload.ended ? 'efeitos desta fonte encerrados' : 'efeitos continuam ativos'}`;
  }
  if (payload.kind === 'fragmentation_throw') {
    const result = payload.result as { total?: number; dice?: number[] } | undefined;
    return `Fragmentação · ${payload.point} · raio 6 m · dados [${result?.dice?.join(', ') ?? ''}] · ${result?.total} de perfuração · Reflexos DT ${payload.dt} reduz à metade · 1 granada consumida · alvos e aplicações conferidos separadamente pelo mestre`;
  }
  if (payload.kind === 'fragmentation_area') return `Fragmentação · área confirmada pelo mestre · ${payload.targetCount} alvo(s), incluindo exclusões · resistências e aplicações individuais`;
  if (payload.kind === 'fragmentation_damage') return `Fragmentação em ${payload.targetName} · Reflexos declarado ${payload.resistanceTotal} / DT ${payload.dt}: ${payload.passed ? 'sucesso, metade' : 'falha'} · RD declarada ${payload.declaredDamageReduction} · dano ${payload.damage} · PV temporários consumidos ${payload.temporaryHPUsed} · PV ${payload.hpBefore} → ${payload.hpAfter} · aplicado pelo mestre`;
  const peBudgetDetails = describePETurnBudget(payload.peBudget);
  const medicalActionDetails = describeMedicalAction(payload.medicalAction);
  const nested = payload.entry ?? payload.result;
  const result = nested && typeof nested === 'object' && !Array.isArray(nested) ? nested : payload;
  // O saldo normal pode ficar igual quando a fonte temporária absorve todo o gasto.
  const temporaryUsage = (resource: 'PV' | 'PE', value: Json | undefined) =>
    typeof value === 'number' && value > 0 ? ` · ${value} ${resource} temporários consumidos` : '';
  const temporaryPE = temporaryUsage('PE', payload.temporaryPEUsed);
  const temporaryHP = temporaryUsage('PV', payload.temporaryHPUsed);
  const label = typeof result.label === 'string' ? result.label : typeof payload.ritualName === 'string' ? payload.ritualName : typeof payload.label === 'string' ? payload.label : event.category === 'roll' ? 'Rolagem' : event.category === 'ritual' ? 'Conjuração' : 'Efeito';
  if (event.category === 'roll') {
    const total = typeof result.total === 'number' ? `: ${result.total}` : '';
    const dice = Array.isArray(result.dice) ? result.dice : Array.isArray(result.results) ? result.results : [];
    const kept = typeof result.keptDice === 'number' ? result.keptDice : result.bestResult;
    const skill = typeof result.skillBonus === 'number' ? result.skillBonus : undefined;
    const other = typeof result.otherBonuses === 'number' ? result.otherBonuses : undefined;
    const bonus = typeof result.bonus === 'number' ? result.bonus : undefined;
    const signed = (value: number) => value >= 0 ? `+${value}` : `${value}`;
    const selected = typeof result.diceMultiplier === 'number' && result.diceMultiplier !== 1 && dice.every(die => typeof die === 'number') ? `(${dice.join(' + ')}) × ${result.diceMultiplier}` : String(kept);
    const breakdown = typeof kept === 'number' ? ` · ${selected}${skill !== undefined ? ` ${signed(skill)} perícia` : ''}${other !== undefined ? ` ${signed(other)} outros bônus` : ''}${skill === undefined && bonus !== undefined ? ` ${signed(bonus)} bônus` : ''}` : '';
    const attackCost = payload.kind === 'combat_attack' && typeof payload.peCost === 'number'
      ? ` · Custo ${payload.peCost} PE · PE ${payload.peBefore} → ${payload.peAfter}${temporaryPE}${peBudgetDetails}` : '';
    const burst = payload.weaponBurst;
    const burstDetails = burst && typeof burst === 'object' && !Array.isArray(burst) && burst.enabled === true
      ? ` · Rajada: ${burst.compensated ? 'Compensador anula a penalidade' : '−1d20 no ataque'} · +1 dado da arma, multiplicado no crítico` : '';
    const itemDetails = payload.kind === 'item_action' ? ` · Ação ${payload.actionCost} · Maior bônus de equipamento +${result.equipmentBonus ?? 0} · Percepção oposta pendente; revista +10 ao observador · Requisitos declarados` : '';
    let concealmentDetails = '';
    let sneakDetails = '';
    let mirarDetails = '';
    if (payload.kind === 'combat_attack') {
      if (typeof payload.mirarOperationId === 'string') mirarDetails = ' · Disparo Letal: Mirar e próximo ataque conferidos no servidor';
      else if (payload.selection && typeof payload.selection === 'object' && !Array.isArray(payload.selection) && payload.selection.lethalShot === true) {
        mirarDetails = ' · Disparo Letal: Mirar declarado; confira o contexto da mesa';
      }
      try { concealmentDetails = payload.concealmentResult ? ` · ${describeConcealment(parseConcealmentResult(payload.concealmentResult))}` : ' · Camuflagem: resolução manual em registro anterior'; }
      catch { concealmentDetails = ' · Camuflagem: registro exige conferência'; }
      if (payload.sneakAttackResult) {
        try {
          const sneak = parseSneakAttackResult(payload.sneakAttackResult);
          const distance = { melee: 'corpo a corpo', short: 'curto', medium: 'médio', long: 'longo', extreme: 'extremo' }[sneak.range];
          sneakDetails = ` · Ataque Furtivo: alvo ${sneak.targetStatus === 'flanked' ? 'flanqueado' : 'desprevenido'} em alcance ${distance}${sneak.telescopicSightApplied ? ' · Mira Telescópica verificada' : ''} · ${sneak.applied ? 'acertou: 1 PE da habilidade cobrado' : 'não acertou: 0 PE da habilidade cobrado'} · ${!sneak.applied ? 'uso da rodada preservado' : sneak.roundLimitChecked ? 'limite da rodada conferido' : 'limite da rodada: conferência da mesa'} · Declaração do jogador; mestre pode revisar`;
        } catch { sneakDetails = ' · Ataque Furtivo: registro exige conferência'; }
      } else if (payload.selection && typeof payload.selection === 'object' && !Array.isArray(payload.selection) && payload.selection.sneakAttack === true) {
        sneakDetails = ' · Ataque Furtivo: contexto não verificado em registro anterior';
      }
    }
    const inspiration = payload.kind === 'inspirar_confianca_reroll'
      ? `Nova rolagem por Inspirar Confiança de ${payload.sourceName} · resultado anterior ${payload.originalTotal} → ${result.total}${payload.requiresReview === true ? ' · Acerto, camuflagem e efeitos dependem de revisão da mesa; dano e custos não repetidos' : ''} · ` : '';
    return `${inspiration}${label}${total}${dice.length ? ` · dados [${dice.join(', ')}]` : ''}${breakdown}${attackCost}${itemDetails}${burstDetails}${concealmentDetails}${sneakDetails}${mirarDetails}${describeCombatAction(payload.combatAction)}`;
  }
  if (event.category === 'ritual') {
    const preparation = payload.grimoirePreparation;
    const situationalDetails = payload.situationalResolution === 'server_checked'
      ? ` · Fonte: ${payload.castingSource === 'grimoire' ? 'Grimório Ritualístico' : 'memorizado'}${preparation && typeof preparation === 'object' && !Array.isArray(preparation) && preparation.readingConfirmed === true ? ' · Empunhar e consulta de ação completa declarados; consulta sem PE' : ''} · Execução: ${payload.execution}${payload.bladeExtraPE === 1 ? ' · Lâmina Maldita: +1 PE para movimento (incluído no total)' : ''}` : '';
    const cost = payload.paranormalCost;
    const costDetails = cost && typeof cost === 'object' && !Array.isArray(cost)
      ? ` · Custo do Paranormal: ${typeof cost.total === 'number' ? `Ocultismo ${cost.total} / DT ${cost.dt}` : cost.skipped ? 'não executado: concentração falhou' : 'Medo'} · SAN ${payload.sanBefore} → ${payload.sanAfter} · SAN máxima ${payload.sanMaxBefore} → ${payload.sanMaxAfter}` : '';
    const concentration = payload.concentration;
    const tests = concentration && typeof concentration === 'object' && !Array.isArray(concentration) && Array.isArray(concentration.tests)
      ? concentration.tests : [];
    const details = tests.map(test => test && typeof test === 'object' && !Array.isArray(test)
      ? `Vontade (${test.trigger}) · dados [${Array.isArray(test.dice) ? test.dice.join(', ') : 'conferir'}] · ${test.kept} + bônus ${test.bonus} = ${test.total} vs DT ${test.dt} · ${test.success ? 'sucesso' : 'falha'}${Array.isArray(test.bonuses) ? ` · Fontes: ${test.bonuses.map(source => source && typeof source === 'object' && !Array.isArray(source) ? `${source.name}: ${source.value}` : 'conferir').join('; ')}` : ''}` : 'Teste antigo: conferir').join('; ');
    return `${label}${typeof payload.peCost === 'number' ? ` · ${payload.peCost} PE` : ''}${typeof payload.peBefore === 'number' && typeof payload.peAfter === 'number' ? ` (${payload.peBefore} → ${payload.peAfter})` : ''}${temporaryPE}${situationalDetails}${details ? ` · ${details}` : ''}${payload.castingOutcome === 'failed_concentration' ? ' · Concentração falhou; efeitos bloqueados, sem estorno de PE' : ''}${costDetails}${peBudgetDetails}${describeCombatAction(payload.combatAction)}`;
  }
  if (payload.kind === 'ritual_knowledge') return `Conferência histórica do mestre · ${typeof payload.ritualId === 'string' ? getRitualById(payload.ritualId)?.name ?? 'Ritual legado' : 'Ritual'} · Fonte: ${payload.source === 'grimoire' ? 'Grimório Ritualístico' : 'memorizado'} · Conhecimento anterior à Lâmina Maldita: ${payload.knownBeforeBlade === true ? 'confirmado' : 'não confirmado'} · ${payload.note} · Sem gasto de PE ou SAN`;
  if (payload.kind === 'item_action') return `${payload.itemName} · ${payload.action === 'draw' ? 'Saque confirmado: arma equipada' : 'Guardar confirmado: arma desequipada'} · Ação ${payload.actionCost} · Requisitos declarados pela mesa · Sem gasto de PE`;
  if (payload.kind === 'accessory_review') return `${payload.itemName} · ${payload.action === 'review' ? (payload.enabled ? 'Benefício aprovado pelo mestre' : 'Aprovação revogada') : (payload.enabled ? 'Uso confirmado: empunhado / vestido' : 'Uso encerrado')} · ${payload.note || 'Sem gasto de PE ou SAN'}`;
  if (payload.kind === 'scene_expiry') return `Cena ${payload.sceneNumber} encerrada · ${payload.expiredEffectsCount} efeito(s) expirado(s)${describeConditionChanges((payload.before as { conditions?: Json })?.conditions, (payload.after as { conditions?: Json })?.conditions)}`;
  if (payload.kind === 'manual_turn') return `Turno manual confirmado: ${payload.turnBefore} → ${payload.turnAfter} · Sem gasto de PE`;
  if (payload.kind === 'manual_turn_pause') return `Controle manual pausado no turno ${payload.turnNumber} · Saldo e efeitos preservados`;
  if (payload.kind === 'estrategista') return `Estrategista · ${payload.targetCount} aliado(s): ${Array.isArray(payload.targetNames) ? payload.targetNames.join(', ') : 'nomes indisponíveis'} · Ação padrão e alcance ${payload.range} declarados · ${payload.peCost} PE (${payload.peBefore} → ${payload.peAfter})${temporaryPE}${peBudgetDetails} · +1 ação de movimento no próximo turno de cada alvo`;
  if (payload.kind === 'inspirar_confianca') return `Inspirar Confiança · ${payload.targetName}: ${payload.testLabel} ${payload.originalTotal} → ${payload.rerollTotal} · Reação e alcance ${payload.range} declarados · ${payload.peCost} PE (${payload.peBefore} → ${payload.peAfter})${temporaryPE}${peBudgetDetails}${payload.requiresReview === true ? ' · Efeitos do ataque exigem revisão da mesa' : ''}`;
  if (payload.kind === 'paramedico') return `Paramédico em ${payload.targetName} · ${payload.diceCount}d10 [${Array.isArray(payload.dice) ? payload.dice.join(' + ') : 'dados indisponíveis'}]${Number(payload.originBonus) > 0 ? ` + ${payload.originBonus} de Agente de Saúde` : ''} = ${payload.totalHealing} PV · Cura efetiva ${payload.effectiveHealing} PV (${payload.hpBefore} → ${payload.hpAfter}) · Ação padrão${payload.adjacencyConfirmed === true ? ' e adjacência declaradas' : ' declarada'}${medicalActionDetails} · ${payload.peCost} PE (${payload.peBefore} → ${payload.peAfter})${temporaryPE}${peBudgetDetails}`;
  if (payload.kind === 'paramedico_healing_received') return `Paramédico de ${payload.sourceName} · +${payload.healed} PV (${payload.hpBefore} → ${payload.hpAfter}) · Cura confirmada no servidor`;
  if (payload.kind === 'equipe_trauma') return `Equipe de Trauma em ${payload.targetName} · ${payload.conditionName} removida · Ação padrão e adjacência declaradas${medicalActionDetails} · ${payload.peCost} PE (${payload.peBefore} → ${payload.peAfter})${temporaryPE}${peBudgetDetails}`;
  if (payload.kind === 'equipe_trauma_received') return `Equipe de Trauma de ${payload.sourceName} · ${payload.conditionName ?? payload.conditionId} removida · Confirmado no servidor`;
  if (payload.kind === 'medical_extra_action') return `Ação padrão médica extra confirmada pelo mestre · Fonte: ${payload.sourceName} · Disponíveis após confirmação: ${payload.availableAfter} · Sem gasto de PE`;
  if (payload.kind === 'reanimacao_death') return `Morte de ${payload.targetName} confirmada pelo mestre na cena ${payload.sceneNumber} · ${payload.cause === 'massive_damage' ? 'Dano massivo: Reanimação indisponível' : 'Elegível para conferência de Reanimação'} · 0 PE`;
  if (payload.kind === 'reanimacao_death_received') return `Morte confirmada pelo mestre na cena ${payload.sceneNumber} · ${payload.cause === 'massive_damage' ? 'Dano massivo' : 'Sem dano massivo'} · 0 PE`;
  if (payload.kind === 'reanimacao') return `Reanimação em ${payload.targetName} · Cena ${payload.sceneNumber} · PV ${payload.hpBefore} → 1 (regra desta mesa) · Ação completa declarada · ${payload.peCost} PE (${payload.peBefore} → ${payload.peAfter})${temporaryPE}${peBudgetDetails}`;
  if (payload.kind === 'reanimacao_received') return `Reanimação de ${payload.sourceName} · PV ${payload.hpBefore} → 1 (regra desta mesa) · Condições derivadas de zero PV encerradas · Confirmado no servidor`;
  if (payload.kind === 'campaign_bulk_damage') return `Dano em área de ${payload.source ?? 'origem declarada'} · ${payload.grossDamage} de ${payload.damageType} · resistência declarada ${payload.declaredResistedDamage} · RD declarada ${payload.declaredDamageReduction} · imunidade ${payload.immuneDamage === true ? 'confirmada' : 'não declarada'} · dano após reduções ${payload.finalDamage} · PV temporários usados ${payload.temporaryHPUsed} · PV ${payload.hpBefore} → ${payload.hpAfter}${describeConditionChanges(payload.conditionsBefore, payload.conditionsAfter)} · confirmado pelo mestre no servidor`;
  if (payload.kind === 'special_defense') return `${{ bloqueio: 'Bloqueio', esquiva: 'Esquiva', contra_ataque: 'Contra-ataque' }[String(payload.defenseType)] ?? 'Defesa especial'} · registrada pelo mestre na rodada ${payload.round} · limite de uma defesa especial conferido no servidor · ${!payload.resolution || payload.resolution === 'mesa_pendente' ? 'aplicação no ataque pendente de resolução da mesa' : payload.timingVerifiedByServer === true ? 'defesa declarada antes da rolagem e vinculada ao ataque no servidor' : 'resultado revisado retrospectivamente pelo mestre; momento da declaração não verificado pelo servidor'}`;
  if (payload.kind === 'attack_target_received' || payload.kind === 'attack_target_resolved') return `${payload.kind === 'attack_target_received' ? 'Ataque recebido' : 'Ataque contra alvo resolvido'} · teste ${payload.attackTotal} / Defesa ${payload.defenseTotal}${payload.concealmentFailed === true ? ' · falha por camuflagem' : ''} · ${payload.hit === true ? 'acerto' : 'erro'} · dano ${payload.grossDamage} de ${payload.damageType} · resistência declarada ${payload.declaredResistedDamage} · RD declarada ${payload.declaredDamageReduction} · imunidade ${payload.immuneDamage === true ? 'confirmada' : 'não declarada'} · dano final ${payload.finalDamage} · PV temporários usados ${payload.temporaryHPUsed} · PV ${payload.hpBefore} → ${payload.hpAfter}${describeConditionChanges(payload.conditionsBefore, payload.conditionsAfter)} · resultado confirmado pelo mestre${payload.specialDefenseEventId ? payload.timingVerifiedByServer === true ? ' · defesa especial declarada antes da rolagem e vinculada no servidor' : ' · defesa especial revisada retrospectivamente, sem comprovação do momento da declaração' : ''}${payload.counterattackPending === true ? ' · contra-ataque pendente de resolução' : ''}`;
  if (payload.kind === 'resgate_movement') return `Resgate até ${payload.targetName} · Ação livre, alcance curto e deslocamento declarados · ${payload.mode === 'combat' ? 'Uso registrado na rodada' : payload.mode === 'manual' ? 'Turno manual registrado; rodada conferida pela mesa' : 'Rodada conferida pela mesa'}`;
  if (payload.kind === 'resgate_defense_review') return 'Resgate · mestre atribuiu uma cura ou remoção já confirmada ao médico · +5 Defesa para médico e aliado até o próximo turno do médico · Sem novo gasto de PE';
  if (payload.kind === 'resgate_defense_received') return 'Resgate · +5 Defesa recebido após cura ou remoção confirmada pelo mestre · Até o próximo turno do médico · Sem nova alteração de PV ou condição';
  if (payload.kind === 'estrategista_movement') return 'Estrategista · ação de movimento adicional usada no próximo turno declarado · Sem gasto de PE';
  if (payload.kind === 'estrategista_turn_review') return 'Estrategista · mestre confirmou o próximo turno após mudança da iniciativa · Concessão preservada · Sem novo gasto de PE';
  if (payload.kind === 'temporary_resource' || payload.kind === 'temporary_end') {
    const before = payload.before as { current?: number } | undefined;
    const after = payload.after as { current?: number } | undefined;
    return `${payload.kind === 'temporary_end' ? 'Fonte encerrada' : 'Recurso temporário confirmado'} · ${payload.sourceName} · ${payload.resource === 'hp' ? 'PV' : 'PE'} ${before?.current} → ${after?.current}`;
  }
  if (payload.kind === 'sustain_maintenance' || payload.kind === 'sustain_end') {
    const before = payload.before;
    const rituals = before && typeof before === 'object' && !Array.isArray(before) && Array.isArray(before.sustained_rituals)
      ? before.sustained_rituals : [];
    const names = rituals.map(ritual => ritual && typeof ritual === 'object' && !Array.isArray(ritual)
      ? String(ritual.ritual_name ?? ritual.ritual_id ?? 'Ritual') : 'Ritual').join(', ');
    const reason = payload.endReason;
    const reasonDetails = payload.kind === 'sustain_end' && reason && typeof reason === 'object' && !Array.isArray(reason)
      ? ` · Motivo informado: ${RITUAL_END_REASONS.find(entry => entry.kind === reason.kind)?.label ?? 'Conferência manual'}${typeof reason.note === 'string' && reason.note ? ` — ${reason.note}` : ''}` : '';
    const turn = payload.turn;
    const turnDetails = turn && typeof turn === 'object' && !Array.isArray(turn)
      ? turn.mode === 'manual' ? ` · Turno manual ${turn.number}` : ` · Cena ${turn.scene} · Rodada ${turn.round}` : '';
    return `${payload.kind === 'sustain_maintenance' ? 'Manutenção confirmada' : 'Sustentação encerrada'} · ${names} · Custo ${payload.peCost ?? 0} PE · PE ${payload.peBefore} → ${payload.peAfter}${temporaryPE}${turnDetails}${reasonDetails}${peBudgetDetails}`;
  }
  const kinds: Record<string, string> = { heal: 'Cura', damage: 'Dano', conditions: 'Condições adicionadas', replace_conditions: 'Condições alteradas', resource: 'Recurso alterado', resources: 'Recursos alterados', weapon_buff: 'Bônus de arma aplicado à ficha', sustain: 'Sustentação ativada' };
  const kind = typeof payload.kind === 'string' ? kinds[payload.kind] ?? 'Efeito registrado' : 'Efeito registrado';
  const resource = payload.resource === 'hp' ? 'PV' : payload.resource === 'pe' ? 'PE' : payload.resource === 'san' ? 'SAN' : '';
  const before = payload.before;
  const after = payload.after;
  const conditionChanges = before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)
    ? describeConditionChanges(before.conditions, after.conditions) : '';
  if (payload.kind === 'condition_turn') {
    const resolution = payload.resolution;
    const effects = resolution && typeof resolution === 'object' && !Array.isArray(resolution) && Array.isArray(resolution.effects)
      ? resolution.effects.filter(effect => effect && typeof effect === 'object' && !Array.isArray(effect)) : [];
    const details = effects.map(effect => typeof effect === 'object' && effect && !Array.isArray(effect)
      ? `${effect.label ?? 'Condição'}: dados [${Array.isArray(effect.dice) ? effect.dice.join(', ') : ''}], resultado ${effect.rolled}, final ${effect.finalAmount}` : '');
    const hp = before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)
      ? ` · PV ${before.hp_current} → ${after.hp_current}` : '';
    const tests = resolution && typeof resolution === 'object' && !Array.isArray(resolution) && Array.isArray(resolution.bleedingTests)
      ? resolution.bleedingTests.map(test => test && typeof test === 'object' && !Array.isArray(test)
        ? `Vigor: ${test.total} contra DT ${test.dt} (${test.passed ? 'sucesso' : 'falha'})` : '').filter(Boolean) : [];
    const notices = resolution && typeof resolution === 'object' && !Array.isArray(resolution) && Array.isArray(resolution.notices)
      ? resolution.notices.filter((notice): notice is string => typeof notice === 'string') : [];
    const turnDetails = [...tests, ...details, ...notices].join(' · ');
    return `Início de turno confirmado${hp}${temporaryHP}${turnDetails ? ` · ${turnDetails}` : ''}${conditionChanges}`;
  }
  if (before && after && typeof before === 'object' && typeof after === 'object' && !Array.isArray(before) && !Array.isArray(after)) {
    if (payload.kind === 'resources') {
      const changes = [['hp_current', 'PV'], ['pe_current', 'PE'], ['san_current', 'SAN']]
        .filter(([key]) => typeof before[key] === 'number' && typeof after[key] === 'number')
        .map(([key, name]) => `${name} ${before[key]} → ${after[key]}`);
      return `${kind} · ${changes.join(' · ')}${conditionChanges}`;
    }
    if (typeof before.hp_current === 'number' && typeof after.hp_current === 'number') return `${kind} · PV ${before.hp_current} → ${after.hp_current}${temporaryHP}${typeof payload.value === 'number' ? ` · quantidade ${payload.value}` : ''}${typeof before.age === 'number' && typeof after.age === 'number' ? ` · Idade ${before.age} → ${after.age}` : ''}${conditionChanges}`;
    if (typeof before.current === 'number' && typeof after.current === 'number') return `${kind} · ${resource} ${before.current} → ${after.current}${temporaryUsage(payload.resource === 'pe' ? 'PE' : 'PV', payload.temporaryUsed)}${conditionChanges}`;
    if (Array.isArray(before.conditions) && Array.isArray(after.conditions)) return `${kind} · ${before.conditions.length} → ${after.conditions.length} condição(ões)${conditionChanges}`;
  }
  return kind;
}
