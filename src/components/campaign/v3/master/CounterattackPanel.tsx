import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { createCounterattackIntent, loadPendingCounterattacks, type PendingCounterattack } from '@/services/campaign-counterattack-service';

/** Transforma uma reação de Contra-ataque confirmada em intenção de ataque sincronizada. */
export function CounterattackPanel({ campaignId }: { campaignId: string }) {
  const [pending, setPending] = useState<PendingCounterattack[]>([]);
  const [weapons, setWeapons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { setPending(await loadPendingCounterattacks(campaignId)); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao carregar contra-ataques.'); }
  }, [campaignId]);
  useEffect(() => {
    void refresh(); const timer = window.setInterval(() => { void refresh(); }, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  const prepare = async (item: PendingCounterattack) => {
    const weaponId = weapons[item.defenseEventId];
    if (!weaponId || busyId) return;
    setBusyId(item.defenseEventId); setError(''); setMessage('');
    try {
      await createCounterattackIntent(campaignId, item, weaponId);
      setMessage(`Contra-ataque de ${item.characterName} preparado. Confirme a defesa abaixo; depois o jogador rola com a arma selecionada.`);
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Contra-ataque não preparado.'); }
    finally { setBusyId(''); }
  };
  if (!pending.length && !message && !error) return null;
  return <section className="rounded-lg border border-primary/40 bg-card p-3 space-y-3 text-sm" aria-label="Contra-ataques pendentes">
    <div><p className="font-semibold">Contra-ataque</p><p className="text-xs text-muted-foreground">Reação após erro corpo a corpo. Não consome ação padrão; usa o fluxo normal de defesa, rolagem e dano.</p></div>
    {pending.map(item => <div key={item.defenseEventId} className="rounded-md border border-border p-2 space-y-2">
      <p><strong>{item.characterName}</strong> pode contra-atacar <strong>{item.targetName}</strong>.</p>
      {item.weapons.length ? <div className="flex flex-wrap gap-2">
        <select aria-label={`Arma do contra-ataque de ${item.characterName}`} className="h-9 rounded-md border border-input bg-background px-2"
          value={weapons[item.defenseEventId] ?? ''} onChange={event => setWeapons(previous => ({ ...previous, [item.defenseEventId]: event.target.value }))}>
          <option value="">Selecione a arma equipada</option>
          {item.weapons.map(weapon => <option key={weapon.id} value={weapon.id}>{weapon.name}</option>)}
        </select>
        <Button size="sm" disabled={!weapons[item.defenseEventId] || !!busyId} onClick={() => { void prepare(item); }}>
          {busyId === item.defenseEventId ? 'Preparando…' : 'Preparar contra-ataque'}
        </Button>
      </div> : <p role="alert" className="text-destructive">Nenhuma arma corpo a corpo equipada. Equipe uma arma antes de prosseguir.</p>}
    </div>)}
    {message && <p role="status" className="text-emerald-300">{message}</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </section>;
}
