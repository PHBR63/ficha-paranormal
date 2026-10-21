import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import {
  AttackFlowError, clearPendingDefenseChoice, confirmDefenseChoice,
  loadRoundAttackIntents, loadRoundDefenseChoices, restorePendingDefenseChoice,
  savePendingDefenseChoice, type AttackDefenseChoice, type AttackIntent,
  type DefenseChoiceRequest, type PreRollDefense,
} from '@/services/campaign-attack-intent-service';

interface Props { campaignId: string; scene: number; round: number; members: CampaignMemberV2[] }

/** Mestre escolhe a reação antes de liberar a rolagem do ataque declarado. */
export function AttackDefenseChoicePanel({ campaignId, scene, round, members }: Props) {
  const [intents, setIntents] = useState<AttackIntent[]>([]);
  const [choices, setChoices] = useState<AttackDefenseChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const next = await loadRoundAttackIntents(campaignId, scene, round);
      const selected = await loadRoundDefenseChoices(next.map(intent => intent.operation_id));
      setIntents(next); setChoices(selected); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao carregar declarações de ataque.'); }
    finally { setLoading(false); }
  }, [campaignId, scene, round]);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 5000);
    const onResume = () => { void refresh(); };
    window.addEventListener('online', onResume);
    document.addEventListener('visibilitychange', onResume);
    return () => { window.clearInterval(timer); window.removeEventListener('online', onResume); document.removeEventListener('visibilitychange', onResume); };
  }, [refresh]);
  const nameFor = (id: string) => members.find(member => member.characters?.id === id)?.characters?.name ?? 'Ficha vinculada';
  const pendingIntents = intents.filter(intent => intent.status === 'pending');
  return <section className="rounded-lg border border-border bg-card p-3 space-y-2 text-sm" aria-label="Defesas antes da rolagem">
    <p className="font-semibold">Defesas antes da rolagem · rodada {round}</p>
    <p className="text-xs text-muted-foreground">O atacante declara alvo e arma. Antes de rolar, confirme Bloqueio, Esquiva ou nenhuma defesa especial. O servidor confere treinamento e limita uma defesa especial por rodada.</p>
    {loading ? <p role="status">Carregando declarações...</p> : pendingIntents.length === 0
      ? <p className="text-xs text-muted-foreground">Nenhum ataque aguardando defesa nesta rodada.</p>
      : pendingIntents.map(intent => <DefenseChoiceRow key={intent.operation_id} intent={intent}
        attackerName={nameFor(intent.attacker_id)} targetName={nameFor(intent.target_id)}
        existing={choices.find(choice => choice.intent_id === intent.operation_id) ?? null} onSaved={refresh} />)}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Button size="sm" type="button" variant="outline" onClick={() => { void refresh(); }}>Atualizar declarações</Button>
  </section>;
}

function DefenseChoiceRow({ intent, attackerName, targetName, existing, onSaved }: {
  intent: AttackIntent; attackerName: string; targetName: string;
  existing: AttackDefenseChoice | null; onSaved: () => Promise<void>;
}) {
  const [pending, setPending] = useState<DefenseChoiceRequest | null>(() => {
    try { return restorePendingDefenseChoice(intent.operation_id); } catch { return null; }
  });
  const [storageError] = useState(() => {
    try { restorePendingDefenseChoice(intent.operation_id); return ''; }
    catch (cause) { return cause instanceof Error ? cause.message : 'Escolha pendente inválida.'; }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const choose = async (type: PreRollDefense) => {
    if (busy || existing || storageError) return;
    let request = pending;
    if (!request) {
      request = { operationId: crypto.randomUUID(), intentId: intent.operation_id, defenseType: type };
      try { savePendingDefenseChoice(request); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Escolha não enviada.'); return; }
      setPending(request);
    }
    setBusy(true); setError('');
    try {
      await confirmDefenseChoice(request);
      clearPendingDefenseChoice(intent.operation_id); setPending(null);
      await onSaved();
    } catch (cause) {
      if (cause instanceof AttackFlowError && cause.confirmedRejected) {
        clearPendingDefenseChoice(intent.operation_id); setPending(null);
        await onSaved();
      }
      setError(cause instanceof Error ? cause.message : 'Resposta incerta. Recupere a mesma escolha.');
    } finally { setBusy(false); }
  };
  return <div className="rounded-md border border-border p-2 space-y-2">
    <p><strong>{attackerName}</strong> ataca <strong>{targetName}</strong> com arma {intent.melee ? 'corpo a corpo' : 'à distância'}.</p>
    {existing ? <p role="status" className="text-emerald-300">Defesa pré-rolagem confirmada: {existing.defense_type === 'none' ? 'nenhuma defesa especial' : existing.defense_type}. Atacante liberado para rolar.</p>
      : <div className="flex flex-wrap gap-2">
        {pending ? <Button size="sm" disabled={busy} onClick={() => { void choose(pending.defenseType); }}>Recuperar confirmação</Button>
          : <>
            <Button size="sm" variant="outline" disabled={busy || !!storageError} onClick={() => { void choose('none'); }}>Sem defesa especial</Button>
            <Button size="sm" variant="outline" disabled={busy || !!storageError || !intent.melee} title="Bloqueio exige ataque corpo a corpo e Fortitude treinada" onClick={() => { void choose('bloqueio'); }}>Bloqueio</Button>
            <Button size="sm" variant="outline" disabled={busy || !!storageError} title="Esquiva exige Reflexos treinados" onClick={() => { void choose('esquiva'); }}>Esquiva</Button>
          </>}
      </div>}
    {pending && !busy && <p role="status" className="text-amber-300">Resposta incerta. Recupere a mesma escolha antes de enviar outra.</p>}
    {(error || storageError) && <p role="alert" className="text-destructive">{error || storageError}</p>}
  </div>;
}
