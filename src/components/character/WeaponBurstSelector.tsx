import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getWeaponBurstCapabilities, resolveWeaponBurst, type BurstWeapon } from '@/lib/weapon-burst';
import { parseWeaponDamage as parseDamageString } from '@/lib/weapon-damage-formula';

/** Opção compartilhada desktop/mobile; escolha explícita e bloqueada durante/depois da confirmação. */
export function WeaponBurstSelector({ weapon, enabled, onChange, disabled, damage, criticalMultiplier }: {
  weapon: BurstWeapon; enabled: boolean; onChange: (enabled: boolean) => void; disabled: boolean;
  damage: string; criticalMultiplier: number;
}) {
  if (!getWeaponBurstCapabilities(weapon).available) return null;
  const burst = resolveWeaponBurst(weapon, true);
  const parsed = parseDamageString(damage);
  return <section aria-label="Modo de disparo automático" className="space-y-2 rounded-lg border border-detail-accent/40 bg-detail-accent/5 p-3 text-sm">
    <div className="flex items-center gap-2"><Checkbox id="weapon-burst" checked={enabled} disabled={disabled} onCheckedChange={value => onChange(value === true)} />
      <Label htmlFor="weapon-burst" className="text-detail-accent">Disparar em rajada</Label></div>
    <p>{enabled ? 'Rajada selecionada' : 'Tiro único selecionado'} · {burst.compensated ? 'Compensador anula o −1d20 da rajada' : 'Rajada: −1d20 no teste de ataque'}.</p>
    <p>Se acertar: +1 dado do mesmo tipo da arma, multiplicado no crítico junto aos dados da arma. Sem custo extra de PE.</p>
    <p>Dados da arma em rajada: {parsed.count + 1}d{parsed.size}; no crítico ×{criticalMultiplier}: {(parsed.count + 1) * criticalMultiplier}d{parsed.size}. Outros bônus ficam separados.</p>
    <p className="text-xs text-muted-foreground">Livro Base, pp. 59–60 e 84. Munição e condições de uso continuam sendo conferidas pelo fluxo de ataque.</p>
  </section>;
}
