import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SKILLS } from '@/lib/character-data';
import type { useAccessoryApprovals } from '@/hooks/useAccessoryApprovals';

/** Pendências e ações explícitas para aprovar ou confirmar o uso situacional. */
export function AccessoryApprovalPanel({ state }: { state: ReturnType<typeof useAccessoryApprovals> }) {
  const [note, setNote] = useState('');
  if (!state.items.length && !state.error) return null;
  return <section className="rounded-lg border border-border p-4 space-y-4" aria-label="Aprovação de acessórios">
    <h3 className="font-semibold text-foreground">Bônus de acessórios — conferência do mestre</h3>
    <p className="text-sm text-muted-foreground">Aprovar não ativa o bônus. Confirme o utensílio empunhado ou a vestimenta vestida antes de usar; encerre o uso quando essa situação mudar. Vestir ou despir exige ação completa. Bônus de itens não se somam e até duas vestimentas podem estar em uso.</p>
    {state.error && <p role="alert" className="text-red-300">{state.error}</p>}
    {state.canReview && <label className="block text-sm">Motivo da conferência
      <Input aria-label="Motivo da conferência de acessórios" value={note} maxLength={500} onChange={event => setNote(event.target.value)} placeholder="Explique por que o item é adequado à perícia" />
    </label>}
    {state.items.map(item => <div key={item.id} className="border border-border rounded p-3 space-y-2">
      <p className="text-foreground font-medium">{item.name}</p>
      <p className="text-sm text-foreground">{Object.entries(item.bonuses).map(([skill, bonus]) => `${SKILLS.find(s => s.id === skill)?.name ?? skill} +${bonus}`).join(' · ') || 'Escolha as perícias no painel de modificações.'}</p>
      <p className="text-sm text-amber-200">{!item.approved ? 'Pendente: não entra nas rolagens.' : item.inUse ? 'Aprovado e em uso: bônus ativo.' : 'Aprovado: confirme o uso para ativar.'}</p>
      <div className="flex flex-wrap gap-2">
        {state.canReview && <Button variant="outline" disabled={state.busy || note.trim().length < 10 || !Object.keys(item.bonuses).length}
          onClick={() => state.confirm(item, 'review', !item.approved, note)}>{item.approved ? 'Revogar aprovação' : 'Aprovar benefício'}</Button>}
        {item.approved && <Button variant="outline" disabled={state.busy} onClick={() => state.confirm(item, 'use', !item.inUse)}>{item.inUse ? 'Encerrar uso' : 'Confirmar empunhado / vestido'}</Button>}
      </div>
    </div>)}
    <Button variant="outline" disabled={state.loading || state.busy} onClick={() => state.refresh()}>Conferir servidor</Button>
  </section>;
}
