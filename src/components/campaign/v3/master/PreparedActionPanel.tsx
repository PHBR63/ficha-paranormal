import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import { loadAttackIntentContext, type AttackIntentContext } from '@/services/campaign-attack-intent-service';
import {
  PreparedActionError, clearPendingPreparedOperation, loadPendingPreparedActions,
  prepareCharacterAction, restorePendingPreparedOperation, savePendingPreparedOperation,
  triggerPreparedAction, type PendingPreparedOperation, type PreparedAction, type PreparedKind,
} from '@/services/campaign-prepared-action-service';

interface Props { campaignId: string; members: CampaignMemberV2[]; onCombatChanged: () => Promise<void> }

/** Registro separado de Preparar: consome ação padrão, e só mestre confirma o gatilho manual. */
export function PreparedActionPanel({ campaignId, members, onCombatChanged }: Props) {
  const [context, setContext] = useState<AttackIntentContext | null>(null);
  const [actions, setActions] = useState<PreparedAction[]>([]);
  const [kind, setKind] = useState<PreparedKind>('standard');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('');
  const [triggerNotes, setTriggerNotes] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<PendingPreparedOperation | null>(() => {
    try { return restorePendingPreparedOperation(campaignId); } catch { return null; }
  });
  const [storageError] = useState(() => {
    try { restorePendingPreparedOperation(campaignId); return ''; }
    catch (cause) { return cause instanceof Error ? cause.message : 'Operação pendente inválida.'; }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const nameFor = (id: string) => members.find(member => member.characters?.id === id)?.characters?.name ?? 'Ficha vinculada';
  const refresh = useCallback(async () => {
    try {
      const [current, pendingActions] = await Promise.all([
        loadAttackIntentContext(campaignId), loadPendingPreparedActions(campaignId),
      ]);
      setContext(current); setActions(pendingActions);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao carregar ações preparadas.'); }
  }, [campaignId]);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 5000);
    const resume = () => { void refresh(); };
    window.addEventListener('online', resume); document.addEventListener('visibilitychange', resume);
    return () => { window.clearInterval(timer); window.removeEventListener('online', resume); document.removeEventListener('visibilitychange', resume); };
  }, [refresh]);

  const send = async (newOperation?: PendingPreparedOperation) => {
    if (busy || storageError) return;
    const operation = pending ?? newOperation;
    if (!operation) return;
    if (!pending) {
      try { savePendingPreparedOperation(campaignId, operation); setPending(operation); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Operação não enviada.'); return; }
    }
    setBusy(true); setError(''); setNotice('');
    try {
      if (operation.kind === 'prepare') {
        await prepareCharacterAction(operation.request);
        setDescription(''); setTrigger('');
        setNotice('Ação padrão consumida e preparação registrada. Gatilho e efeito ainda pendentes.');
      } else {
        await triggerPreparedAction(operation.request);
        setNotice('Gatilho confirmado pelo mestre; iniciativa ajustada. Ataque, ritual, dano, PE e demais efeitos exigem resolução manual.');
      }
      clearPendingPreparedOperation(campaignId); setPending(null);
      if (operation.kind === 'trigger') {
        try { await onCombatChanged(); }
        catch { setError('Gatilho confirmado; atualize o combate para ver a nova iniciativa.'); }
      }
      await refresh();
    } catch (cause) {
      if (cause instanceof PreparedActionError && cause.confirmedRejected) {
        clearPendingPreparedOperation(campaignId); setPending(null); await refresh();
      }
      setError(cause instanceof Error ? cause.message : 'Resposta incerta. Recupere a mesma operação.');
    } finally { setBusy(false); }
  };
  const currentActor = context?.currentActorId;
  const canPrepare = !!context?.active && !!context.turnInstanceId && !!currentActor
    && members.some(member => member.characters?.id === currentActor);
  const prepare = () => {
    if (!context?.turnInstanceId || !currentActor) return;
    void send({ kind: 'prepare', request: {
      operationId: crypto.randomUUID(), campaignId, characterId: currentActor,
      scene: context.scene, round: context.round, turnInstanceId: context.turnInstanceId,
      declaredKind: kind, actionDescription: description.trim(), triggerDescription: trigger.trim(),
    } });
  };
  const fire = (action: PreparedAction) => {
    if (!context?.turnInstanceId) return;
    void send({ kind: 'trigger', campaignId, request: {
      operationId: crypto.randomUUID(), preparedId: action.operation_id,
      scene: context.scene, round: context.round, turnInstanceId: context.turnInstanceId,
      triggerNote: (triggerNotes[action.operation_id] ?? '').trim(),
    } });
  };

  return <section className="rounded-lg border border-border bg-card p-3 space-y-3 text-sm" aria-label="Ações preparadas">
    <p className="font-semibold">Ações preparadas</p>
    <p className="text-xs text-muted-foreground">Preparar usa a ação padrão do turno. O mestre confirma o gatilho em outro turno e o servidor ajusta a iniciativa. A execução de ataque, ritual, dano, PE ou efeitos não é automática.</p>
    {canPrepare && !pending && <div className="grid gap-2 sm:grid-cols-2">
      <p className="sm:col-span-2">Turno de <strong>{nameFor(currentActor!)}</strong></p>
      <label className="space-y-1">Ação declarada
        <select aria-label="Tipo de ação preparada" className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-foreground"
          value={kind} onChange={event => setKind(event.target.value as PreparedKind)}>
          <option value="standard">Padrão</option><option value="movement">Movimento</option><option value="free">Livre</option>
        </select>
      </label>
      <label className="space-y-1">Descrição da ação<Input maxLength={500} value={description} onChange={event => setDescription(event.target.value)} /></label>
      <label className="space-y-1 sm:col-span-2">Gatilho declarado<Input maxLength={500} value={trigger} onChange={event => setTrigger(event.target.value)} /></label>
      <Button type="button" size="sm" disabled={busy || !description.trim() || !trigger.trim()} onClick={prepare}>Preparar ação padrão</Button>
    </div>}
    {actions.map(action => <div key={action.operation_id} className="rounded-md border border-border p-2 space-y-2">
      <p><strong>{nameFor(action.character_id)}</strong> preparou {action.declared_kind === 'standard' ? 'ação padrão' : action.declared_kind === 'movement' ? 'ação de movimento' : 'ação livre'}: {action.action_description}</p>
      <p>Gatilho: {action.trigger_description}</p>
      {context?.active && context.turnInstanceId !== action.source_turn_instance_id && context.currentActorId !== action.character_id && !pending && <>
        <label className="block space-y-1">Confirmação do gatilho e execução manual
          <Input maxLength={500} value={triggerNotes[action.operation_id] ?? ''}
            onChange={event => setTriggerNotes(previous => ({ ...previous, [action.operation_id]: event.target.value }))} />
        </label>
        <Button type="button" size="sm" disabled={busy || !triggerNotes[action.operation_id]?.trim()}
          onClick={() => fire(action)}>Confirmar gatilho</Button>
      </>}
    </div>)}
    {pending && <div className="space-y-1"><p role="status" className="text-amber-300">Resposta incerta. Repita somente esta operação.</p>
      <Button type="button" size="sm" disabled={busy} onClick={() => { void send(); }}>Recuperar confirmação</Button></div>}
    {notice && <p role="status" className="text-emerald-300">{notice}</p>}
    {(error || storageError) && <p role="alert" className="text-destructive">{error || storageError}</p>}
    <Button type="button" size="sm" variant="outline" onClick={() => { void refresh(); }}>Atualizar ações</Button>
  </section>;
}
