import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  confirmMassiveDamage,
  loadPendingMassiveDamage,
  type MassiveDamageReceipt,
  type PendingMassiveDamage,
} from '@/services/campaign-massive-damage-service';

/** Resolve no servidor os testes de Fortitude gerados por dano massivo. */
export function MassiveDamagePanel({ campaignId }: { campaignId: string }) {
  const [pending, setPending] = useState<PendingMassiveDamage[]>([]);
  const [receipts, setReceipts] = useState<Record<string, MassiveDamageReceipt>>({});
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { setPending(await loadPendingMassiveDamage(campaignId)); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao carregar dano massivo.'); }
  }, [campaignId]);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  const resolve = async (item: PendingMassiveDamage) => {
    if (busyId) return;
    setBusyId(item.sourceEventId); setError('');
    try {
      const receipt = await confirmMassiveDamage(campaignId, item);
      setReceipts(previous => ({ ...previous, [item.sourceEventId]: receipt }));
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Teste não confirmado.'); }
    finally { setBusyId(''); }
  };
  if (!pending.length && !Object.keys(receipts).length && !error) return null;
  return <section className="rounded-lg border border-amber-500/50 bg-card p-3 space-y-3 text-sm" aria-label="Testes de dano massivo">
    <div>
      <p className="font-semibold text-amber-300">Dano massivo</p>
      <p className="text-xs text-muted-foreground">O servidor rola Vigor, soma Fortitude e bônus atuais. Falha reduz o alvo a 0 PV e aplica Inconsciente e Morrendo.</p>
    </div>
    {pending.map(item => <div key={item.sourceEventId} className="rounded-md border border-border p-2 space-y-2">
      <p><strong>{item.characterName}</strong> sofreu {item.finalDamage} de dano com {item.hpMax} PV máximos. Teste de Fortitude DT {item.dt} pendente.</p>
      <Button size="sm" disabled={!!busyId} onClick={() => { void resolve(item); }}>
        {busyId === item.sourceEventId ? 'Rolando no servidor…' : 'Rolar Fortitude e aplicar resultado'}
      </Button>
    </div>)}
    {Object.values(receipts).map(receipt => <p role="status" key={receipt.eventId} className="text-emerald-300">
      Servidor confirmou: dados [{receipt.dice.join(', ')}], escolhido {receipt.kept}, Fortitude +{receipt.skillBonus + receipt.resistanceBonus}, total {receipt.total} contra DT {receipt.dt}: {receipt.passed ? 'sucesso; PV preservados' : 'falha; reduzido a 0 PV'}.
    </p>)}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Button size="sm" variant="outline" onClick={() => { void refresh(); }}>Atualizar pendências</Button>
  </section>;
}
