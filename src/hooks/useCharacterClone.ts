/**
 * Hook para clonar personagens
 * Permite criar uma cópia de um personagem existente para uso em nova campanha
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CloneResult {
  success: boolean;
  characterId?: string;
  error?: string;
}

export function useCharacterClone() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCloning, setIsCloning] = useState(false);

  /**
   * Clona um personagem existente
   * @param sourceCharacterId ID do personagem a ser clonado
   * @param newName Nome opcional para o clone (default: "Nome (Cópia)")
   * @param campaignId ID da campanha para vincular automaticamente (opcional)
   * @returns Resultado da clonagem com ID do novo personagem
   */
  const cloneCharacter = async (
    sourceCharacterId: string,
    newName?: string,
    campaignId?: string
  ): Promise<CloneResult> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsCloning(true);

    try {
      // Buscar dados completos do personagem original
      const { data: source, error: fetchError } = await supabase
        .from('characters')
        .select('*')
        .eq('id', sourceCharacterId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !source) {
        throw new Error('Personagem não encontrado ou sem permissão');
      }

      // Preparar dados do clone (remove campos de identificação e timestamps)
      const cloneData = {
        user_id: user.id,
        name: newName || `${source.name} (Cópia)`,
        player_name: source.player_name,
        origin: source.origin,
        class: source.class,
        nex: source.nex,
        patent: source.patent,
        agility: source.agility,
        strength: source.strength,
        intellect: source.intellect,
        presence: source.presence,
        vigor: source.vigor,
        hp_current: source.hp_max, // Clone começa com status cheios
        hp_max: source.hp_max,
        pe_current: source.pe_max,
        pe_max: source.pe_max,
        san_current: source.san_max,
        san_max: source.san_max,
        defense: source.defense,
        skills: source.skills,
        powers: source.powers,
        background: source.background,
        concept: source.concept,
        age: source.age,
        gender: source.gender,
        appearance: source.appearance,
        personality: source.personality,
        photo_url: source.photo_url, // Reutiliza mesma foto
        movement: source.movement,
        proficiencies: source.proficiencies,
        abilities: source.abilities,
        class_track: source.class_track,
        rituals: source.rituals,
        paranormal_powers: source.paranormal_powers,
        general_powers: source.general_powers,
        versatility_track: source.versatility_track,
        elemental_affinity: source.elemental_affinity,
        conditions: [], // Clone começa sem condições
        inventory: [], // Clone começa sem inventário (missão nova)
        active_buffs: [],
        activated_effects: [],
        active_conditional_bonuses: [],
        affinity_active: false,
      };

      // Inserir o clone
      const { data: newCharacter, error: insertError } = await supabase
        .from('characters')
        .insert(cloneData)
        .select('id')
        .single();

      if (insertError || !newCharacter) {
        throw new Error(insertError?.message || 'Erro ao criar clone');
      }

      // Se há campaignId, vincula automaticamente
      if (campaignId) {
        const { data: memberData, error: memberError } = await supabase
          .from('campaign_members')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('user_id', user.id)
          .single();

        if (memberData && !memberError) {
          await supabase
            .from('campaign_members')
            .update({ character_id: newCharacter.id })
            .eq('id', memberData.id);
        }
      }

      toast({
        title: 'Personagem clonado!',
        description: `${cloneData.name} está pronto para uma nova missão.`,
      });

      return { success: true, characterId: newCharacter.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: 'Erro ao clonar',
        description: message,
        variant: 'destructive',
      });

      return { success: false, error: message };
    } finally {
      setIsCloning(false);
    }
  };

  return {
    cloneCharacter,
    isCloning,
  };
}
