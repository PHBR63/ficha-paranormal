import { getAmmunitionEffects, type CombatAmmunition } from '@/lib/ammunition-effects';

/** Escolha explícita de pacote. A duração abstrata da munição continua controlada por encontros. */
export function CombatAmmunitionSelector({ ammunition, selectedId, onSelect, disabled, requiresCalibreGrosso }: {
  ammunition: CombatAmmunition[]; selectedId: string; onSelect: (id: string) => void; disabled: boolean; requiresCalibreGrosso: boolean;
}) {
  const selected = ammunition.find(item => item.id === selectedId);
  const effects = getAmmunitionEffects(selected);
  return <section className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm text-foreground">
    <label className="block">Munição usada neste ataque
      <select aria-label="Munição usada neste ataque" className="block w-full mt-1 p-2 rounded border bg-background" value={selectedId} disabled={disabled} onChange={event => onSelect(event.target.value)}>
        <option value="">Conferência manual — sem pacote selecionado</option>
        {ammunition.map(item => <option key={item.id} value={item.id}>{item.name}{item.calibreGrosso ? ' — calibre grosso' : ''}</option>)}
      </select>
    </label>
    {effects.criticalMultiplierBonus > 0 && <p>Dum dum: +1 no multiplicador de crítico.</p>}
    {effects.explosiveDice > 0 && <p>Explosiva: +2d6 de dano adicional, sem multiplicar no crítico.</p>}
    {requiresCalibreGrosso && !selected && <p role="status" className="text-amber-300">Calibre Grosso exige selecionar um pacote compatível antes de atacar.</p>}
    <p className="text-xs text-muted-foreground">A seleção aplica apenas os efeitos deste pacote. Não desconta uma bala por rolagem: o Livro Base usa duração por encontros.</p>
  </section>;
}
