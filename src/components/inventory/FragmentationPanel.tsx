import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFragmentationContext, type FragmentationExplosion, type FragmentationTarget } from '@/hooks/useFragmentationContext';
import { useItemSituationalAction } from '@/hooks/useItemSituationalAction';
import { describeCharacterActivity } from '@/lib/character-activity-presentation';
import type { Json } from '@/integrations/supabase/types';

interface Item { id?: string; name: string; catalogId?: string; catalogType?: string; quantity?: number; uses?: number }
interface FreezeProps { blocked?: boolean; onFreeze?: (id: string, frozen: boolean) => void }
interface Props extends FreezeProps { characterId: string; inventory: Item[]; onRefetch: () => unknown | Promise<unknown> }
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
  const state = useItemSituationalAction(characterId, onRefetch, 'confirm_character_fragmentation_throw');
  useActionFreeze('throw', state, onFreeze);
  const items = inventory.filter(item => item.catalogId === 'granada_fragmentacao' && item.catalogType === 'explosivo' && (item.quantity ?? 1) > 0 && (item.uses ?? 1) > 0);
  const item = items.find(entry => entry.id === itemId); const frozen = !!blocked || state.busy || state.uncertain;
  if (!items.length && !state.receipt && !state.uncertain && !state.busy) return null;
  return <><fieldset disabled={frozen} className="space-y-3">
    <Label htmlFor={`grenade-${characterId}`}>Granada de Fragmentação</Label>
    <select id={`grenade-${characterId}`} className="w-full rounded border border-border bg-background p-2" value={itemId} onChange={e => { setItemId(e.target.value); setConfirmed(false); }}>
      <option value="">Escolha a granada</option>{items.map(entry => <option key={entry.id} value={entry.id}>{entry.name} · {entry.quantity ?? 1} unidade(s)</option>)}
    </select>
    <Label htmlFor={`impact-${characterId}`}>Ponto de impacto</Label>
    <Input id={`impact-${characterId}`} value={point} maxLength={240} onChange={e => { setPoint(e.target.value); setConfirmed(false); }} placeholder="Descreva o ponto em alcance médio" />
    <p className="text-sm">Ação padrão · alcance médio · raio 6 m · 8d6 de perfuração. Sem teste de ataque ou crítico. Reflexos reduz à metade.</p>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Conferi empunhadura, ação disponível e ponto em alcance médio com a mesa.</label>
    <Button className="h-auto w-full whitespace-normal" disabled={frozen || !confirmed || !point.trim() || !item} onClick={() => item && void state.confirm({ item: JSON.parse(JSON.stringify(item)) as Json, point: point.trim(), requirementsConfirmed: true })}>Confirmar arremesso e consumir uma granada</Button>
  </fieldset><Receipt state={state} /></>;
}
function AreaForm({ characterId, explosion, candidates, onRefetch, blocked, onFreeze }: { characterId: string; explosion: FragmentationExplosion; candidates: FragmentationTarget[]; onRefetch: Props['onRefetch'] } & FreezeProps) {
  const [choices, setChoices] = useState<Record<string, 'affected' | 'excluded'>>({}); const [confirmed, setConfirmed] = useState(false);
  const state = useItemSituationalAction(characterId, onRefetch, 'confirm_character_fragmentation_targets');
  useActionFreeze('area', state, onFreeze);
  const frozen = !!blocked || state.busy || state.uncertain; const exclusions = Object.values(choices).filter(value => value === 'excluded').length;
  return <div className="space-y-3"><fieldset disabled={frozen} className="space-y-2">
    <p className="text-sm">Mestre: confirme todos os seres na área. Exclusões de Perito: {exclusions}/{explosion.payload.maxExcludedTargets}. A lista fica fixa após confirmação.</p>
    {candidates.map(target => <label key={target.id} className="flex flex-wrap items-center justify-between gap-2"><span>{target.name}</span><select aria-label={`Área para ${target.name}`} className="rounded border bg-background p-2" value={choices[target.id] ?? 'outside'} onChange={e => { const value = e.target.value; setChoices(previous => { const next = { ...previous }; if (value === 'outside') delete next[target.id]; else next[target.id] = value as 'affected' | 'excluded'; return next; }); setConfirmed(false); }}>
      <option value="outside">Fora da área</option><option value="affected">Afetado</option><option value="excluded">Excluído por Perito</option></select></label>)}
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Conferi a área de 6 m, todos os alvos e as exclusões.</label>
    <Button disabled={frozen || !confirmed || exclusions > explosion.payload.maxExcludedTargets} onClick={() => void state.confirm({ explosionId: explosion.id, requirementsConfirmed: true, targets: Object.entries(choices).map(([id, value]) => ({ id, excluded: value === 'excluded' })) })}>Confirmar alvos no servidor</Button>
    </fieldset><Receipt state={state} /></div>;
}
function TargetForm({ characterId, explosion, target, onRefetch, blocked, onFreeze }: { characterId: string; explosion: FragmentationExplosion; target: FragmentationTarget; onRefetch: Props['onRefetch'] } & FreezeProps) {
  const [total, setTotal] = useState(''); const [rd, setRd] = useState('0'); const [confirmed, setConfirmed] = useState(false);
  const state = useItemSituationalAction(characterId, onRefetch, 'confirm_character_fragmentation_damage');
  useActionFreeze(`target-${target.id}`, state, onFreeze);
  const frozen = !!blocked || state.busy || state.uncertain;
  if (target.excluded || target.applied) return <p>{target.name}: {target.excluded ? 'excluído por Perito' : 'dano confirmado no servidor'}.</p>;
  const valid = /^-?\d{1,3}$/.test(total) && /^\d{1,3}$/.test(rd);
  const damage = valid ? Math.max(0, (Number(total) >= explosion.payload.dt ? Math.floor(explosion.payload.result.total / 2) : explosion.payload.result.total) - Number(rd)) : null;
  return <div className="space-y-2 rounded border border-border p-3"><h4 className="font-semibold">{target.name} · Reflexos pendente</h4>
    <fieldset disabled={frozen} className="space-y-2">
      <Label htmlFor={`reflex-${target.id}`}>Total de Reflexos conferido pelo mestre</Label><Input id={`reflex-${target.id}`} type="number" value={total} onChange={e => { setTotal(e.target.value); setConfirmed(false); }} />
      <Label htmlFor={`rd-${target.id}`}>RD aplicável a perfuração, conferida pelo mestre</Label><Input id={`rd-${target.id}`} type="number" min={0} value={rd} onChange={e => { setRd(e.target.value); setConfirmed(false); }} />
      <p className="text-sm">DT {explosion.payload.dt} · PV atual {target.hp}{damage !== null ? ` · dano previsto ${damage}, antes de PV temporários` : ''}. Sucesso reduz à metade antes da RD.</p>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />Conferi Reflexos, bônus situacionais, RD, imunidades e aplicação neste alvo.</label>
      <Button className="h-auto w-full whitespace-normal" disabled={frozen || !confirmed || !valid} onClick={() => void state.confirm({ explosionId: explosion.id, targetId: target.id, resistanceTotal: Number(total), damageReduction: Number(rd), expectedHp: target.hp, requirementsConfirmed: true })}>Confirmar resistência e aplicar dano</Button>
    </fieldset><Receipt state={state} /></div>;
}
/** Fluxo compartilhado desktop/mobile; somente a resposta autenticada habilita controles do mestre. */
export function FragmentationPanel(props: Props) {
  const [page, setPage] = useState(0);
  const context = useFragmentationContext(props.characterId, page);
  const refresh = async () => { await context.refetch(); return props.onRefetch(); };
  const [explosionId, setExplosionId] = useState('');
  const [actionsFrozen, setActionsFrozen] = useState<Record<string, boolean>>({});
  const onFreeze = useCallback((id: string, frozen: boolean) => setActionsFrozen(previous => previous[id] === frozen ? previous : { ...previous, [id]: frozen }), []);
  const blocked = Object.values(actionsFrozen).some(Boolean);
  const wasVisible = useRef(false);
  const explosion = context.data?.explosions.find(entry => entry.id === explosionId);
  if (context.data?.explosions.length || props.inventory.some(item => item.catalogId === 'granada_fragmentacao') || context.error) wasVisible.current = true;
  if (!wasVisible.current) return null;
  return <section aria-label="Granada de Fragmentação" className="my-3 space-y-4 rounded-lg border border-border bg-card p-3 text-foreground">
    <h3 className="font-semibold">Granada de Fragmentação</h3><ThrowForm {...props} onRefetch={refresh} blocked={blocked} onFreeze={onFreeze} />
    {context.error && <p role="alert">{context.error.message}</p>}
    <Button variant="outline" disabled={blocked} onClick={() => void refresh()}>Atualizar explosões e alvos</Button>
    <div className="flex flex-wrap items-center gap-2"><Button variant="outline" disabled={blocked || page === 0} onClick={() => { setPage(page - 1); setExplosionId(''); }}>Página anterior</Button><span>Página {page + 1}</span><Button variant="outline" disabled={blocked || (context.data?.explosions.length ?? 0) < 30} onClick={() => { setPage(page + 1); setExplosionId(''); }}>Próxima página</Button></div>
    {!!context.data?.explosions.length && <><Label htmlFor={`explosion-${props.characterId}`}>Explosões registradas — 30 por página</Label>
      <select id={`explosion-${props.characterId}`} disabled={blocked} className="w-full rounded border bg-background p-2" value={explosionId} onChange={e => setExplosionId(e.target.value)}><option value="">Escolha uma explosão</option>{context.data.explosions.map(entry => <option key={entry.id} value={entry.id}>{entry.payload.point} · {entry.payload.result.total} de dano · DT {entry.payload.dt}</option>)}</select></>}
    {explosion && <><p>Dados [{explosion.payload.result.dice.join(', ')}] · {explosion.payload.result.total} de perfuração · raio 6 m · DT {explosion.payload.dt}.</p>
      {!context.data?.master ? <p>O mestre confirma os alvos e aplica o dano. Nenhum PV é alterado apenas pelo arremesso.</p> : !explosion.payload.areaConfirmed ? <AreaForm key={explosion.id} characterId={props.characterId} explosion={explosion} candidates={context.data.candidates} onRefetch={refresh} blocked={blocked} onFreeze={onFreeze} /> : <div className="space-y-2">{!explosion.targets.length && <p>Área confirmada sem alvos.</p>}{explosion.targets.map(target => <TargetForm key={`${explosion.id}-${target.id}`} characterId={props.characterId} explosion={explosion} target={target} onRefetch={refresh} blocked={blocked} onFreeze={onFreeze} />)}</div>}</>}
    <p className="text-xs text-muted-foreground">Livro Base pp.30, 64 e 78. Posições, Reflexos e RD são conferidos pela mesa, sem detecção automática pelo mapa. Este fluxo aplica dano em fichas da campanha; criaturas sem ficha exigem resolução manual. Condições de queda a 0 PV exigem conferência.</p>
  </section>;
}
