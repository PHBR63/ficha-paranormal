/**
 * MemberConditionsPanel - Painel para visualizar/editar condições dos membros
 * 
 * ARQUITETURA: Usa refs para estabilizar onMemberUpdate e evitar loops #185
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CharacterConditions } from './CharacterConditions';
import { Loader2, Crown, Shield, Crosshair, Skull, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberWithCharacter {
  id: string;
  user_id: string;
  character_id: string | null;
  role: string;
  profiles?: {
    display_name: string | null;
  };
  characters?: {
    id: string;
    name: string;
    class: string;
    nex: number;
    hp_current: number;
    hp_max: number;
    conditions: string[];
  } | null;
}

interface MemberConditionsPanelProps {
  members: MemberWithCharacter[];
  isMaster: boolean;
  onMemberUpdate?: () => void;
}

const CLASS_ICONS: Record<string, typeof Shield> = {
  'Combatente': Shield,
  'Especialista': Crosshair,
  'Ocultista': Skull,
};

export function MemberConditionsPanel({
  members,
  isMaster,
  onMemberUpdate,
}: MemberConditionsPanelProps) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  // Refs para estabilização (Padrão Ref-First - evita loops #185)
  const toastRef = useRef(toast);
  const onMemberUpdateRef = useRef(onMemberUpdate);

  useEffect(() => { toastRef.current = toast; }, [toast]);
  useEffect(() => { onMemberUpdateRef.current = onMemberUpdate; }, [onMemberUpdate]);

  const membersWithCharacters = members.filter(m => m.characters);

  // Atualiza condições com refs estabilizadas
  const updateConditions = useCallback(async (characterId: string, conditions: string[]) => {
    setUpdating(characterId);
    try {
      const { error } = await supabase
        .from('characters')
        .update({ conditions })
        .eq('id', characterId);

      if (error) throw error;

      // Usa ref para evitar que mudança de callback cause re-render
      onMemberUpdateRef.current?.();
      
      toastRef.current({
        title: 'Condições atualizadas',
        description: 'As condições do personagem foram atualizadas.',
      });
    } catch (error: any) {
      toastRef.current({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  }, []); // Sem dependências - usa refs

  if (membersWithCharacters.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum jogador com personagem na campanha</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {membersWithCharacters.map((member) => {
        const character = member.characters!;
        const ClassIcon = CLASS_ICONS[character.class] || Shield;
        const hpPercent = (character.hp_current / character.hp_max) * 100;
        const conditions = Array.isArray(character.conditions) ? character.conditions : [];

        return (
          <div
            key={member.id}
            className={cn(
              'ordo-panel p-4 transition-all',
              updating === character.id && 'opacity-50'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Character Icon */}
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                hpPercent > 50 ? 'bg-muted' : hpPercent > 25 ? 'bg-warning/20' : 'bg-destructive/20'
              )}>
                <ClassIcon className={cn(
                  'w-5 h-5',
                  hpPercent > 50 ? 'text-muted-foreground' : hpPercent > 25 ? 'text-warning' : 'text-destructive'
                )} />
              </div>

              <div className="flex-1 min-w-0">
                {/* Character Info */}
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-display text-sm tracking-wider truncate">
                    {character.name}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    NEX {character.nex}%
                  </span>
                </div>

                {/* HP Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">PV</span>
                    <span className={cn(
                      hpPercent > 50 ? 'text-foreground' : hpPercent > 25 ? 'text-warning' : 'text-destructive'
                    )}>
                      {character.hp_current}/{character.hp_max}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all rounded-full',
                        hpPercent > 50 ? 'bg-health' : hpPercent > 25 ? 'bg-warning' : 'bg-destructive'
                      )}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>

                {/* Conditions */}
                <CharacterConditions
                  conditions={conditions}
                  onConditionsChange={isMaster ? (newConditions) => updateConditions(character.id, newConditions) : undefined}
                  readonly={!isMaster}
                />
              </div>
            </div>

            {updating === character.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
