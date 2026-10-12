import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFragmentationContext, type FragmentationExplosion, type FragmentationTarget } from '@/hooks/useFragmentationContext';
import { useItemSituationalAction } from '@/hooks/useItemSituationalAction';
import { describeCharacterActivity } from '@/lib/character-activity-presentation';
import type { Json } from '@/integrations/supabase/types';
import { getExplosive, getExplosiveByType } from '@/lib/explosives';

interface Item { id?: string; name: string; catalogId?: string; catalogType?: string; quantity?: number; uses?: number }
interface FreezeProps { blocked?: boolean; onFreeze?: (id: string, frozen: boolean) => void }
interface Props extends FreezeProps { characterId: string; inventory: Item[]; conditions?: Json; onRefetch: () => unknown | Promise<unknown> }
type ActionState = ReturnType<typeof useItemSituationalAction>;
/** Mantém o painel selecionado durante confirmação/recuperação sem perder a intenção. */
function useActionFreeze(id: string, state: ActionState, onFreeze?: FreezeProps['onFreeze']) {
  useEffect(() => {
    onFreeze?.(id, state.busy || state.uncertain);
    return () => onFreeze?.(id, false);
  }, [id, state.busy, state.uncertain, onFreeze]);
}
function Receipt({ state }: { state: ActionState }) {
  return <>{state.error && <p role="alert" className="text-red-300">{state.error}</p>}
    {state.receipt && <p role="status" className="break-words">{describeCharacterActivity(state.receipt)}</p>}
    {state.uncertain && <Button onClick={() => void state.recover()} disabled={state.busy}>Recuperar a mesma tentativa</Button>}</>;
}
/** Formulário não faz teste de ataque: ponto/empunhadura/ação são declarações, consumo exige recibo. */
function ThrowForm({ characterId, inventory, onRefetch, blocked, onFreeze }: Props) {
  const [itemId, setItemId] = useState(''); const [point, setPoint] = useState(''); const [confirmed, setConfirmed] = useState(false);
  const [direction, setDirection] = useState(''); const [bonus, setBonus] = useState('0'); const [penalty, setPenalty] = useState('0'); const [extra, setExtra] = useState('0');
  const state = useItemSituationalAction(characterId, onRefetch, 'confirm_character_explosive_action');
  useActionFreeze('throw', state, onFreeze);
  const items = inventory.filter(item => getExplosive(item.catalogId) && item.catalogType === 'explosivo' && (item.quantity ?? 1) > 0 && (item.uses ?? 1) > 0);
  const item = items.find(entry => entry.id === itemId); const frozen = !!blocked || state.busy || state.uncertain;
  const rule = getExplosive(item?.catalogId); const mine = rule?.type === 'mine';
  if (!items.length && !state.receipt && !state.uncertain && !state.busy) return null;
  return <><fieldset disabled={frozen} className="space-y-3">
    <Label htmlFor={`grenade-${characterId}`}>Explosivo</Label>
    <select id={`grenade-${characterId}`} className="w-full rounded border border-border bg-background p-2" value={itemId} onChange={e => { setItemId(e.target.value); setConfirmed(false); }}>
      <option value="">Escolha o explosivo</option>{items.map(entry => <option key={entry.id} value={entry.id}>{entry.name} · {entry.quantity ?? 1} unidade(s)</option>)}
    </select>
    <Label htmlFor={`impact-${characterId}`}>Ponto de impacto</Label>
    <Input id={`impact-${characterId}`} value={point} maxLength={240} onChange={e => { setPoint(e.target.value); setConfirmed(false); }} placeholder="Descreva o ponto em alcance médio" />
    {mine ? <div className="space-y-2"><p>Instalação: ação completa e Tática treinada DT 15. Consome a mina mesmo em falha. O servidor rola INT e treino real; confira os demais modificadores. Sucesso salva a DT para encontrar a mina.</p>
      <Label htmlFor={`direction-${characterId}`}>Direção do cone de 6 m</Label><Input id={`direction-${characterId}`} maxLength={240} value={direction} onChange={e => { setDirection(e.target.value); setConfirmed(false); }} />
      <Label htmlFor={`bonus-${characterId}`}>Outros bônus de Tática conferidos</Label><Input id={`bonus-${characterId}`} type="number" min={-100} max={100} value={bonus} onChange={e => { setBonus(e.target.value); setConfirmed(false); }} />
      <Label htmlFor={`penalty-${characterId}`}>Penalidades em d20 de Tática</Label><Input id={`penalty-${characterId}`} type="number" min={0} max={10} value={penalty} onChange={e => { setPenalty(e.target.value); setConfirmed(false); }} />
      <Label htmlFor={`extra-${characterId}`}>Dados adicionais de Tática</Label><Input id={`extra-${characterId}`} type="number" min={0} max={10} value={extra} onChange={e => { setExtra(e.target.value); setConfirmed(false); }} /></div>
      : <p className="text-sm">Ação padrão · alcance médio · raio 6 m · {rule?.dice ? `${rule.dice}d6 de ${rule.damage}` : 'sem dano'}. Sem teste de ataque ou crítico. {rule?.resistance ? `${rule.resistance} contra DT da ficha.` : 'Fumaça: cegueira e camuflagem total por 2 rodadas enquanto dentro.'}</p>}
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />{mine ? 'Conferi ação completa, posição, direção e modificadores de Tática com a mesa.' : 'Conferi empunhadura, ação disponível e ponto em alcance médio com a mesa.'}</label>
    <Button className="h-auto w-full whitespace-normal" disabled={frozen || !confirmed || !point.trim() || !item || (mine && (!direction.trim() || !/^-?\d{1,3}$/.test(bonus) || !/^\d{1,2}$/.test(penalty) || !/^\d{1,2}$/.test(extra)))} onClick={() => item && void state.confirm({ item: JSON.parse(JSON.stringify(item)) as Json, point: point.trim(), direction: direction.trim(), otherBonuses: Number(bonus), dicePenalty: Number(penalty), extraDice: Number(extra), requirementsConfirmed: true })}>{mine ? 'Instalar e consumir uma mina' : 'Confirmar arremesso e consumir uma granada'}</Button>
  </fieldset><Receipt state={state} /></>;
}
function AreaForm({ characterId, explosion, candidates, onRefetch, blocked, onFreeze }: { characterId: string; explosion: FragmentationExplosion; candidates: FragmentationTarget[]; onRefetch: Props['onRefetch'] } & FreezeProps) {
  const [choices, setChoices] = useState<Record<string, 'affected' | 'excluded'>>({}); const [confirmed, setConfirmed] = useState(false);
  const state = useItemSituationalAction(characterId, onRefetch, 'confirm_character_explosive_targets');
  useActionFreeze('area', state, onFreeze);
  const frozen = !!blocked || state.busy || state.uncertain; const exclusions = Object.values(choices).filter(value => value === 'excluded').length;
  return <div className="space-y-3"><fieldset disabled={frozen} className="space-y-2">
    <p className="text-sm">Mestre: confirme os seres no {explosion.payload.explosiveType === 'mine' ? 'cone de 6 m' : 'raio de 6 m'}. Exclusões de Perito: {exclusions}/{explosion.payload.maxExcludedTargets}. {explosion.payload.explosiveType === 'smoke' ? 'Confirme novas entradas durante a duração da fumaça.' : 'A lista fica fixa após confirmação.'}</p>
    {candidates.map(target => <label key={target.id} className="flex flex-wrap items-center justify-between gap-2"><span>{target.name}</span><select aria-label={`Área para ${target.name}`} className="rounded border bg-background p-2" value={choices[target.id] ?? 'outside'} onChange={e => { const value = e.target.value; setChoices(previous => { const next = { ...previous }; if (value === 'outside') delete next[target.id]; else next[target.id] = value as 'affected' | 'excluded'; return next; }); setConfirmed(false); }}>
      <option value="outside">Fora da área</option><option value="affected">Afetado</option><option value="excluded">Excluído por Perito</option></select></label>)}
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Conferi a área de 6 m, todos os alvos e as exclusões.</label>
    <Button disabled={frozen || !confirmed || exclusions > explosion.payload.maxExcludedTargets} onClick={() => void state.confirm({ explosionId: explosion.id, requirementsConfirmed: true, targets: Object.entries(choices).map(([id, value]) => ({ id, excluded: value === 'excluded' })) })}>Confirmar alvos no servidor</Button>
    </fieldset><Receipt state={state} /></div>;
}
function TargetForm({ characterId, explosion, target, onRefetch, blocked, onFreeze }: { characterId: string; explosion: FragmentationExplosion; target: FragmentationTarget; onRefetch: Props['onRefetch'] } & FreezeProps) {
  const [total, setTotal] = useState(''); const [rd, setRd] = useState('0'); const [confirmed, setConfirmed] = useState(false);
  const [immuneDamage, setImmuneDamage] = useState(false); const [immuneEffect, setImmuneEffect] = useState(false);
  useEffect(() => { setConfirmed(false); }, [target.applied]);
  const state = useItemSituationalAction(characterId, onRefetch, 'confirm_character_explosive_effect');
  useActionFreeze(`target-${target.id}`, state, onFreeze);
  const frozen = !!blocked || state.busy || state.uncertain;
  const rule = getExplosiveByType(explosion.payload.explosiveType)!; const smoke = rule.type === 'smoke';
  if (target.excluded || target.applied) return <div className="space-y-2"><p>{target.name}: {target.excluded ? 'excluído por Perito' : 'aplicação confirmada no servidor'}{target.active ? ' · condições desta fonte ativas' : ''}.</p>
    {target.active && (rule.type === 'smoke' || (rule.type === 'incendiary' && target.id !== characterId)) && <EffectControl characterId={characterId} explosion={explosion} target={target} onRefetch={onRefetch} blocked={blocked} onFreeze={onFreeze} />}</div>;
  const valid = (smoke || /^-?\d{1,3}$/.test(total)) && /^\d{1,3}$/.test(rd);
  const damage = valid ? (immuneDamage ? 0 : Math.max(0, (Number(total) >= (explosion.payload.dt ?? 0) ? Math.floor(explosion.payload.result.total / 2) : explosion.payload.result.total) - Number(rd))) : null;
  return <div className="space-y-2 rounded border border-border p-3"><h4 className="font-semibold">{target.name} · {smoke ? 'efeito' : rule.resistance} pendente</h4>
    <fieldset disabled={frozen} className="space-y-2">
      {!smoke && <><Label htmlFor={`reflex-${target.id}`}>Total de {rule.resistance} conferido pelo mestre</Label><Input id={`reflex-${target.id}`} type="number" value={total} onChange={e => { setTotal(e.target.value); setConfirmed(false); }} /></>}
      {!!rule.dice && <><Label htmlFor={`rd-${target.id}`}>RD aplicável a {rule.damage}, conferida pelo mestre</Label><Input id={`rd-${target.id}`} type="number" min={0} value={rd} onChange={e => { setRd(e.target.value); setConfirmed(false); }} />
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={immuneDamage} onChange={e => { setImmuneDamage(e.target.checked); setConfirmed(false); }} />Imunidade ao dano confirmada pelo mestre</label></>}
      {rule.type !== 'fragmentation' && rule.type !== 'mine' && <label className="flex gap-2 text-sm"><input type="checkbox" checked={immuneEffect} onChange={e => { setImmuneEffect(e.target.checked); setConfirmed(false); }} />Imunidade aos efeitos de condição confirmada pelo mestre</label>}
      <p className="text-sm">{smoke ? 'Sem resistência. Cego e camuflagem total enquanto na área.' : `DT ${explosion.payload.dt}`} · PV atual {target.hp}{damage !== null && rule.dice ? ` · dano previsto ${damage}, antes de PV temporários` : ''}. {rule.type === 'stun' ? 'Sucesso: Ofuscado e Surdo; falha: Atordoado. Duração 1 rodada.' : rule.type === 'incendiary' ? 'Sucesso reduz metade e evita chamas; falha aplica Em Chamas. Imunidade a dano e a condições são declarações separadas.' : rule.dice ? 'Sucesso reduz à metade antes da RD.' : ''}</p>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Conferi resistência, bônus, imunidades e aplicação neste alvo.</label>
      <Button className="h-auto w-full whitespace-normal" disabled={frozen || !confirmed || !valid} onClick={() => void state.confirm({ explosionId: explosion.id, targetId: target.id, resistanceTotal: smoke ? 0 : Number(total), damageReduction: rule.dice ? Number(rd) : 0, expectedHp: target.hp, expectedConditions: target.conditions ?? [], immuneDamage, immuneEffect, requirementsConfirmed: true })}>{rule.dice ? 'Confirmar resistência e aplicar dano' : 'Confirmar e aplicar condições'}</Button>
    </fieldset>{(state.error || state.uncertain || state.busy) && <Receipt state={state} />}</div>;
}
/** Encerramentos explícitos reutilizam o contrato idempotente e conservam a fonte no servidor. */
function EffectControl({ characterId, explosion, target, onRefetch, blocked, onFreeze }: { characterId: string; explosion?: FragmentationExplosion; target: FragmentationTarget; onRefetch: Props['onRefetch'] } & FreezeProps) {
  const state = useItemSituationalAction(characterId, onRefetch, 'confirm_character_explosive_control');
  const [confirmed, setConfirmed] = useState(false); const [method, setMethod] = useState('standard');
  useActionFreeze(`control-${explosion?.id ?? 'own'}-${target.id}`, state, onFreeze);
  const smoke = explosion?.payload.explosiveType === 'smoke'; const frozen = !!blocked || state.busy || state.uncertain;
  return <div className="space-y-2"><fieldset disabled={frozen} className="space-y-2">
    {smoke ? <p>Saída da fumaça encerra somente Cego/Camuflagem desta fonte.</p> : <><p>Em Chamas: 1d6 de fogo no início do turno. Use a resolução de início de turno em Condições; fontes duplicadas não multiplicam esse dano.</p><Label htmlFor={`extinguish-${target.id}`}>Forma de apagar o fogo</Label><select id={`extinguish-${target.id}`} className="w-full rounded border bg-background p-2" value={method} onChange={e => { setMethod(e.target.value); setConfirmed(false); }}><option value="standard">Ação padrão com as mãos</option><option value="water">Imersão em água</option></select></>}
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Conferi {smoke ? 'a saída do alvo da área' : 'a ação padrão disponível ou a imersão em água'} com a mesa.</label>
    <Button disabled={frozen || !confirmed} onClick={() => void state.confirm({ action: smoke ? 'leave' : 'extinguish', explosionId: explosion?.id ?? null, targetId: target.id, method, expectedConditions: target.conditions ?? [], requirementsConfirmed: true })}>{smoke ? 'Confirmar saída da fumaça' : 'Confirmar apagar chamas'}</Button></fieldset><Receipt state={state} /></div>;
}
function AreaControl({ characterId, explosion, onRefetch, blocked, onFreeze }: { characterId: string; explosion: FragmentationExplosion; onRefetch: Props['onRefetch'] } & FreezeProps) {
  const state = useItemSituationalAction(characterId, onRefetch, 'confirm_character_explosive_control'); const [confirmed, setConfirmed] = useState(false);
  useActionFreeze('area-control', state, onFreeze);
  const mine = explosion.payload.stage === 'installed'; const frozen = !!blocked || state.busy || state.uncertain;
  return <div className="space-y-2"><fieldset disabled={frozen} className="space-y-2"><p>{mine ? `Mina instalada · direção ${explosion.payload.direction}. Detonar: ação padrão em alcance longo; sem novo consumo.` : `Restam ${explosion.payload.remainingRounds} rodada(s). Confirme uma rodada transcorrida; não avança pelo relógio.`}</p>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />{mine ? 'Conferi a ação padrão e estar em alcance longo da mina.' : 'Conferi que uma rodada completa desta duração transcorreu.'}</label>
    <Button disabled={frozen || !confirmed} onClick={() => void state.confirm({ action: mine ? 'detonate' : 'advance', explosionId: explosion.id, expectedRounds: explosion.payload.remainingRounds ?? 0, requirementsConfirmed: true })}>{mine ? 'Confirmar detonação remota' : 'Confirmar passagem de uma rodada'}</Button></fieldset><Receipt state={state} /></div>;
}
/** Fluxo compartilhado desktop/mobile; somente a resposta autenticada habilita controles do mestre. */
export function ExplosivesPanel(props: Props) {
  const [page, setPage] = useState(0);
  const context = useFragmentationContext(props.characterId, page);
  const refresh = async () => { await context.refetch(); return props.onRefetch(); };
  const [explosionId, setExplosionId] = useState('');
  const [actionsFrozen, setActionsFrozen] = useState<Record<string, boolean>>({});
  const onFreeze = useCallback((id: string, frozen: boolean) => setActionsFrozen(previous => previous[id] === frozen ? previous : { ...previous, [id]: frozen }), []);
  const blocked = Object.values(actionsFrozen).some(Boolean);
  const wasVisible = useRef(false);
  const explosion = context.data?.explosions.find(entry => entry.id === explosionId);
  const ownFire = Array.isArray(props.conditions) && props.conditions.some(value => {
    const id = typeof value === 'string' ? value : value && typeof value === 'object' && !Array.isArray(value) ? value.id : '';
    return typeof id === 'string' && ['em_chamas','em-chamas','Em Chamas'].includes(id);
  });
  if (context.data?.explosions.length || props.inventory.some(item => getExplosive(item.catalogId)) || ownFire || context.error) wasVisible.current = true;
  if (!wasVisible.current) return null;
  return <section aria-label="Explosivos" className="my-3 space-y-4 rounded-lg border border-border bg-card p-3 text-foreground">
    <h3 className="font-semibold">Explosivos do Livro Base</h3><ThrowForm {...props} onRefetch={refresh} blocked={blocked} onFreeze={onFreeze} />
    {ownFire && <EffectControl characterId={props.characterId} target={{ id: props.characterId, name: 'Esta ficha', hp: 0, conditions: props.conditions }} onRefetch={refresh} blocked={blocked} onFreeze={onFreeze} />}
    {context.error && <p role="alert">{context.error.message}</p>}
    <Button variant="outline" disabled={blocked} onClick={() => void refresh()}>Atualizar explosões e alvos</Button>
    <div className="flex flex-wrap items-center gap-2"><Button variant="outline" disabled={blocked || page === 0} onClick={() => { setPage(page - 1); setExplosionId(''); }}>Página anterior</Button><span>Página {page + 1}</span><Button variant="outline" disabled={blocked || (context.data?.explosions.length ?? 0) < 30} onClick={() => { setPage(page + 1); setExplosionId(''); }}>Próxima página</Button></div>
    {!!context.data?.explosions.length && <><Label htmlFor={`explosion-${props.characterId}`}>Explosões registradas — 30 por página</Label>
      <select id={`explosion-${props.characterId}`} disabled={blocked} className="w-full rounded border bg-background p-2" value={explosionId} onChange={e => setExplosionId(e.target.value)}><option value="">Escolha uma explosão</option>{context.data.explosions.map(entry => <option key={entry.id} value={entry.id}>{entry.payload.point} · {entry.payload.result.total} de dano · DT {entry.payload.dt}</option>)}</select></>}
    {explosion && <><p>{getExplosiveByType(explosion.payload.explosiveType)?.name} · dados [{explosion.payload.result.dice.join(', ')}] · dano {explosion.payload.result.total} · {explosion.payload.explosiveType === 'mine' ? 'cone' : 'raio'} 6 m · {explosion.payload.dt === null ? 'sem resistência' : `DT ${explosion.payload.dt}`}.</p>
      {explosion.payload.installation && <p>Instalação Tática: [{explosion.payload.installation.dice.join(', ')}] → {explosion.payload.installation.total} / DT 15 · {explosion.payload.installation.passed ? `sucesso; Percepção DT ${explosion.payload.installation.total} para encontrar a mina` : 'falha; mina consumida e inutilizada'}.</p>}
      {explosion.payload.stage === 'installed' ? <AreaControl characterId={props.characterId} explosion={explosion} onRefetch={refresh} blocked={blocked} onFreeze={onFreeze} /> : ['failed','ended'].includes(explosion.payload.stage ?? '') ? <p>Efeito encerrado ou mina inutilizada; novas aplicações bloqueadas.</p> : !context.data?.master ? <p>O mestre confirma os alvos e aplica os efeitos. Nenhum PV é alterado apenas pelo arremesso.</p> : <>
        {['stun','smoke'].includes(explosion.payload.explosiveType ?? '') && <AreaControl characterId={props.characterId} explosion={explosion} onRefetch={refresh} blocked={blocked} onFreeze={onFreeze} />}
        {(!explosion.payload.areaConfirmed || explosion.payload.explosiveType === 'smoke') && <AreaForm key={explosion.id} characterId={props.characterId} explosion={explosion} candidates={context.data.candidates.filter(candidate => !explosion.targets.some(target => target.id === candidate.id && target.active))} onRefetch={refresh} blocked={blocked} onFreeze={onFreeze} />}
        {explosion.payload.areaConfirmed && <div className="space-y-2">{!explosion.targets.length && <p>Área confirmada sem alvos.</p>}{explosion.targets.map(target => <TargetForm key={`${explosion.id}-${target.id}`} characterId={props.characterId} explosion={explosion} target={target} onRefetch={refresh} blocked={blocked} onFreeze={onFreeze} />)}</div>}
      </>}</>}
    <p className="text-xs text-muted-foreground">Livro Base pp.30,64,78,310–311. Posições, resistências, RD e imunidades são conferidas pela mesa; sem leitura automática do mapa. Camuflagem total exige conferir 50% de chance de falha em ataques. Criaturas sem ficha e consequências de 0 PV continuam manuais.</p>
  </section>;
}
