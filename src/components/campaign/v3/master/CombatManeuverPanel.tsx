import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';
import { COMBAT_MANEUVER_LABELS } from '@/lib/combat-maneuvers';
import {
  clearPendingManeuverResolution, loadActiveGrapples, loadManeuverTargetItems, loadRoundManeuvers,
  releaseCampaignGrapple, resolveManeuver, restorePendingManeuverResolution,
  savePendingManeuverResolution, subscribeToManeuvers, type CombatManeuver, type GrappleLink,
} from '@/services/campaign-combat-maneuver-service';

interface Props { campaignId: string; scene: number; round: number; members: CampaignMemberV2[] }

/** Painel do mestre: confirma contexto e envia somente modificadores justificados. */
export function CombatManeuverPanel({ campaignId, scene, round, members }: Props) {
  const [maneuvers, setManeuvers] = useState<CombatManeuver[]>([]);
  const [activeGrapples, setActiveGrapples] = useState<GrappleLink[]>([]);
  const [savedResolutions, setSavedResolutions] = useState<Set<string>>(new Set());
  const [modifier, setModifier] = useState<Record<string, {
    attacker: string; defender: string; reason: string; targetItemId: string;
    defenderAttribute: 'strength' | 'agility'; adjacency: boolean; freeHand: boolean;
  }>>({});
  const [targetItems, setTargetItems] = useState<Record<string, Array<{ id: string; name: string }>>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const [rows, grapples] = await Promise.all([
        loadRoundManeuvers(campaignId, scene, round), loadActiveGrapples(campaignId),
      ]);
      setManeuvers(rows); setActiveGrapples(grapples);
      rows.filter(row => row.status === 'resolved').forEach(row => clearPendingManeuverResolution(row.operation_id));
      const restored = new Set<string>();
      rows.filter(row => row.status === 'pending').forEach(row => {
        const saved = restorePendingManeuverResolution(row.operation_id);
        if (!saved) return;
        restored.add(row.operation_id);
        setModifier(current => ({ ...current, [row.operation_id]: {
          attacker: String(saved.attackerModifier), defender: String(saved.defenderModifier), reason: saved.justification,
          targetItemId: saved.targetItemId ?? '', defenderAttribute: saved.defenderAttribute,
          adjacency: saved.adjacencyConfirmed, freeHand: saved.freeHandConfirmed ?? false,
        } }));
      });
      setSavedResolutions(restored);
      const targets = [...new Set(rows.filter(row => ['disarm', 'break'].includes(row.maneuver_type)).map(row => row.target_id))];
      const entries = await Promise.all(targets.map(async id => [id, await loadManeuverTargetItems(id)] as const));
      setTargetItems(Object.fromEntries(entries)); setError('');
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as manobras.'); }
  }, [campaignId, scene, round]);
  useEffect(() => {
    void refresh(); const unsubscribe = subscribeToManeuvers(campaignId, () => { void refresh(); });
    return unsubscribe;
  }, [campaignId, refresh]);
  const name = (id: string) => members.find(member => member.characters?.id === id)?.characters?.name ?? 'Ficha vinculada';
  const pending = maneuvers.filter(entry => entry.status === 'pending');
  const resolve = async (entry: CombatManeuver) => {
    const draft = modifier[entry.operation_id] ?? { attacker: '0', defender: '0', reason: '', targetItemId: '',
      defenderAttribute: 'strength' as const, adjacency: false, freeHand: false };
    setBusy(entry.operation_id); setError('');
    try {
      const request = restorePendingManeuverResolution(entry.operation_id) ?? {
        operationId: crypto.randomUUID(), maneuverId: entry.operation_id,
        defenderAttribute: draft.defenderAttribute, attackerModifier: Number(draft.attacker), defenderModifier: Number(draft.defender),
        justification: draft.reason, adjacencyConfirmed: draft.adjacency,
        freeHandConfirmed: draft.freeHand,
        targetItemId: ['disarm', 'break'].includes(entry.maneuver_type) ? draft.targetItemId : undefined };
      savePendingManeuverResolution(request);
      setSavedResolutions(current => new Set(current).add(entry.operation_id));
      await resolveManeuver(request);
      clearPendingManeuverResolution(entry.operation_id);
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Resolução não confirmada.'); }
    finally { setBusy(''); }
  };
  return <section role="region" aria-label="Resolver manobras" className="rounded-lg border border-border p-3 space-y-3">
    <div><p className="font-semibold text-sm">Manobras pendentes</p>
      <p className="text-xs text-muted-foreground">O servidor rola ambos os lados, repete empates e registra uma ação padrão. Geometria e objetos permanecem pendentes quando aplicável.</p></div>
    {activeGrapples.map(link => <div key={link.maneuver_operation_id} className="rounded-md border border-primary/30 p-2 space-y-2 text-xs">
      <p>Agarrar ativo: <strong>{name(link.actor_id)}</strong> mantém <strong>{name(link.target_id)}</strong>.</p>
      <Button size="sm" variant="outline" disabled={busy === link.maneuver_operation_id} onClick={() => {
        setBusy(link.maneuver_operation_id); void releaseCampaignGrapple(link.maneuver_operation_id)
          .then(refresh).catch(cause => setError(cause instanceof Error ? cause.message : 'Não foi possível encerrar Agarrar.'))
          .finally(() => setBusy(''));
      }}>Encerrar Agarrar</Button>
    </div>)}
    {!pending.length && <p role="status" className="text-xs text-muted-foreground">Nenhuma manobra pendente nesta rodada.</p>}
    {pending.map(entry => {
      const draft = modifier[entry.operation_id] ?? { attacker: '0', defender: '0', reason: '', targetItemId: '',
        defenderAttribute: 'strength' as const, adjacency: false, freeHand: false };
      return <article key={entry.operation_id} className="rounded-md border border-primary/20 p-2 space-y-2 text-xs">
        <p><strong>{name(entry.actor_id)}</strong> tenta {COMBAT_MANEUVER_LABELS[entry.maneuver_type]} contra <strong>{name(entry.target_id)}</strong>.</p>
        <div className="grid grid-cols-2 gap-2">
          <label>Modificador situacional do atacante<input aria-label={`Modificador situacional do atacante em ${COMBAT_MANEUVER_LABELS[entry.maneuver_type]}`} type="number" min={-20} max={20} value={draft.attacker}
            onChange={event => setModifier(current => ({ ...current, [entry.operation_id]: { ...draft, attacker: event.target.value } }))}
            className="mt-1 h-9 w-full rounded-md border bg-background px-2" /></label>
          <label>Modificador situacional do defensor<input aria-label={`Modificador situacional do defensor em ${COMBAT_MANEUVER_LABELS[entry.maneuver_type]}`} type="number" min={-20} max={20} value={draft.defender}
            onChange={event => setModifier(current => ({ ...current, [entry.operation_id]: { ...draft, defender: event.target.value } }))}
            className="mt-1 h-9 w-full rounded-md border bg-background px-2" /></label>
        </div>
        <label>Atributo do defensor
          <select aria-label={`Atributo do defensor em ${COMBAT_MANEUVER_LABELS[entry.maneuver_type]}`} value={draft.defenderAttribute}
            onChange={event => setModifier(current => ({ ...current, [entry.operation_id]: { ...draft, defenderAttribute: event.target.value as 'strength' | 'agility' } }))}
            className="mt-1 h-9 w-full rounded-md border bg-background px-2">
            <option value="strength">Força</option><option value="agility">Agilidade</option>
          </select>
        </label>
        <label>Justificativa situacional<input aria-label={`Justificativa de ${COMBAT_MANEUVER_LABELS[entry.maneuver_type]}`} value={draft.reason} maxLength={500}
          onChange={event => setModifier(current => ({ ...current, [entry.operation_id]: { ...draft, reason: event.target.value } }))}
          className="mt-1 h-9 w-full rounded-md border bg-background px-2" /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={draft.adjacency}
          onChange={event => setModifier(current => ({ ...current, [entry.operation_id]: { ...draft, adjacency: event.target.checked } }))} />Adjacência confirmada no mapa</label>
        {entry.maneuver_type === 'grapple' && <label className="flex items-center gap-2"><input type="checkbox" checked={draft.freeHand}
          onChange={event => setModifier(current => ({ ...current, [entry.operation_id]: { ...draft, freeHand: event.target.checked } }))} />Mão livre confirmada</label>}
        {['disarm', 'break'].includes(entry.maneuver_type) && <label>Item empunhado confirmado
          <select aria-label={`Item alvo de ${COMBAT_MANEUVER_LABELS[entry.maneuver_type]}`} value={draft.targetItemId}
            onChange={event => setModifier(current => ({ ...current, [entry.operation_id]: { ...draft, targetItemId: event.target.value } }))}
            className="mt-1 h-9 w-full rounded-md border bg-background px-2">
            <option value="">Selecione pelo nome</option>
            {(targetItems[entry.target_id] ?? []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>}
        <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy === entry.operation_id || draft.reason.trim().length < 3
          || !draft.adjacency || (entry.maneuver_type === 'grapple' && !draft.freeHand)
          || (['disarm', 'break'].includes(entry.maneuver_type) && !draft.targetItemId.trim())}
          onClick={() => { void resolve(entry); }}>{savedResolutions.has(entry.operation_id) ? 'Reenviar mesma resolução' : 'Confirmar contexto e resolver'}</Button>
        {savedResolutions.has(entry.operation_id) && <Button size="sm" variant="outline" onClick={() => {
          clearPendingManeuverResolution(entry.operation_id);
          setSavedResolutions(current => { const next = new Set(current); next.delete(entry.operation_id); return next; });
          setError('Revise os dados. A próxima tentativa usará um novo identificador.');
        }}>Revisar resolução</Button>}
        </div>
      </article>;
    })}
    {maneuvers.filter(entry => entry.status === 'resolved').slice(0, 3).map(entry => (
      <div key={`result:${entry.operation_id}`} className="rounded-md border border-border/60 p-2 space-y-2 text-xs">
        <p role="status">{COMBAT_MANEUVER_LABELS[entry.maneuver_type]} · {entry.result?.attackerWon === true ? 'atacante venceu' : 'atacante perdeu'} · margem {String(entry.result?.margin ?? 'indisponível')}{entry.result?.manualPending === true ? ' · etapa física pendente' : ' · efeito registrado'}</p>
      </div>
    ))}
    {error && <p role="alert" className="text-destructive text-xs">{error}</p>}
  </section>;
}
