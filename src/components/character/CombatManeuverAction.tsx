import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  cancelManeuver, clearPendingManeuver, declareManeuver, loadManeuverContext,
  loadActiveGrapples, loadManeuverTargets, loadPendingManeuver, releaseCampaignGrapple,
  restorePendingManeuver, savePendingManeuver, subscribeToManeuvers,
  type CombatManeuver, type GrappleLink, type ManeuverContext,
} from '@/services/campaign-combat-maneuver-service';
import { COMBAT_MANEUVER_LABELS, eligibleManeuverWeapons, hasAgileUnarmedTrait, type CombatManeuverType } from '@/lib/combat-maneuvers';
import { cn } from '@/lib/utils';

interface Props { campaignId: string; actorId: string; inventory?: unknown[]; traits?: unknown[]; mobile?: boolean }

/** Fluxo v2 compartilhado por desktop/mobile; o servidor resolve dados, ação e efeito. */
export function CombatManeuverAction({ campaignId, actorId, inventory = [], traits = [], mobile = false }: Props) {
  const [context, setContext] = useState<ManeuverContext | null>(null);
  const [targets, setTargets] = useState<Array<{ id: string; name: string }>>([]);
  const [targetId, setTargetId] = useState('');
  const [type, setType] = useState<CombatManeuverType>('trip');
  const [attribute, setAttribute] = useState<'strength' | 'agility'>('strength');
  const [weaponId, setWeaponId] = useState('__unarmed__');
  const [maneuver, setManeuver] = useState<CombatManeuver | null>(null);
  const [activeGrapples, setActiveGrapples] = useState<GrappleLink[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const weapons = eligibleManeuverWeapons(inventory);
  const selectedWeapon = type === 'grapple' ? '__unarmed__' : weaponId;
  const selectedInventoryWeapon = inventory.find(item => item && typeof item === 'object'
    && 'id' in item && item.id === selectedWeapon) as Record<string, unknown> | undefined;
  const agileAllowed = selectedWeapon === '__unarmed__'
    ? hasAgileUnarmedTrait(traits)
    : Array.isArray(selectedInventoryWeapon?.properties)
      && selectedInventoryWeapon.properties.some(value => ['ágil', 'agil', 'agile'].includes(String(value).toLowerCase()));

  useEffect(() => {
    if (!agileAllowed && attribute !== 'strength') setAttribute('strength');
  }, [agileAllowed, attribute]);

  const refresh = useCallback(async () => {
    try {
      const nextContext = await loadManeuverContext(campaignId);
      const [nextTargets, pending, grapples] = await Promise.all([
        loadManeuverTargets(campaignId, actorId),
        loadPendingManeuver(campaignId, actorId, nextContext.turnInstanceId),
        loadActiveGrapples(campaignId, actorId),
      ]);
      setContext(nextContext); setTargets(nextTargets); setManeuver(pending); setActiveGrapples(grapples); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as manobras.'); }
    finally { setLoading(false); }
  }, [campaignId, actorId]);

  useEffect(() => {
    void refresh();
    const unsubscribe = subscribeToManeuvers(campaignId, () => { void refresh(); });
    const onResume = () => { void refresh(); };
    window.addEventListener('online', onResume);
    return () => { unsubscribe(); window.removeEventListener('online', onResume); };
  }, [campaignId, refresh]);

  const declare = async () => {
    if (busy || !context?.active || context.currentActorId !== actorId || !context.turnInstanceId || !targetId) return;
    let request;
    try { request = restorePendingManeuver(campaignId, actorId); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Pedido local inválido.'); return; }
    request ??= { operationId: crypto.randomUUID(), campaignId, actorId, targetId,
      maneuverType: type, weaponId: selectedWeapon, attribute, scene: context.scene,
      round: context.round, turnInstanceId: context.turnInstanceId };
    setBusy(true); setError('');
    try {
      savePendingManeuver(request);
      const saved = await declareManeuver(request);
      clearPendingManeuver(campaignId, actorId); setManeuver(saved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Resposta incerta. Recupere esta manobra.'); }
    finally { setBusy(false); }
  };
  const cancel = async () => {
    if (!maneuver || busy) return;
    setBusy(true); setError('');
    try { await cancelManeuver(maneuver.operation_id); setManeuver(null); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Cancelamento não confirmado.'); }
    finally { setBusy(false); }
  };
  const release = async (maneuverId: string) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await releaseCampaignGrapple(maneuverId); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível encerrar Agarrar.'); }
    finally { setBusy(false); }
  };

  const myTurn = !!context?.active && context.currentActorId === actorId;
  return <section role="region" aria-label="Manobra de combate"
    className={cn('rounded-lg border border-primary/30 bg-card p-3 space-y-3', mobile && 'text-sm')}>
    <div>
      <p className="font-semibold">Manobra de combate · v2</p>
      <p className="text-xs text-muted-foreground">Substitui um ataque corpo a corpo e consome uma ação padrão quando o mestre resolver. O servidor faz o teste oposto de Luta e repete empates.</p>
      <p className="text-xs text-amber-300">Adjacência, direção, beiradas e geometria são confirmadas pelo mestre.</p>
    </div>
    {loading && <p role="status">Conferindo turno e pendências...</p>}
    {activeGrapples.map(link => <div key={link.maneuver_operation_id} className="rounded-md border border-primary/30 p-2 space-y-2">
      <p role="status" className="text-xs">Agarrar ativo. Soltar é uma ação livre e permanece disponível fora do turno original.</p>
      <Button type="button" size="sm" variant="outline" disabled={busy}
        onClick={() => { void release(link.maneuver_operation_id); }}>Soltar voluntariamente</Button>
    </div>)}
    {!loading && !myTurn && !maneuver && <p role="alert" className="text-muted-foreground">Disponível apenas no seu turno do combate v2.</p>}
    {maneuver ? <div className="space-y-2">
      {maneuver.status === 'resolved' ? <p role="status"><strong>{COMBAT_MANEUVER_LABELS[maneuver.maneuver_type]}</strong> resolvida pelo servidor. {maneuver.result?.attackerWon === true ? 'Você venceu o teste oposto.' : 'Você perdeu o teste oposto.'} Margem {String(maneuver.result?.margin ?? 'indisponível')}. {maneuver.result?.manualPending === true ? 'Há uma etapa física pendente do mestre.' : 'Efeito mecânico registrado.'}</p>
        : <><p role="status"><strong>{COMBAT_MANEUVER_LABELS[maneuver.maneuver_type]}</strong> declarada. Aguardando o mestre; nenhuma ação foi gasta ainda.</p>
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => { void cancel(); }}>Cancelar antes da resolução</Button></>}
    </div> : myTurn && <div className={cn('grid gap-2', mobile ? 'grid-cols-1' : 'sm:grid-cols-2')}>
      <label className="space-y-1 text-xs">Manobra
        <select aria-label="Tipo de manobra" value={type} onChange={event => setType(event.target.value as CombatManeuverType)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-foreground">
          {Object.entries(COMBAT_MANEUVER_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs">Ataque corpo a corpo
        <select aria-label="Arma da manobra" value={type === 'grapple' ? '__unarmed__' : weaponId}
          disabled={type === 'grapple'} onChange={event => setWeaponId(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-foreground">
          {weapons.map(weapon => <option key={weapon.id} value={weapon.id}>{weapon.name}</option>)}
        </select>
        {type === 'grapple' && <span className="block text-muted-foreground">Agarrar exige ataque desarmado.</span>}
      </label>
      <label className="space-y-1 text-xs">Alvo vinculado
        <select aria-label="Alvo da manobra" value={targetId} onChange={event => setTargetId(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-foreground">
          <option value="">Selecione</option>{targets.map(target => <option key={target.id} value={target.id}>{target.name}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs">Atributo do atacante
        <select aria-label="Atributo da manobra" value={attribute} onChange={event => setAttribute(event.target.value as 'strength' | 'agility')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-2 text-foreground">
          <option value="strength">Força</option><option value="agility" disabled={!agileAllowed}>Agilidade {agileAllowed ? '(Ágil)' : '(indisponível)'}</option>
        </select>
      </label>
      <Button type="button" className="self-end min-h-10" disabled={busy || !targetId} onClick={() => { void declare(); }}>
        {busy ? 'Enviando...' : 'Declarar manobra'}
      </Button>
    </div>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </section>;
}
