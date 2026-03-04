/**
 * BulkDamageModal - Modal para aplicar dano em múltiplos personagens
 * 
 * Permite selecionar alvos e aplicar dano em área.
 * 
 * @module components/campaign/v3/master/BulkDamageModal
 */

import { memo, useState, useCallback } from 'react';
import {
  Sword as SwordIcon,
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { CampaignMemberV2 } from '@/hooks/campaign/useCampaignData';

interface BulkDamageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: CampaignMemberV2[];
  onApplyDamage: (characterIds: string[], damage: number) => Promise<void>;
  isUpdating?: boolean;
}

export const BulkDamageModal = memo(function BulkDamageModal({
  open,
  onOpenChange,
  members,
  onApplyDamage,
  isUpdating,
}: BulkDamageModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [damage, setDamage] = useState('');

  // Filtra apenas jogadores com personagem
  const playersWithChar = members.filter(m => m.characters && m.role !== 'master');

  // Toggle seleção
  const toggleSelect = useCallback((charId: string) => {
    setSelectedIds(prev =>
      prev.includes(charId)
        ? prev.filter(id => id !== charId)
        : [...prev, charId]
    );
  }, []);

  // Selecionar todos
  const selectAll = useCallback(() => {
    const allIds = playersWithChar.map(m => m.characters!.id);
    setSelectedIds(prev => prev.length === allIds.length ? [] : allIds);
  }, [playersWithChar]);

  // Aplicar dano
  const handleApply = useCallback(async () => {
    const dmg = parseInt(damage);
    if (isNaN(dmg) || dmg <= 0 || selectedIds.length === 0) return;

    await onApplyDamage(selectedIds, dmg);
    setSelectedIds([]);
    setDamage('');
    onOpenChange(false);
  }, [damage, selectedIds, onApplyDamage, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SwordIcon weight="duotone" className="h-5 w-5 text-destructive" />
            Dano em Área
          </DialogTitle>
          <DialogDescription>
            Selecione os alvos e o valor do dano a ser aplicado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Valor de dano */}
          <div className="space-y-2">
            <Label htmlFor="damage-value" className="text-sm">Dano</Label>
            <Input
              id="damage-value"
              type="number"
              min="1"
              value={damage}
              onChange={(e) => setDamage(e.target.value)}
              placeholder="Ex: 15"
              className="text-lg font-mono"
              autoFocus
            />
          </div>

          {/* Seleção de alvos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Alvos</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px]"
                onClick={selectAll}
              >
                {selectedIds.length === playersWithChar.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
            </div>

            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {playersWithChar.map((member) => {
                const char = member.characters!;
                const isSelected = selectedIds.includes(char.id);
                return (
                  <label
                    key={char.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                      isSelected ? 'bg-destructive/10 border border-destructive/30' : 'hover:bg-muted',
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(char.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{char.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        PV {char.hp_current}/{char.hp_max}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleApply}
            disabled={isUpdating || selectedIds.length === 0 || !damage || parseInt(damage) <= 0}
          >
            Aplicar Dano ({selectedIds.length} alvos)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default BulkDamageModal;
