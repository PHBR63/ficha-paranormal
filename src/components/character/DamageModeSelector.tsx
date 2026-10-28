import { Button } from '@/components/ui/button';
import { resolveDamageMode, type DamageMode } from '@/lib/nonlethal-damage';

interface Props {
  weaponType: string;
  naturallyNonlethal?: boolean;
  allowsLethalWithoutPenalty?: boolean;
  value: DamageMode;
  onChange: (mode: DamageMode) => void;
}

/** Declara a letalidade antes dos dados e torna a penalidade visível. */
export function DamageModeSelector({ weaponType, naturallyNonlethal, allowsLethalWithoutPenalty, value, onChange }: Props) {
  const selected = resolveDamageMode({ weaponType, naturallyNonlethal, allowsLethalWithoutPenalty }, value);
  const canConvert = weaponType === 'Briga' || weaponType === 'Corpo a Corpo';
  return <fieldset className="rounded-md border border-border bg-background/60 p-3 space-y-2">
    <legend className="px-1 text-sm font-medium">Tipo de dano deste ataque</legend>
    <div role="radiogroup" aria-label="Tipo de dano" className="grid grid-cols-2 gap-2">
      {(['lethal', 'nonlethal'] as const).map(mode => {
        const option = resolveDamageMode({ weaponType, naturallyNonlethal, allowsLethalWithoutPenalty }, mode);
        return <Button key={mode} type="button" size="sm" variant={value === mode ? 'default' : 'outline'}
          role="radio" aria-checked={value === mode} disabled={!option.allowed}
          onClick={() => onChange(mode)}>
          {mode === 'lethal' ? 'Letal' : 'Não letal'}{option.penalty === -5 ? ' (−5)' : ''}
        </Button>;
      })}
    </div>
    <p className="text-xs text-muted-foreground">
      {!canConvert ? 'Ataques à distância comuns permanecem letais.'
        : selected.penalty === -5 ? 'Conversão declarada: −5 no teste de ataque.'
          : selected.mode === 'lethal' && allowsLethalWithoutPenalty ? 'Sua habilidade permite dano letal sem penalidade.'
          : selected.naturalMode === 'nonlethal' ? 'Este ataque é não letal por padrão.' : 'Dano letal padrão.'}
    </p>
  </fieldset>;
}
