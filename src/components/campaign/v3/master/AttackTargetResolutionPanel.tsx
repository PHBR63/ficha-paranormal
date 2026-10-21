import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import { loadRoundAttackIntents, loadRoundDefenseChoices, type AttackIntent, type AttackDefenseChoice } from '@/services/campaign-attack-intent-service';
import { CAMPAIGN_DAMAGE_TYPES } from '@/services/campaign-bulk-damage-service';
import {
  AttackTargetError, clearPendingAttackTarget, confirmAttackTarget, loadAttackEvent,
  loadResolvedAttackIds, restorePendingAttackTarget, savePendingAttackTarget,
  type AttackTargetReceipt, type AttackTargetRequest, type AttackTargetResolution,
} from '@/services/campaign-attack-target-service';

interface Props { campaignId: string; scene: number; round: number; members: CampaignMemberV2[] }
interface RolledAttack { intent: AttackIntent; choice: AttackDefenseChoice | null; attackTotal: number }
const initial: AttackTargetResolution = {
  defenseTotal: 10, grossDamage: 0, damageType: 'impacto', resistedDamage: 0,
  damageReduction: 0, immuneDamage: false,
};

/** Mestre declara a Defesa e o dano de um ataque já rolado contra alvo vinculado. */
export function AttackTargetResolutionPanel({ campaignId, scene, round, members }: Props) {
  const [attacks, setAttacks] = useState<RolledAttack[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [values, setValues] = useState<AttackTargetResolution>(initial);
  const [pending, setPending] = useState<AttackTargetRequest | null>(() => {
    try { return restorePendingAttackTarget(campaignId); } catch { return null; }
  });
  const [storageError] = useState(() => {
    try { restorePendingAttackTarget(campaignId); return ''; }
    catch (cause) { return cause instanceof Error ? cause.message : 'Operação pendente inválida.'; }
  });
  const [receipt, setReceipt] = useState<AttackTargetReceipt | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nameFor = useCallback((id: string) => members.find(member => member.characters?.id === id)?.characters?.name ?? 'Ficha vinculada', [members]);

  const refresh = useCallback(async () => {
    try {
      const intents = (await loadRoundAttackIntents(campaignId, scene, round))
        .filter(intent => intent.status === 'rolled' && !!intent.attack_event_id);
      const [choices, resolved] = await Promise.all([
        loadRoundDefenseChoices(intents.map(intent => intent.operation_id)),
        loadResolvedAttackIds(campaignId, intents.flatMap(intent => intent.attack_event_id ? [intent.attack_event_id] : [])),
      ]);
      const eligible = intents.filter(intent => !resolved.includes(intent.attack_event_id!));
      const next = await Promise.all(eligible.map(async intent => {
        const event = await loadAttackEvent(intent.attack_event_id!);
        const payload = event.payload;
        const entry = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload.entry : null;
        const attackTotal = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry.total : null;
        return typeof attackTotal === 'number' && Number.isSafeInteger(attackTotal)
          ? { intent, choice: choices.find(choice => choice.intent_id === intent.operation_id) ?? null, attackTotal }
          : null;
      }));
      setAttacks(next.filter((value): value is RolledAttack => value !== null));
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao carregar ataques confirmados.'); }
  }, [campaignId, scene, round]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 5000);
    const resume = () => { void refresh(); };
    window.addEventListener('online', resume); document.addEventListener('visibilitychange', resume);
    return () => { window.clearInterval(timer); window.removeEventListener('online', resume); document.removeEventListener('visibilitychange', resume); };
  }, [refresh]);

  const selected = attacks.find(attack => attack.intent.attack_event_id === selectedId) ?? null;
  const target = members.find(member => member.characters?.id === selected?.intent.target_id)?.characters;
  const specialDefenseEventId = selected?.choice?.defense_type !== 'none' ? selected?.choice?.operation_id : undefined;
  const setNumber = (field: 'defenseTotal' | 'grossDamage' | 'resistedDamage' | 'damageReduction', raw: string) => {
    const number = Number(raw);
    if (raw === '' || Number.isSafeInteger(number)) setValues(previous => ({ ...previous, [field]: raw === '' ? 0 : number }));
  };
  const confirm = async () => {
    if (busy || storageError) return;
    let request = pending;
    if (!request) {
      if (!selected || !target || !selected.intent.attack_event_id) return;
      request = {
        operationId: crypto.randomUUID(), campaignId, attackEventId: selected.intent.attack_event_id,
        targetCharacterId: selected.intent.target_id, expectedHp: target.hp_current,
        expectedScene: scene, expectedRound: round,
        resolution: { ...values, ...(specialDefenseEventId ? { specialDefenseEventId } : {}) },
      };
      try { savePendingAttackTarget(request); }
      catch (cause) { setError(cause instanceof Error ? cause.message : 'Resolução não enviada.'); return; }
      setPending(request);
    }
    setBusy(true); setError('');
    try {
      const saved = await confirmAttackTarget(request);
      clearPendingAttackTarget(campaignId); setPending(null); setReceipt(saved); setSelectedId('');
      await refresh();
    } catch (cause) {
      if (cause instanceof AttackTargetError && cause.confirmedRejected) {
        clearPendingAttackTarget(campaignId); setPending(null); await refresh();
      }
      setError(cause instanceof Error ? cause.message : 'Resposta incerta. Recupere a mesma resolução.');
    } finally { setBusy(false); }
  };

  return <section className="rounded-lg border border-border bg-card p-3 space-y-3 text-sm" aria-label="Resolver ataque contra alvo">
    <p className="font-semibold">Resolver ataque contra alvo · rodada {round}</p>
    <p className="text-xs text-muted-foreground">O mestre declara Defesa, dano rolado e reduções. O servidor aplica PV e registra o resultado uma única vez. Bloqueio e Esquiva foram escolhidos antes dos dados; seus valores continuam a cargo da mesa.</p>
    {pending ? <p role="status" className="text-amber-300">Há uma confirmação incerta. Recupere a mesma operação; não aplique dano novamente.</p>
      : <>
        <label className="block space-y-1">Ataque confirmado
          <select aria-label="Ataque para resolver" className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-foreground"
            value={selectedId} onChange={event => { setSelectedId(event.target.value); setValues({ ...initial }); setReceipt(null); }}>
            <option value="">Selecione</option>
            {attacks.map(attack => <option key={attack.intent.operation_id} value={attack.intent.attack_event_id!}>
              {nameFor(attack.intent.attacker_id)} → {nameFor(attack.intent.target_id)} · teste {attack.attackTotal}
            </option>)}
          </select>
        </label>
        {selected && target && <div className="space-y-2">
          <p>Alvo: <strong>{target.name}</strong> · PV atual {target.hp_current} · ataque {selected.attackTotal} · defesa prévia: {selected.choice?.defense_type ?? 'não registrada'}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['defenseTotal', 'grossDamage', 'resistedDamage', 'damageReduction'] as const).map(field => <label key={field} className="space-y-1">
              <span>{({ defenseTotal: 'Defesa final', grossDamage: 'Dano rolado', resistedDamage: 'Dano resistido', damageReduction: 'RD' })[field]}</span>
              <Input type="number" min={0} max={1000000} value={values[field]} onChange={event => setNumber(field, event.target.value)} />
            </label>)}
          </div>
          <label className="block space-y-1">Tipo de dano
            <select aria-label="Tipo de dano" className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-foreground"
              value={values.damageType} onChange={event => setValues(previous => ({ ...previous, damageType: event.target.value as AttackTargetResolution['damageType'] }))}>
              {CAMPAIGN_DAMAGE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={values.immuneDamage}
            onChange={event => setValues(previous => ({ ...previous, immuneDamage: event.target.checked }))} /> Alvo imune a este dano</label>
          <label className="block space-y-1">Justificativa da defesa, resistência, RD ou imunidade
            <Input maxLength={500} value={values.reviewNote ?? ''} onChange={event => setValues(previous => ({ ...previous, reviewNote: event.target.value }))} />
          </label>
        </div>}
      </>}
    <Button type="button" size="sm" disabled={busy || !!storageError || (!pending && (!selected || !target || !selected.choice))}
      onClick={() => { void confirm(); }}>{pending ? 'Recuperar confirmação' : 'Confirmar resultado e aplicar PV'}</Button>
    <Button type="button" size="sm" variant="outline" onClick={() => { void refresh(); }}>Atualizar ataques</Button>
    {receipt && <p role="status" className="text-emerald-300">Servidor confirmou: {receipt.hit ? 'acerto' : 'erro'}, dano final {receipt.finalDamage}, PV {receipt.hpBefore} → {receipt.hpAfter}{receipt.conditionsAfter ? `, condições: ${receipt.conditionsAfter.join(', ') || 'nenhuma'}` : ''}. {receipt.timingVerifiedByServer ? 'Defesa prévia comprovada.' : 'Sem defesa especial prévia.'}</p>}
    {(error || storageError) && <p role="alert" className="text-destructive">{error || storageError}</p>}
  </section>;
}
