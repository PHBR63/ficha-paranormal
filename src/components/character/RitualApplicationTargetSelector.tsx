import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRitualApplicationTargets } from '@/hooks/character/useRitualApplicationTargets';

interface RitualApplicationTargetSelectorProps {
  characterId: string;
  value: string | null;
  onChange: (characterId: string) => void;
  disabled?: boolean;
}

/** Exige escolha explícita: calcular dano nunca seleciona automaticamente o conjurador. */
export function RitualApplicationTargetSelector({ characterId, value, onChange, disabled }: RitualApplicationTargetSelectorProps) {
  const id = useId();
  const { targets, isLoading, error, refetch } = useRitualApplicationTargets(characterId);
  const validSelection = targets.some(target => target.id === value);
  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label htmlFor={id}>Ficha que receberá o efeito</Label>
      <Select value={validSelection ? value! : undefined} onValueChange={onChange} disabled={disabled || isLoading || Boolean(error)}>
        <SelectTrigger id={id} aria-describedby={`${id}-warning`}>
          <SelectValue placeholder={isLoading ? 'Carregando fichas autorizadas…' : 'Selecione o alvo explicitamente'} />
        </SelectTrigger>
        <SelectContent>
          {targets.map(target => <SelectItem key={target.id} value={target.id}>{target.name} — PV {target.hp_current}/{target.hp_max}</SelectItem>)}
        </SelectContent>
      </Select>
      <p id={`${id}-warning`} className="text-xs text-muted-foreground">O efeito será aplicado à ficha selecionada. Confira o alvo e o resultado antes de aplicar. Sem alvo, o resultado permanece para resolução manual.</p>
      {error && <div role="alert" className="space-y-1 text-sm text-destructive">
        <p>Não foi possível carregar os alvos autorizados.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>Tentar novamente</Button>
      </div>}
      {!isLoading && !error && targets.length === 0 && <p role="status" className="text-sm text-muted-foreground">Nenhuma ficha autorizada disponível para aplicação.</p>}
    </div>
  );
}
