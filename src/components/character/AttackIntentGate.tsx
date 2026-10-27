import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AttackFlowError, cancelAttackIntent, clearPendingAttackIntent, declareAttackIntent,
  loadAttackDefenseChoice, loadAttackIntentContext, loadAttackTargets, loadPendingAttackIntent,
  restorePendingAttackIntent, savePendingAttackIntent,
  type AttackDefenseChoice, type AttackIntent, type AttackIntentContext, type AttackIntentRequest,
} from '@/services/campaign-attack-intent-service';

export type AttackGateSelection =
  | { mode: 'waiting' }
  | { mode: 'manual'; weaponId: string }
  | { mode: 'targeted'; weaponId: string; targetCharacterId: string; attackIntentId: string; counterattackDefenseEventId?: string };

interface Props {
  campaignId: string;
  attackerId: string;
  weaponId: string;
  enabled: boolean;
  onSelectionChange: (selection: AttackGateSelection) => void;
}

/** Compartilha desktop/mobile: alvo e arma são declarados antes dos dados e aguardam a escolha do mestre. */
export function AttackIntentGate({ campaignId, attackerId, weaponId, enabled, onSelectionChange }: Props) {
  const [context, setContext] = useState<AttackIntentContext | null>(null);
  const [targets, setTargets] = useState<Array<{ id: string; name: string }>>([]);
  const [targetId, setTargetId] = useState('');
  const [intent, setIntent] = useState<AttackIntent | null>(null);
  const [choice, setChoice] = useState<AttackDefenseChoice | null>(null);
  const [manual, setManual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<AttackIntentRequest | null>(() => {
    try { return restorePendingAttackIntent(campaignId, attackerId); } catch { return null; }
  });
  const [storageError] = useState(() => {
    try { restorePendingAttackIntent(campaignId, attackerId); return ''; }
    catch (cause) { return cause instanceof Error ? cause.message : 'Declaração pendente inválida.'; }
  });

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const [current, availableTargets, currentIntent] = await Promise.all([
        loadAttackIntentContext(campaignId), loadAttackTargets(campaignId, attackerId),
        loadPendingAttackIntent(campaignId, attackerId),
      ]);
      const selectedChoice = currentIntent ? await loadAttackDefenseChoice(currentIntent.operation_id) : null;
      setContext(current); setTargets(availableTargets); setIntent(currentIntent); setChoice(selectedChoice);
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível conferir a declaração de ataque.'); }
    finally { setLoading(false); }
  }, [enabled, campaignId, attackerId]);

  useEffect(() => {
    if (!enabled) { onSelectionChange({ mode: 'waiting' }); return; }
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 4000);
    const onResume = () => { void refresh(); };
    window.addEventListener('online', onResume);
    document.addEventListener('visibilitychange', onResume);
    return () => { window.clearInterval(timer); window.removeEventListener('online', onResume); document.removeEventListener('visibilitychange', onResume); };
  }, [enabled, refresh, onSelectionChange]);

  const isCounterattack = !!intent?.reaction_source_id;
  const ready = !!intent && intent.weapon_id === weaponId && !!choice
    && intent.status === 'pending' && !!context?.active
    && intent.scene_number === context.scene && intent.round_number === context.round
    && intent.turn_instance_id === context.turnInstanceId
    && (isCounterattack || context.currentActorId === attackerId);
  useEffect(() => {
    onSelectionChange(ready ? { mode: 'targeted', weaponId, targetCharacterId: intent!.target_id,
      attackIntentId: intent!.operation_id,
      ...(intent!.reaction_source_id ? { counterattackDefenseEventId: intent!.reaction_source_id } : {}),
    } : manual && !intent && context?.active
      && context.currentActorId === attackerId ? { mode: 'manual', weaponId } : { mode: 'waiting' });
  }, [ready, manual, intent, context, attackerId, weaponId, onSelectionChange]);

  const declare = async () => {
    if (busy || storageError || !context?.active || context.currentActorId !== attackerId || !context.turnInstanceId) return;
    let request = pending;
    if (!request) {
      if (!targetId) return;
      request = { operationId: crypto.randomUUID(), campaignId, attackerId, targetId,
        weaponId, scene: context.scene, round: context.round, turnInstanceId: context.turnInstanceId };
      try { savePendingAttackIntent(request); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Declaração não enviada.'); return; }
      setPending(request);
    }
    setBusy(true); setError('');
    try {
      const saved = await declareAttackIntent(request);
      clearPendingAttackIntent(campaignId, attackerId); setPending(null);
      setIntent(saved); setTargetId(saved.target_id); setManual(false);
      await refresh();
    } catch (cause) {
      if (cause instanceof AttackFlowError && cause.confirmedRejected) {
        clearPendingAttackIntent(campaignId, attackerId); setPending(null);
        await refresh();
      }
      setError(cause instanceof Error ? cause.message : 'Resposta incerta. Recupere a mesma declaração.');
    } finally { setBusy(false); }
  };

  const cancel = async () => {
    if (!intent || busy) return;
    setBusy(true); setError('');
    try { await cancelAttackIntent(intent.operation_id); setIntent(null); setChoice(null); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Cancelamento não confirmado.'); }
    finally { setBusy(false); }
  };

  if (!enabled) return null;
  return <section className="rounded-lg border border-primary/30 bg-card p-3 space-y-2 text-sm" aria-label="Declaração de ataque da campanha">
    <p className="font-semibold">Ataque da campanha · antes da rolagem</p>
    <p className="text-xs text-muted-foreground">Declare alvo e arma equipada. O mestre confirma a defesa antes de liberar os dados. Ataques sem alvo vinculado exigem resolução manual.</p>
    {loading && <p role="status">Conferindo turno e alvos...</p>}
    {!loading && context && (!context.active || (context.currentActorId !== attackerId && !isCounterattack)) && <p role="alert" className="text-destructive">Aguarde seu turno no combate sincronizado.</p>}
    {!loading && context?.active && (context.currentActorId === attackerId || isCounterattack) && <>
      {intent ? <div className="space-y-1">
        <p>Alvo: <strong>{targets.find(target => target.id === intent.target_id)?.name ?? 'Ficha vinculada'}</strong>. Arma: <strong>{intent.weapon_id === weaponId ? 'arma selecionada' : 'outra arma equipada'}</strong>.</p>
        {isCounterattack && <p className="text-amber-300">Contra-ataque confirmado pelo mestre: esta rolagem usa uma reação e não consome ação padrão.</p>}
        {choice ? <p role="status" className="text-emerald-300">Defesa confirmada antes dos dados: {choice.defense_type === 'none' ? 'nenhuma defesa especial' : choice.defense_type}. {ready ? 'Rolagem liberada.' : 'Confira arma e turno.'}</p>
          : <p role="status" className="text-amber-300">Aguardando o mestre escolher a defesa antes da rolagem.</p>}
        <Button size="sm" type="button" variant="outline" disabled={busy} onClick={() => { void cancel(); }}>Cancelar declaração</Button>
      </div> : <>
        <label className="block space-y-1">Alvo vinculado
          <select aria-label="Alvo do ataque" className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-foreground"
            value={targetId} disabled={busy || !!pending || !!storageError || manual} onChange={event => setTargetId(event.target.value)}>
            <option value="">Selecione uma ficha</option>
            {targets.map(target => <option key={target.id} value={target.id}>{target.name}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" type="button" disabled={busy || !!storageError || (!pending && (!targetId || manual))}
            onClick={() => { void declare(); }}>{pending ? 'Recuperar declaração' : 'Declarar alvo e arma'}</Button>
          <Button size="sm" type="button" variant="outline" disabled={busy || !!pending}
            onClick={() => setManual(value => !value)}>{manual ? 'Usar alvo vinculado' : 'Sem alvo vinculado · manual'}</Button>
        </div>
        {manual && <p role="status" className="text-amber-300">Ataque sem alvo vinculado: a mesa resolverá Defesa e PV manualmente; nenhuma aplicação automática ocorrerá.</p>}
      </>}
    </>}
    {pending && !busy && <p role="status" className="text-amber-300">Resposta incerta. Recupere a mesma declaração antes de iniciar outra.</p>}
    {(error || storageError) && <p role="alert" className="text-destructive">{error || storageError}</p>}
  </section>;
}
