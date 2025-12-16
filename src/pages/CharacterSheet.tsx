/**
 * CharacterSheet - Ficha de personagem redesenhada
 * Layout de 2 colunas em desktop estilo ficha de papel
 * Com bordas roxas, acordeões colapsáveis e visual temático
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  ArrowLeft, 
  Loader2, 
  Edit2,
  Trash2,
  Moon,
  Sparkles,
  BookOpen,
  Users,
  Package,
  Heart,
  FileText,
  Skull,
  MoreVertical,
  History,
  Dices,
  Palette,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ORIGINS, CLASSES, getTrackById } from '@/lib/character-data';
import { ALL_RITUALS } from '@/lib/rituals-data';
import { ALL_CLASS_ABILITIES } from '@/lib/class-abilities';
import { PARANORMAL_POWERS, ParanormalPower, ParanormalElement } from '@/lib/paranormal-powers';
import { GENERAL_POWERS, getGeneralPowerById } from '@/lib/general-powers';
import { ParanormalPowersPanel } from '@/components/character/ParanormalPowersPanel';
import { cn } from '@/lib/utils';
import { DiceRollResult } from '@/lib/dice-roller';
import { InventoryPanel } from '@/components/inventory/InventoryPanel';
import { InventoryItem } from '@/lib/inventory-system';
import { NexProgressionModal } from '@/components/character/NexProgressionModal';
import { RitualSelectionModal } from '@/components/character/RitualSelectionModal';
import { CharacterEditModal } from '@/components/character/CharacterEditModal';
import { CharacterHistoryPanel, logCharacterChanges } from '@/components/character/CharacterHistoryPanel';
import { ParanormalPowerSelectModal } from '@/components/character/ParanormalPowerSelectModal';
import { ConditionManager, type ActiveCondition } from '@/components/character/ConditionManager';
import { RestModal } from '@/components/character/RestModal';
import { NonOccultistRitualModal, RitualSource } from '@/components/character/NonOccultistRitualModal';
import { LearnedRitual } from '@/components/character/GeneralPowersPanel';
import { calculateDerivedStats } from '@/lib/character-data';
import { AffinitySelectorCard } from '@/components/character/AffinitySelectorCard';
import { useParanormalEffects } from '@/hooks/useParanormalEffects';
import { useDefenseBonuses } from '@/hooks/useDefenseBonuses';

// Novos componentes do redesign 2.0 (estilo ficha de papel)
import { CharacterSheetHeader } from '@/components/character/CharacterSheetHeader';
import { AttributeGridNew } from '@/components/character/AttributeGridNew';
import { SkillsByAttribute } from '@/components/character/SkillsByAttribute';
import { PersonalDataAccordion } from '@/components/character/PersonalDataAccordion';
import { CombatWeaponsTable } from '@/components/character/CombatWeaponsTable';
import { SheetAccordionSection, SheetAccordionItem } from '@/components/character/SheetAccordionSection';

// Componentes existentes que ainda usamos
import { CharacterSheetHelp } from '@/components/character/CharacterSheetHelp';
import { MobileCharacterSheet } from '@/components/character/MobileCharacterSheet';
import { DiceRollModal } from '@/components/dice/DiceRollModal';
import { DiceRollHistoryDrawer, DiceRollHistoryCompact } from '@/components/dice/DiceRollHistory';

// Interface estendida para itens do inventário com todos os campos persistidos
interface InventoryItemPersisted {
  id?: string;
  name: string;
  category: string;
  slots: number;
  quantity?: number;
  itemType?: string;
  isEquipped?: boolean;
  equipSlot?: string;
  description?: string;
  // Campos de armas
  damage?: string;
  damageType?: string;
  critical?: number;
  criticalMultiplier?: number;
  range?: string;
  special?: string;
  ammoType?: string;
  // Campos de armaduras
  rd?: number;
  agilityPenalty?: number;
  speedPenalty?: number;
  armorType?: string;
  // Campos de consumíveis
  effect?: string;
  uses?: number;
  maxUses?: number;
  consumable?: boolean;
}

// Interface do personagem
interface Character {
  id: string;
  name: string;
  player_name: string | null;
  origin: string;
  class: string;
  class_track: string | null;
  nex: number;
  patent: string;
  agility: number;
  strength: number;
  intellect: number;
  presence: number;
  vigor: number;
  hp_current: number;
  hp_max: number;
  pe_current: number;
  pe_max: number;
  san_current: number;
  san_max: number;
  defense: number;
  movement: number;
  skills: Record<string, number>;
  powers: Array<{ name: string; description: string }>;
  abilities: string[];
  inventory: InventoryItemPersisted[];
  rituals: string[];
  background: string | null;
  notes: string | null;
  conditions: string[];
  photo_url?: string | null;
  age?: number | null;
  gender?: string | null;
  appearance?: string | null;
  personality?: string | null;
  // Campos de poderes paranormais e afinidade elemental
  paranormal_powers?: Array<{ id: string; name: string; element: string; description: string }>;
  general_powers?: Array<{ id: string; name: string; description: string; category?: string }>;
  elemental_affinity?: string | null;
  affinity_active?: boolean;
}

export default function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Estados principais
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Stats editáveis
  const [hpCurrent, setHpCurrent] = useState(0);
  const [peCurrent, setPeCurrent] = useState(0);
  const [sanCurrent, setSanCurrent] = useState(0);
  
  // Estado da modal de rolagem imediata
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [rollLabel, setRollLabel] = useState('');
  const [rollAttribute, setRollAttribute] = useState(0);
  const [rollSkillBonus, setRollSkillBonus] = useState(0);
  
  // Histórico de rolagens
  const [rollHistory, setRollHistory] = useState<DiceRollResult[]>([]);
  
  // Modais
  const [nexModalOpen, setNexModalOpen] = useState(false);
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [pendingRitualSlots, setPendingRitualSlots] = useState(0);
  const [pendingMaxCircle, setPendingMaxCircle] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [restModalOpen, setRestModalOpen] = useState(false);
  const [paranormalPowerModalOpen, setParanormalPowerModalOpen] = useState(false);
  
  // Modal de rituais para não-ocultistas
  const [nonOccultistRitualModalOpen, setNonOccultistRitualModalOpen] = useState(false);
  const [ritualModalSource, setRitualModalSource] = useState<RitualSource>('ritual-aprendido');
  const [learnedRitualsFromPowers, setLearnedRitualsFromPowers] = useState<LearnedRitual[]>([]);

  // Callback para adicionar rolagem ao histórico
  const handleRollComplete = useCallback((result: DiceRollResult) => {
    setRollHistory(prev => [result, ...prev].slice(0, 50));
  }, []);

  // Limpar histórico
  const handleClearHistory = useCallback(() => {
    setRollHistory([]);
  }, []);

  // Fetch character data
  useEffect(() => {
    async function fetchCharacter() {
      if (!id || !user) return;

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        toast({
          title: 'Erro',
          description: 'Personagem não encontrado.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      const charData = {
        ...data,
        conditions: Array.isArray(data.conditions) ? data.conditions as string[] : [],
        abilities: Array.isArray(data.abilities) ? data.abilities as string[] : [],
        rituals: Array.isArray(data.rituals) ? data.rituals as string[] : [],
        class_track: data.class_track || null,
        elemental_affinity: data.elemental_affinity || null,
        affinity_active: data.affinity_active || false,
      };
      setCharacter(charData as unknown as Character);
      setHpCurrent(data.hp_current);
      setPeCurrent(data.pe_current);
      setSanCurrent(data.san_current);
      setLoading(false);
    }

    fetchCharacter();
  }, [id, user, navigate, toast]);

  // Handler para rolar atributo
  const handleAttributeRoll = useCallback((attributeValue: number, attributeName: string) => {
    setRollLabel(attributeName);
    setRollAttribute(attributeValue);
    setRollSkillBonus(0);
    setDiceModalOpen(true);
  }, []);

  // Handler para rolar perícia
  const handleSkillRoll = useCallback((total: number, skillName: string, attributeValue: number) => {
    const skillBonus = total - attributeValue;
    setRollLabel(skillName);
    setRollAttribute(attributeValue);
    setRollSkillBonus(skillBonus);
    setDiceModalOpen(true);
  }, []);

  // Handler para mudança de stats
  const handleCombatStatsChange = async (stats: { hp: number; pe: number; san: number }) => {
    if (!character) return;

    const { error } = await supabase
      .from('characters')
      .update({
        hp_current: stats.hp,
        pe_current: stats.pe,
        san_current: stats.san,
      })
      .eq('id', character.id);

    if (!error) {
      setHpCurrent(stats.hp);
      setPeCurrent(stats.pe);
      setSanCurrent(stats.san);
      setCharacter(prev => prev ? {
        ...prev,
        hp_current: stats.hp,
        pe_current: stats.pe,
        san_current: stats.san,
      } : null);
    }
  };

  // Handler para deletar personagem
  const handleDelete = async () => {
    if (!character) return;
    
    if (!confirm(`Tem certeza que deseja excluir ${character.name}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', character.id);

    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Personagem excluído',
        description: `${character.name} foi removido do sistema.`,
      });
      navigate('/dashboard');
    }
  };

  // Handler para progressão de NEX
  const handleLevelUp = async (newNex: number, newStats: {
    hp_max: number;
    pe_max: number;
    san_max: number;
    patent: string;
    newAbilities: string[];
    elemental_affinity?: ParanormalElement | null;
    affinity_active?: boolean;
    paranormal_powers?: ParanormalPower[];
  }) => {
    if (!character) return;

    const updatedAbilities = [
      ...character.abilities,
      ...newStats.newAbilities,
    ];

    // Prepara poderes paranormais atualizados
    const updatedParanormalPowers = newStats.paranormal_powers 
      ? newStats.paranormal_powers.map(p => ({
          id: p.id,
          name: p.name,
          element: p.element,
          description: p.description,
        }))
      : character.paranormal_powers;

    const { error } = await supabase
      .from('characters')
      .update({
        nex: newNex,
        hp_max: newStats.hp_max,
        hp_current: hpCurrent + (newStats.hp_max - character.hp_max),
        pe_max: newStats.pe_max,
        pe_current: peCurrent + (newStats.pe_max - character.pe_max),
        san_max: newStats.san_max,
        san_current: sanCurrent + (newStats.san_max - character.san_max),
        patent: newStats.patent,
        abilities: updatedAbilities,
        elemental_affinity: newStats.elemental_affinity ?? character.elemental_affinity,
        affinity_active: newStats.affinity_active ?? character.affinity_active,
        paranormal_powers: updatedParanormalPowers,
      })
      .eq('id', character.id);

    if (error) {
      toast({
        title: 'Erro ao subir de NEX',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    const newHpCurrent = hpCurrent + (newStats.hp_max - character.hp_max);
    const newPeCurrent = peCurrent + (newStats.pe_max - character.pe_max);
    const newSanCurrent = sanCurrent + (newStats.san_max - character.san_max);

    setCharacter(prev => prev ? {
      ...prev,
      nex: newNex,
      hp_max: newStats.hp_max,
      hp_current: newHpCurrent,
      pe_max: newStats.pe_max,
      pe_current: newPeCurrent,
      san_max: newStats.san_max,
      san_current: newSanCurrent,
      patent: newStats.patent,
      abilities: updatedAbilities,
      elemental_affinity: newStats.elemental_affinity ?? prev.elemental_affinity,
      affinity_active: newStats.affinity_active ?? prev.affinity_active,
      paranormal_powers: updatedParanormalPowers,
    } : null);

    setHpCurrent(newHpCurrent);
    setPeCurrent(newPeCurrent);
    setSanCurrent(newSanCurrent);

    toast({
      title: `NEX aumentado para ${newNex}%!`,
      description: `${character.name} subiu de nível!`,
    });

    // Verifica se Ocultista ganhou novos slots de ritual
    if (character.class === 'Ocultista') {
      const ocultistClass = CLASSES.find(c => c.id === 'Ocultista') as any;
      const ritualsPerNex = ocultistClass?.ritualsPerNex || {};
      
      const oldRitualInfo = ritualsPerNex[character.nex] || { count: 0, maxCircle: 1 };
      const newRitualInfo = ritualsPerNex[newNex] || { count: 0, maxCircle: 1 };
      
      const newSlots = newRitualInfo.count - oldRitualInfo.count;
      
      if (newSlots > 0) {
        setPendingRitualSlots(newSlots);
        setPendingMaxCircle(newRitualInfo.maxCircle);
        setRitualModalOpen(true);
      }
    }
  };

  // Handler para salvar novos rituais
  const handleRitualsConfirm = async (selectedRituals: string[]) => {
    if (!character) return;

    const updatedRituals = [...character.rituals, ...selectedRituals];

    const { error } = await supabase
      .from('characters')
      .update({ rituals: updatedRituals })
      .eq('id', character.id);

    if (error) {
      toast({
        title: 'Erro ao salvar rituais',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    setCharacter(prev => prev ? { ...prev, rituals: updatedRituals } : null);

    toast({
      title: 'Novos rituais aprendidos!',
      description: `${selectedRituals.length} ritual(is) adicionado(s).`,
    });
  };

  // Handler para adicionar poder paranormal
  const handleParanormalPowerSelect = async (power: ParanormalPower) => {
    if (!character) return;

    const currentPowers = character.paranormal_powers || [];
    const newPower = {
      id: power.id,
      name: power.name,
      element: power.element,
      description: power.description,
    };
    
    const updatedPowers = [...currentPowers, newPower];

    const { error } = await supabase
      .from('characters')
      .update({ paranormal_powers: updatedPowers })
      .eq('id', character.id);

    if (error) {
      toast({
        title: 'Erro ao salvar poder',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setCharacter(prev => prev ? { ...prev, paranormal_powers: updatedPowers } : null);
    setParanormalPowerModalOpen(false);

    toast({
      title: 'Poder Paranormal adquirido!',
      description: `${power.name} foi adicionado.`,
    });
  };

  // Verifica se o personagem tem a habilidade Transcender
  const hasTranscender = useMemo(() => {
    if (!character) return false;
    const abilities = character.abilities || [];
    return abilities.some(a => 
      typeof a === 'string' 
        ? a.toLowerCase().includes('transcender')
        : false
    );
  }, [character?.abilities]);

  // Handler para edição do personagem
  const handleCharacterEdit = async (data: {
    name: string;
    player_name: string | null;
    age: number | null;
    gender: string | null;
    appearance: string | null;
    personality: string | null;
    background: string | null;
    notes: string | null;
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
    skills: Record<string, number>;
    defense: number;
    photo_url: string | null;
  }) => {
    if (!character || !user) return;

    const newStats = calculateDerivedStats(
      character.class,
      data.vigor,
      data.presence,
      character.nex,
      character.origin
    );

    // Registra alterações
    const changes: Array<{
      changeType: string;
      fieldName: string;
      oldValue: string | null;
      newValue: string | null;
      description?: string;
    }> = [];

    if (data.name !== character.name) {
      changes.push({ changeType: 'info', fieldName: 'name', oldValue: character.name, newValue: data.name });
    }
    if ((data.player_name || '') !== (character.player_name || '')) {
      changes.push({ changeType: 'info', fieldName: 'player_name', oldValue: character.player_name, newValue: data.player_name });
    }
    if ((data.background || '') !== (character.background || '')) {
      changes.push({ changeType: 'info', fieldName: 'background', oldValue: character.background, newValue: data.background });
    }
    if (data.photo_url !== (character.photo_url || null)) {
      changes.push({ changeType: 'photo', fieldName: 'photo_url', oldValue: 'Foto anterior', newValue: 'Nova foto' });
    }

    const { error } = await supabase
      .from('characters')
      .update({
        name: data.name,
        player_name: data.player_name,
        age: data.age,
        gender: data.gender,
        appearance: data.appearance,
        personality: data.personality,
        background: data.background,
        notes: data.notes,
        agility: data.agility,
        strength: data.strength,
        intellect: data.intellect,
        presence: data.presence,
        vigor: data.vigor,
        skills: data.skills,
        defense: data.defense,
        photo_url: data.photo_url,
        hp_max: newStats.hp,
        pe_max: newStats.pe,
        san_max: newStats.san,
        hp_current: Math.min(hpCurrent, newStats.hp),
        pe_current: Math.min(peCurrent, newStats.pe),
        san_current: Math.min(sanCurrent, newStats.san),
      })
      .eq('id', character.id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }

    if (changes.length > 0) {
      await logCharacterChanges(character.id, user.id, changes);
    }

    setCharacter(prev => prev ? {
      ...prev,
      name: data.name,
      player_name: data.player_name,
      background: data.background,
      notes: data.notes,
      agility: data.agility,
      strength: data.strength,
      intellect: data.intellect,
      presence: data.presence,
      vigor: data.vigor,
      skills: data.skills,
      defense: data.defense,
      photo_url: data.photo_url,
      hp_max: newStats.hp,
      pe_max: newStats.pe,
      san_max: newStats.san,
      age: data.age,
      gender: data.gender,
      appearance: data.appearance,
      personality: data.personality,
    } : null);

    setHpCurrent(Math.min(hpCurrent, newStats.hp));
    setPeCurrent(Math.min(peCurrent, newStats.pe));
    setSanCurrent(Math.min(sanCurrent, newStats.san));

    toast({
      title: 'Personagem atualizado!',
      description: 'Alterações salvas.',
    });
  };

  // Calcula bônus de poderes paranormais (DEVE vir antes de qualquer return condicional)
  const paranormalEffects = useParanormalEffects({
    powers: character ? (character.paranormal_powers || []).map(p => {
      const fullPower = PARANORMAL_POWERS.find(fp => fp.id === p.id);
      return fullPower || {
        id: p.id,
        name: p.name,
        element: p.element as ParanormalElement | 'generic',
        description: p.description,
        effect: { type: 'special' as const, description: p.description },
      };
    }) : [],
    nex: character?.nex || 0,
    elementalAffinity: (character?.elemental_affinity as ParanormalElement | null) || null,
    affinityActive: character?.affinity_active || false,
  });

  // Calcular proteção total de armaduras equipadas (DEVE vir antes de qualquer return condicional)
  const armorStats = useMemo(() => {
    if (!character) {
      return {
        totalRD: 0,
        totalAgilityPenalty: 0,
        totalSpeedPenalty: 0,
        hasArmor: false,
        equippedArmors: [],
      };
    }
    
    const equippedArmors = character.inventory
      .filter(item => item.isEquipped && item.itemType === 'armor' && item.rd !== undefined);
    
    const totalRD = equippedArmors.reduce((sum, armor) => sum + (armor.rd || 0), 0);
    const totalAgilityPenalty = equippedArmors.reduce((sum, armor) => sum + (armor.agilityPenalty || 0), 0);
    const totalSpeedPenalty = equippedArmors.reduce((sum, armor) => sum + (armor.speedPenalty || 0), 0);
    
    return {
      totalRD,
      totalAgilityPenalty,
      totalSpeedPenalty,
      hasArmor: equippedArmors.length > 0,
      equippedArmors: equippedArmors.map(a => ({ name: a.name, rd: a.rd || 0 })),
    };
  }, [character?.inventory]);

  // Calcular bônus de defesa de origem, habilidades de classe e poderes gerais
  const defenseBonuses = useDefenseBonuses({
    origin: character?.origin || '',
    abilities: character?.abilities || [],
    generalPowers: character?.general_powers || [],
    inventory: character?.inventory || [],
  });

  // Bônus total de defesa combinando todas as fontes
  const totalDefenseBonus = paranormalEffects.defenseBonus + defenseBonuses.totalBonus;
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!character) return null;

  // Verificar sanidade baixa para efeito visual
  const sanPercentage = (sanCurrent / character.san_max) * 100;
  const isSanLow = sanPercentage < 30;
  
  // Verificar se precisa escolher afinidade elemental (NEX >= 50 e sem afinidade)
  const needsAffinitySelection = character.nex >= 50 && !character.elemental_affinity;

  // Handler para salvar afinidade elemental
  const handleSelectAffinity = async (element: ParanormalElement) => {
    const { error } = await supabase
      .from('characters')
      .update({ 
        elemental_affinity: element,
        affinity_active: true 
      })
      .eq('id', character.id);

    if (error) {
      toast({
        title: 'Erro ao salvar afinidade',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setCharacter(prev => prev ? { 
      ...prev, 
      elemental_affinity: element,
      affinity_active: true 
    } : null);

    toast({
      title: 'Afinidade Elemental definida!',
      description: `Você agora tem afinidade com ${element}.`,
    });
  };

  // Preparar atributos
  const attributes = {
    agility: character.agility,
    strength: character.strength,
    intellect: character.intellect,
    presence: character.presence,
    vigor: character.vigor,
  };

  // Preparar armas para tabela de combate usando dados reais do item
  const equippedWeapons = character.inventory
    .filter(item => item.isEquipped && item.itemType === 'weapon')
    .map(item => ({
      id: item.id || crypto.randomUUID(),
      name: item.name,
      // Determina tipo baseado no range - se tem range é disparo, senão corpo a corpo
      type: (item.range && item.range !== 'Corpo a corpo' ? 'Disparo' : 'Corpo a Corpo') as 'Disparo' | 'Corpo a Corpo',
      // Usa dados reais da arma se disponíveis
      damage: item.damage || '1d6',
      damageType: item.damageType,
      range: item.range,
      critical: item.critical ? `${item.critical}` : undefined,
      criticalMultiplier: item.criticalMultiplier ? `x${item.criticalMultiplier}` : undefined,
      special: item.special,
      ammoType: item.ammoType,
    }));

  // Obter dados da origem
  const originData = ORIGINS.find(o => o.id === character.origin);

  return (
    <div className={cn("min-h-screen bg-background sheet-background", isSanLow && "animate-flicker")}>
      {/* Header fixo - responsivo para mobile */}
      <header className="border-b border-border bg-card/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Lado esquerdo: Voltar + Nome */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Link to="/dashboard" className="flex-shrink-0">
                <Button variant="ghost" size="sm" className="text-muted-foreground h-8 px-2 sm:px-3">
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Voltar</span>
                </Button>
              </Link>
              <h1 className="font-display text-sm sm:text-xl tracking-wider truncate text-primary">
                {character.name}
              </h1>
            </div>
            
            {/* Lado direito: Ações - Desktop */}
            <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
              <ThemeSelector />
              <DiceRollHistoryDrawer 
                rolls={rollHistory}
                onClear={handleClearHistory}
              />
              <CharacterHistoryPanel 
                characterId={character.id} 
                characterName={character.name} 
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="font-display"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                EDITAR
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Lado direito: Menu dropdown - Mobile */}
            <div className="flex sm:hidden items-center gap-1 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
                  <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar Personagem
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    // Abre o histórico de rolagens
                    const historyBtn = document.querySelector('[data-dice-history-trigger]') as HTMLButtonElement;
                    historyBtn?.click();
                  }}>
                    <Dices className="w-4 h-4 mr-2" />
                    Histórico de Dados
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    // Abre o histórico do personagem
                    const charHistoryBtn = document.querySelector('[data-character-history-trigger]') as HTMLButtonElement;
                    charHistoryBtn?.click();
                  }}>
                    <History className="w-4 h-4 mr-2" />
                    Histórico de Alterações
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Personagem
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ThemeSelector />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6">
        {/* Modo mobile: layout compacto */}
        {isMobile ? (
          <MobileCharacterSheet
            character={{
              id: character.id,
              name: character.name,
              class: character.class,
              class_track: character.class_track,
              origin: character.origin,
              nex: character.nex,
              patent: character.patent,
              photo_url: character.photo_url,
              hp_current: hpCurrent,
              hp_max: character.hp_max,
              pe_current: peCurrent,
              pe_max: character.pe_max,
              san_current: sanCurrent,
              san_max: character.san_max,
              defense: character.defense,
              movement: character.movement || 9,
              agility: character.agility,
              strength: character.strength,
              intellect: character.intellect,
              presence: character.presence,
              vigor: character.vigor,
              conditions: character.conditions,
              abilities: character.abilities,
              powers: character.powers,
              rituals: character.rituals,
              // Campos que estavam faltando:
              skills: character.skills,
              paranormal_powers: character.paranormal_powers,
              general_powers: character.general_powers,
              inventory: character.inventory,
            }}
            onOpenDiceRoller={() => {
              setRollLabel('Teste Geral');
              setRollAttribute(character.agility);
              setRollSkillBonus(0);
              setDiceModalOpen(true);
            }}
            onOpenRest={() => setRestModalOpen(true)}
            onLevelUp={() => setNexModalOpen(true)}
            onEditStats={() => setEditModalOpen(true)}
          />
        ) : (
          /* Desktop: Layout de 2 colunas estilo ficha de papel */
          <div className="sheet-grid">
            {/* === COLUNA ESQUERDA === */}
            <div className="space-y-4">
              {/* Cabeçalho com avatar e stats principais */}
              <CharacterSheetHeader
                name={character.name}
                photoUrl={character.photo_url}
                characterClass={character.class}
                origin={originData?.name || character.origin}
                nex={character.nex}
                patent={character.patent}
                hpCurrent={hpCurrent}
                hpMax={character.hp_max}
                peCurrent={peCurrent}
                peMax={character.pe_max}
                sanCurrent={sanCurrent}
                sanMax={character.san_max}
                defense={character.defense}
                movement={character.movement || 9}
                hpBonus={paranormalEffects.hpBonus}
                peBonus={paranormalEffects.peBonus}
                defenseBonus={totalDefenseBonus}
                defenseBonusBreakdown={[
                  // Adiciona bônus paranormais ao breakdown
                  ...(paranormalEffects.defenseBonus > 0 ? [{
                    source: 'Poderes Paranormais',
                    type: 'paranormal' as const,
                    bonus: paranormalEffects.defenseBonus,
                    active: true,
                  }] : []),
                  ...defenseBonuses.breakdown,
                ]}
                armorRD={armorStats.totalRD}
                armorPenalty={armorStats.totalAgilityPenalty}
                equippedArmors={armorStats.equippedArmors}
                onStatsChange={handleCombatStatsChange}
                onLevelUp={() => setNexModalOpen(true)}
              />

              {/* Seletor de Afinidade Elemental (se NEX >= 50 e sem afinidade) */}
              {needsAffinitySelection && (
                <AffinitySelectorCard
                  nex={character.nex}
                  onSelectAffinity={handleSelectAffinity}
                />
              )}

              {/* Dados Pessoais (acordeão) */}
              <PersonalDataAccordion
                data={{
                  name: character.name,
                  playerName: character.player_name,
                  characterClass: character.class,
                  origin: originData?.name || character.origin,
                  age: character.age,
                  gender: character.gender,
                  appearance: character.appearance,
                  personality: character.personality,
                }}
              />

              {/* Grid de Atributos */}
              <AttributeGridNew
                attributes={attributes}
                onRoll={handleAttributeRoll}
              />

              {/* Gerenciador de condições */}
              <div className="sheet-panel p-4">
                <h3 className="font-display text-sm tracking-wider text-primary mb-3 uppercase">
                  Condições Ativas
                </h3>
                <ConditionManager
                  conditions={character.conditions.map(c => {
                    if (typeof c === 'string') {
                      return { id: c.toLowerCase().replace(/\s+/g, ''), name: c, turnsRemaining: null, addedAt: new Date() };
                    }
                    return c as ActiveCondition;
                  })}
                  onConditionsChange={async (newConditions) => {
                    const conditionNames = newConditions.map(c => c.name);
                    const { error } = await supabase
                      .from('characters')
                      .update({ conditions: conditionNames })
                      .eq('id', character.id);

                    if (error) {
                      toast({
                        title: 'Erro ao salvar condições',
                        description: error.message,
                        variant: 'destructive',
                      });
                      return;
                    }

                    setCharacter(prev => prev ? {
                      ...prev,
                      conditions: conditionNames,
                    } : null);
                  }}
                />
              </div>

              {/* Inventário (acordeão) */}
              <SheetAccordionSection
                title="Inventário"
                icon={Package}
                count={character.inventory.length}
                defaultOpen={false}
              >
                <InventoryPanel
                  inventory={character.inventory.map((item) => ({
                    // Usa ID persistido ou gera novo UUID se não existir
                    id: item.id || crypto.randomUUID(),
                    name: item.name,
                    category: (item.category as InventoryItem['category']) || '0',
                    slots: item.slots,
                    quantity: item.quantity || 1,
                    itemType: (item.itemType as any) || 'misc',
                    isEquipped: item.isEquipped || false,
                    equipSlot: item.equipSlot as any,
                    description: item.description,
                    // Campos de armas
                    damage: item.damage,
                    damageType: item.damageType,
                    critical: item.critical,
                    criticalMultiplier: item.criticalMultiplier,
                    range: item.range,
                    special: item.special,
                    ammoType: item.ammoType,
                    // Campos de armaduras
                    rd: item.rd,
                    agilityPenalty: item.agilityPenalty,
                    speedPenalty: item.speedPenalty,
                    armorType: item.armorType,
                    // Campos de consumíveis
                    effect: item.effect,
                    uses: item.uses,
                    maxUses: item.maxUses,
                    consumable: item.consumable,
                  }))}
                  strength={character.strength}
                  patent={character.patent}
                  onInventoryChange={async (newInventory) => {
                    // Persiste TODOS os campos importantes do item
                    const updatedInventory: InventoryItemPersisted[] = newInventory.map(item => ({
                      id: item.id,
                      name: item.name,
                      category: item.category,
                      slots: item.slots,
                      quantity: item.quantity,
                      itemType: item.itemType,
                      isEquipped: item.isEquipped,
                      equipSlot: item.equipSlot,
                      description: (item as any).description,
                      // Campos de armas
                      damage: (item as any).damage,
                      damageType: (item as any).damageType,
                      critical: (item as any).critical,
                      criticalMultiplier: (item as any).criticalMultiplier,
                      range: (item as any).range,
                      special: (item as any).special,
                      ammoType: (item as any).ammoType,
                      // Campos de armaduras
                      rd: (item as any).rd,
                      agilityPenalty: (item as any).agilityPenalty,
                      speedPenalty: (item as any).speedPenalty,
                      armorType: (item as any).armorType,
                      // Campos de consumíveis
                      effect: (item as any).effect,
                      uses: (item as any).uses,
                      maxUses: (item as any).maxUses,
                      consumable: (item as any).consumable,
                    }));
                    
                    const { error } = await supabase
                      .from('characters')
                      .update({ inventory: JSON.parse(JSON.stringify(updatedInventory)) })
                      .eq('id', character.id);

                    if (!error) {
                      setCharacter(prev => prev ? {
                        ...prev,
                        inventory: updatedInventory,
                      } : null);
                    }
                  }}
                />
              </SheetAccordionSection>

              {/* História e Biografia (acordeão) */}
              <SheetAccordionSection
                title="Biografia"
                icon={BookOpen}
                defaultOpen={false}
              >
                {character.background ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {character.background}
                    </p>
                    {character.notes && (
                      <div className="pt-4 border-t border-border/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                          Notas
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {character.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma história registrada. Clique em "Editar" para adicionar.
                  </p>
                )}
              </SheetAccordionSection>

              {/* Histórico de Rolagens Compacto */}
              <div className="sheet-panel p-4">
                <h3 className="font-display text-sm tracking-wider text-primary mb-3 uppercase">
                  Últimas Rolagens
                </h3>
                <DiceRollHistoryCompact 
                  rolls={rollHistory}
                  maxRolls={5}
                />
              </div>
            </div>

            {/* === COLUNA DIREITA === */}
            <div className="space-y-4">
              {/* Tabela de Combate */}
              <CombatWeaponsTable
                weapons={equippedWeapons}
                attributes={attributes}
                skills={character.skills}
                currentPE={peCurrent}
                maxPE={character.pe_max}
                onPEChange={async (newPE) => {
                  const { error } = await supabase
                    .from('characters')
                    .update({ pe_current: newPE })
                    .eq('id', character.id);
                  if (!error) {
                    setPeCurrent(newPE);
                    setCharacter(prev => prev ? { ...prev, pe_current: newPE } : null);
                  }
                }}
                characterClass={character.class}
                abilities={character.abilities || []}
                paranormalPowers={character.paranormal_powers?.map(p => ({
                  id: p.id,
                  name: p.name,
                  element: p.element,
                })) || []}
                hasAffinity={character.affinity_active || false}
                affinityElement={character.elemental_affinity}
                nex={character.nex}
                onRollComplete={handleRollComplete}
              />

              {/* Perícias por Atributo */}
              <SkillsByAttribute
                skills={character.skills}
                attributes={attributes}
                onRoll={handleSkillRoll}
              />

              {/* Habilidades e Poderes (acordeão) */}
              <SheetAccordionSection
                title="Habilidades & Poderes"
                icon={Sparkles}
                count={(character.abilities?.length || 0) + (character.powers?.length || 0)}
                defaultOpen={true}
                variant="paranormal"
              >
                <div className="space-y-3">
                  {/* Habilidades de Classe */}
                  {character.abilities && character.abilities.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Habilidades de Classe
                      </p>
                      {character.abilities.map((abilityName, i) => {
                        // Busca a habilidade na lista de habilidades da classe para obter descrição
                        const abilityData = ALL_CLASS_ABILITIES.find(
                          a => a.name === abilityName && a.classId === character.class
                        );
                        return (
                          <SheetAccordionItem
                            key={i}
                            title={abilityName}
                            description={abilityData?.description}
                            badge="Classe"
                            badgeVariant="default"
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Trilha de Classe */}
                  {character.class_track && (() => {
                    const track = getTrackById(character.class_track);
                    if (!track) return null;
                    const unlockedAbilities = track.abilities.filter(a => a.minNex <= character.nex);
                    return (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Trilha: {track.name}
                        </p>
                        {unlockedAbilities.map((ability) => (
                          <SheetAccordionItem
                            key={ability.id}
                            title={ability.name}
                            description={ability.description}
                            badge={`NEX ${ability.minNex}%`}
                            badgeVariant="secondary"
                          />
                        ))}
                      </div>
                    );
                  })()}

                  {/* Poderes de Origem */}
                  {character.powers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Poderes de Origem
                      </p>
                      {character.powers.map((power, i) => (
                        <SheetAccordionItem
                          key={i}
                          title={power.name}
                          description={power.description}
                          badge="Origem"
                          badgeVariant="paranormal"
                        />
                      ))}
                    </div>
                  )}

                  {/* Poderes Paranormais (usando o novo painel) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Poderes Paranormais
                      </p>
                      {hasTranscender && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-paranormal hover:text-paranormal"
                          onClick={() => setParanormalPowerModalOpen(true)}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Transcender
                        </Button>
                      )}
                    </div>
                    
                    {character.paranormal_powers && character.paranormal_powers.length > 0 ? (
                      <ParanormalPowersPanel
                        powers={character.paranormal_powers.map(p => {
                          const fullPower = PARANORMAL_POWERS.find(fp => fp.id === p.id);
                          return fullPower || {
                            id: p.id,
                            name: p.name,
                            element: p.element as ParanormalElement | 'generic',
                            description: p.description,
                            effect: { type: 'special' as const, description: p.description },
                          };
                        })}
                        elementalAffinity={character.elemental_affinity as ParanormalElement | null}
                        affinityActive={character.affinity_active}
                        nex={character.nex}
                      />
                    ) : hasTranscender ? (
                      <div className="text-center py-4 text-muted-foreground text-sm border border-dashed border-muted rounded-lg">
                        <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p>Nenhum poder paranormal.</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-paranormal"
                          onClick={() => setParanormalPowerModalOpen(true)}
                        >
                          Escolher Poder
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Requer habilidade Transcender
                      </p>
                    )}
                  </div>

                  {/* Poderes Gerais (do suplemento) */}
                  {character.general_powers && character.general_powers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Poderes Gerais
                      </p>
                      {character.general_powers.map((power) => {
                        const powerData = getGeneralPowerById(power.id);
                        const hasRitualGrant = powerData?.grantsRitual && character.class !== 'Ocultista';
                        
                        return (
                          <div key={power.id}>
                            <SheetAccordionItem
                              title={power.name}
                              description={powerData?.description || power.description}
                              badge={power.category || 'Geral'}
                              badgeVariant="default"
                            />
                            {/* Mostrar botão para escolher ritual se o poder conceder */}
                            {hasRitualGrant && (
                              <div className="ml-4 mt-1 p-2 rounded bg-paranormal/10 border border-paranormal/30">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs">
                                    <Sparkles className="w-3 h-3 text-paranormal" />
                                    <span className="text-paranormal">
                                      {learnedRitualsFromPowers.filter(r => r.source === 'ritual-aprendido').length > 0 
                                        ? `Ritual: ${ALL_RITUALS.find(r => r.id === learnedRitualsFromPowers.find(lr => lr.source === 'ritual-aprendido')?.ritualId)?.name || 'Escolhido'}`
                                        : 'Nenhum ritual escolhido'}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-paranormal hover:text-paranormal"
                                    onClick={() => {
                                      setRitualModalSource('ritual-aprendido');
                                      setNonOccultistRitualModalOpen(true);
                                    }}
                                  >
                                    {learnedRitualsFromPowers.some(r => r.source === 'ritual-aprendido') ? 'Alterar' : 'Escolher'}
                                  </Button>
                                </div>
                                {learnedRitualsFromPowers.some(r => r.source === 'ritual-aprendido') && (
                                  <p className="text-[10px] text-yellow-400/80 mt-1">
                                    ⚠️ Custo: ×2 PE (não-ocultista)
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SheetAccordionSection>

              {/* Rituais (acordeão) */}
              {character.rituals && character.rituals.length > 0 && (
                <SheetAccordionSection
                  title="Rituais"
                  icon={Skull}
                  count={character.rituals.length}
                  defaultOpen={false}
                  variant="paranormal"
                >
                  <div className="space-y-2">
                    {character.rituals.map((ritualId, i) => {
                      const ritual = ALL_RITUALS.find(r => r.id === ritualId);
                      if (!ritual) return null;
                      return (
                        <SheetAccordionItem
                          key={i}
                          title={ritual.name}
                          description={`${ritual.execution} • ${ritual.range} • ${ritual.cost} PE`}
                          badge={`${ritual.circle}º Círculo`}
                          badgeVariant="paranormal"
                        />
                      );
                    })}
                  </div>
                </SheetAccordionSection>
              )}

              {/* Botão de Descanso */}
              <Button
                variant="outline"
                onClick={() => setRestModalOpen(true)}
                className="w-full font-display tracking-wider sheet-panel border-2 border-primary/40 hover:border-primary/60"
              >
                <Moon className="w-4 h-4 mr-2" />
                DESCANSAR
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Painel de ajuda flutuante */}
      <CharacterSheetHelp 
        characterClass={character.class} 
        nex={character.nex} 
      />

      {/* Modais */}
      <NexProgressionModal
        open={nexModalOpen}
        onClose={() => setNexModalOpen(false)}
        character={{
          id: character.id,
          name: character.name,
          class: character.class,
          class_track: character.class_track,
          nex: character.nex,
          vigor: character.vigor,
          presence: character.presence,
          origin: character.origin,
          hp_max: character.hp_max,
          pe_max: character.pe_max,
          san_max: character.san_max,
          rituals: character.rituals,
          abilities: character.abilities,
          paranormal_powers: character.paranormal_powers?.map(p => {
            const fullPower = PARANORMAL_POWERS.find(fp => fp.id === p.id);
            return fullPower || {
              id: p.id,
              name: p.name,
              element: p.element as ParanormalElement | 'generic',
              description: p.description,
              effect: { type: 'special' as const, description: p.description },
            };
          }),
          elemental_affinity: character.elemental_affinity as ParanormalElement | null,
          affinity_active: character.affinity_active,
        }}
        onLevelUp={handleLevelUp}
      />
      
      <RitualSelectionModal
        open={ritualModalOpen}
        onClose={() => setRitualModalOpen(false)}
        currentRituals={character.rituals}
        maxCircle={pendingMaxCircle}
        newSlots={pendingRitualSlots}
        onConfirm={handleRitualsConfirm}
      />
      
      <CharacterEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        character={character}
        onSave={handleCharacterEdit}
      />
      
      <RestModal
        open={restModalOpen}
        onOpenChange={setRestModalOpen}
        character={{
          hp_current: hpCurrent,
          hp_max: character.hp_max,
          pe_current: peCurrent,
          pe_max: character.pe_max,
          san_current: sanCurrent,
          san_max: character.san_max,
          vigor: character.vigor,
          presence: character.presence,
          conditions: character.conditions,
        }}
        onRest={async (newStats) => {
          const { error } = await supabase
            .from('characters')
            .update({
              hp_current: newStats.hp_current,
              pe_current: newStats.pe_current,
              san_current: newStats.san_current,
              conditions: newStats.conditions,
            })
            .eq('id', character.id);

          if (error) {
            toast({
              title: 'Erro ao salvar descanso',
              description: error.message,
              variant: 'destructive',
            });
            return;
          }

          setHpCurrent(newStats.hp_current);
          setPeCurrent(newStats.pe_current);
          setSanCurrent(newStats.san_current);
          setCharacter(prev => prev ? {
            ...prev,
            hp_current: newStats.hp_current,
            pe_current: newStats.pe_current,
            san_current: newStats.san_current,
            conditions: newStats.conditions,
          } : null);

          toast({
            title: 'Descanso concluído!',
            description: 'Seus recursos foram recuperados.',
          });
        }}
      />
      
      {/* Modal de rolagem imediata */}
      <DiceRollModal
        open={diceModalOpen}
        onClose={() => setDiceModalOpen(false)}
        label={rollLabel}
        attributeValue={rollAttribute}
        skillBonus={rollSkillBonus}
        onRollComplete={handleRollComplete}
      />

      {/* Modal de seleção de poderes paranormais */}
      <ParanormalPowerSelectModal
        open={paranormalPowerModalOpen}
        onOpenChange={setParanormalPowerModalOpen}
        onSelectPower={handleParanormalPowerSelect}
        characterPowers={(character.paranormal_powers || []).map(p => {
          const fullPower = PARANORMAL_POWERS.find(fp => fp.id === p.id);
          return fullPower || {
            id: p.id,
            name: p.name,
            element: p.element as ParanormalElement | 'generic',
            description: p.description,
            effect: { type: 'special' as const, description: p.description },
          };
        })}
        elementalAffinity={character.elemental_affinity as ParanormalElement | null}
        affinityActive={character.affinity_active}
      />

      {/* Modal de seleção de ritual para não-ocultistas */}
      <NonOccultistRitualModal
        open={nonOccultistRitualModalOpen}
        onClose={() => setNonOccultistRitualModalOpen(false)}
        source={ritualModalSource}
        currentRituals={[
          ...character.rituals,
          ...learnedRitualsFromPowers.map(r => r.ritualId)
        ]}
        onConfirm={(ritualIds) => {
          // Salvar os rituais aprendidos via poderes gerais
          const newRituals: LearnedRitual[] = ritualIds.map(id => ({
            ritualId: id,
            source: ritualModalSource,
            peMultiplier: ritualModalSource === 'ritual-aprendido' ? 2 : 1,
          }));
          
          // Substituir rituais da mesma fonte
          const filteredRituals = learnedRitualsFromPowers.filter(r => r.source !== ritualModalSource);
          setLearnedRitualsFromPowers([...filteredRituals, ...newRituals]);
          setNonOccultistRitualModalOpen(false);
          
          toast({
            title: 'Ritual aprendido!',
            description: `Você aprendeu ${ritualIds.length} ritual(is). Lembre-se: custo de PE é dobrado para não-ocultistas.`,
          });
        }}
      />
    </div>
  );
}
