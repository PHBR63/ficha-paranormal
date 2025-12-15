/**
 * CharacterSheet - Ficha de personagem redesenhada
 * Layout de 3 colunas: Identidade | Combate | Ações
 * Com painel de ajuda e referência rápida
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { 
  ArrowLeft, 
  Loader2, 
  Edit2,
  Trash2,
  Save,
  Dices,
  Swords,
  Package,
  Sparkles,
  BookOpen,
  Moon,
} from 'lucide-react';
import { ORIGINS, CLASSES, getTrackById } from '@/lib/character-data';
import { ALL_RITUALS } from '@/lib/rituals-data';
import { cn } from '@/lib/utils';
import { DiceRoller3D } from '@/components/dice/DiceRoller3D';
import { AttributeGrid } from '@/components/character/AttributeWithDice';
import { SkillsGrid } from '@/components/character/SkillsGrid';
import { InventoryPanel } from '@/components/inventory/InventoryPanel';
import { InventoryItem } from '@/lib/inventory-system';
import { NexProgressionModal } from '@/components/character/NexProgressionModal';
import { RitualSelectionModal } from '@/components/character/RitualSelectionModal';
import { CharacterEditModal } from '@/components/character/CharacterEditModal';
import { CharacterHistoryPanel, logCharacterChanges } from '@/components/character/CharacterHistoryPanel';
import { EffectiveStatsWidget } from '@/components/character/EffectiveStatsWidget';
import { TurnPETracker } from '@/components/character/TurnPETracker';
import { RestModal } from '@/components/character/RestModal';
import { CharacterCombatTracker } from '@/components/character/CharacterCombatTracker';
import { ConditionManager, type ActiveCondition } from '@/components/character/ConditionManager';
import { AttackSystem, type WeaponData } from '@/components/character/AttackSystem';
import { calculateDerivedStats } from '@/lib/character-data';

// Novos componentes do redesign
import { CharacterSheetHelp } from '@/components/character/CharacterSheetHelp';
import { QuickReferenceCard } from '@/components/character/QuickReferenceCard';
import { IdentityCard } from '@/components/character/IdentityCard';
import { CombatStatsCard } from '@/components/character/CombatStatsCard';

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
  inventory: Array<{ id?: string; name: string; category: string; slots: number; itemType?: string; isEquipped?: boolean; equipSlot?: string }>;
  rituals: string[];
  background: string | null;
  notes: string | null;
  conditions: string[];
  photo_url?: string | null;
}

export default function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Editable stats
  const [hpCurrent, setHpCurrent] = useState(0);
  const [peCurrent, setPeCurrent] = useState(0);
  const [sanCurrent, setSanCurrent] = useState(0);
  
  // Dice roller state
  const [diceRollerOpen, setDiceRollerOpen] = useState(false);
  const [rollAttribute, setRollAttribute] = useState(0);
  const [rollSkillName, setRollSkillName] = useState('');
  
  // NEX progression modal
  const [nexModalOpen, setNexModalOpen] = useState(false);
  
  // Ritual selection modal (após progressão de NEX)
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [pendingRitualSlots, setPendingRitualSlots] = useState(0);
  const [pendingMaxCircle, setPendingMaxCircle] = useState(1);
  
  // Character edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Rest modal
  const [restModalOpen, setRestModalOpen] = useState(false);

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
      };
      setCharacter(charData as unknown as Character);
      setHpCurrent(data.hp_current);
      setPeCurrent(data.pe_current);
      setSanCurrent(data.san_current);
      setLoading(false);
    }

    fetchCharacter();
  }, [id, user, navigate, toast]);

  // Handler para salvar stats editados
  const handleSaveStats = async () => {
    if (!character) return;
    setSaving(true);

    const { error } = await supabase
      .from('characters')
      .update({
        hp_current: hpCurrent,
        pe_current: peCurrent,
        san_current: sanCurrent,
      })
      .eq('id', character.id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setCharacter(prev => prev ? {
        ...prev,
        hp_current: hpCurrent,
        pe_current: peCurrent,
        san_current: sanCurrent,
      } : null);
      setEditMode(false);
      toast({
        title: 'Salvo!',
        description: 'Status atualizado com sucesso.',
      });
    }

    setSaving(false);
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

  // Handler para rolar atributo
  const handleAttributeRoll = (attributeValue: number, attributeName: string) => {
    setRollAttribute(attributeValue);
    setRollSkillName(attributeName);
    setDiceRollerOpen(true);
  };

  // Handler para rolar perícia
  const handleSkillRoll = (total: number, skillName: string, attributeValue: number) => {
    setRollAttribute(attributeValue);
    setRollSkillName(skillName);
    setDiceRollerOpen(true);
  };

  // Handler para progressão de NEX
  const handleLevelUp = async (newNex: number, newStats: {
    hp_max: number;
    pe_max: number;
    san_max: number;
    patent: string;
    newAbilities: string[];
  }) => {
    if (!character) return;

    const updatedAbilities = [
      ...character.abilities,
      ...newStats.newAbilities,
    ];

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
    } : null);

    setHpCurrent(Math.min(hpCurrent, newStats.hp));
    setPeCurrent(Math.min(peCurrent, newStats.pe));
    setSanCurrent(Math.min(sanCurrent, newStats.san));

    toast({
      title: 'Personagem atualizado!',
      description: 'Alterações salvas.',
    });
  };

  // Handler para mudança de stats via CombatStatsCard
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!character) return null;

  const sanPercentage = (sanCurrent / character.san_max) * 100;
  const isSanLow = sanPercentage < 30;

  const attributes = {
    agility: character.agility,
    strength: character.strength,
    intellect: character.intellect,
    presence: character.presence,
    vigor: character.vigor,
  };

  return (
    <div className={`min-h-screen bg-background ${isSanLow ? 'animate-flicker' : ''}`}>
      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <h1 className="font-display text-lg sm:text-xl tracking-wider truncate max-w-[200px] sm:max-w-none">
                {character.name}
              </h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeSelector />
              <CharacterHistoryPanel 
                characterId={character.id} 
                characterName={character.name} 
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="font-display hidden sm:flex"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                EDITAR
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setEditModalOpen(true)}
                className="sm:hidden"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6">
        {/* Layout de 3 colunas em desktop, stack em mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* COLUNA 1: Identidade */}
          <div className="space-y-4">
            {/* Card de identidade */}
            <IdentityCard
              name={character.name}
              photoUrl={character.photo_url}
              characterClass={character.class}
              classTrack={character.class_track}
              origin={character.origin}
              nex={character.nex}
              patent={character.patent}
              onLevelUp={() => setNexModalOpen(true)}
            />

            {/* Stats efetivos (Defesa, RD, Deslocamento) */}
            <EffectiveStatsWidget
              baseDefense={character.defense}
              baseMovement={character.movement || 9}
              conditions={character.conditions || []}
              inventory={character.inventory as Array<{
                name: string;
                isEquipped?: boolean;
                itemType?: string;
                rd?: number;
                agilityPenalty?: number;
                speedPenalty?: number;
                armorType?: string;
              }>}
            />

            {/* Atributos clicáveis */}
            <div className="ordo-panel p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                ATRIBUTOS <span className="text-primary">(clique para rolar)</span>
              </p>
              <AttributeGrid 
                attributes={attributes} 
                onRoll={handleAttributeRoll}
              />
            </div>
          </div>

          {/* COLUNA 2: Combate */}
          <div className="space-y-4">
            {/* HP, PE, SAN */}
            <CombatStatsCard
              hpCurrent={hpCurrent}
              hpMax={character.hp_max}
              peCurrent={peCurrent}
              peMax={character.pe_max}
              sanCurrent={sanCurrent}
              sanMax={character.san_max}
              onStatsChange={handleCombatStatsChange}
            />

            {/* PE Tracker por turno */}
            <TurnPETracker
              nex={character.nex}
              peCurrent={peCurrent}
              peMax={character.pe_max}
              onPEChange={(newPE) => setPeCurrent(newPE)}
            />

            {/* Gerenciador de condições */}
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

            {/* Combat Tracker */}
            <CharacterCombatTracker
              character={{
                name: character.name,
                agility: character.agility,
                defense: character.defense,
                hp_current: hpCurrent,
                hp_max: character.hp_max,
                pe_current: peCurrent,
                pe_max: character.pe_max,
                conditions: character.conditions,
              }}
              onHPChange={(newHP) => setHpCurrent(newHP)}
              onPEChange={(newPE) => setPeCurrent(newPE)}
            />
          </div>

          {/* COLUNA 3: Ações e Rolagens */}
          <div className="space-y-4">
            {/* Dice Roller */}
            {diceRollerOpen ? (
              <div className="ordo-panel p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display text-sm tracking-wider text-primary">
                    ROLANDO: {rollSkillName}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setDiceRollerOpen(false)}
                  >
                    Fechar
                  </Button>
                </div>
                <DiceRoller3D 
                  attributeValue={rollAttribute} 
                  skillName={rollSkillName}
                />
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setRollAttribute(character.agility);
                  setRollSkillName('Teste Geral');
                  setDiceRollerOpen(true);
                }}
                className="w-full font-display tracking-wider h-12"
              >
                <Dices className="w-5 h-5 mr-2" />
                ROLAR DADOS
              </Button>
            )}

            {/* Referência rápida */}
            <QuickReferenceCard
              nex={character.nex}
              vigor={character.vigor}
              agility={character.agility}
              presence={character.presence}
            />

            {/* Botão de descanso */}
            <Button
              variant="outline"
              onClick={() => setRestModalOpen(true)}
              className="w-full font-display tracking-wider"
            >
              <Moon className="w-4 h-4 mr-2" />
              DESCANSAR
            </Button>

            {/* Sistema de ataque */}
            <AttackSystem
              weapons={character.inventory
                .filter(item => item.isEquipped && item.itemType === 'weapon')
                .map(item => ({
                  id: item.id || crypto.randomUUID(),
                  name: item.name,
                  attackAttribute: item.category === 'I' || item.category === 'II' 
                    ? 'agility' as const 
                    : 'strength' as const,
                  damage: '1d6',
                  damageType: 'Impacto',
                  range: item.category === 'II' || item.category === 'III' ? 'Curto' : undefined,
                } as WeaponData))}
              attributes={attributes}
              skillBonuses={{
                luta: character.skills['luta'] || 0,
                pontaria: character.skills['pontaria'] || 0,
              }}
            />
          </div>
        </div>

        {/* Tabs de Conteúdo (largura total) */}
        <div className="mt-6">
          <Tabs defaultValue="skills" className="space-y-4">
            <TabsList className="bg-card border border-border w-full justify-start flex-wrap">
              <TabsTrigger value="skills" className="font-display tracking-wider">
                <BookOpen className="w-4 h-4 mr-2" />
                PERÍCIAS
              </TabsTrigger>
              <TabsTrigger value="powers" className="font-display tracking-wider">
                <Sparkles className="w-4 h-4 mr-2" />
                PODERES
              </TabsTrigger>
              <TabsTrigger value="inventory" className="font-display tracking-wider">
                <Package className="w-4 h-4 mr-2" />
                INVENTÁRIO
              </TabsTrigger>
              <TabsTrigger value="background" className="font-display tracking-wider">
                <BookOpen className="w-4 h-4 mr-2" />
                HISTÓRIA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="skills" className="animate-fade-in">
              <div className="ordo-panel p-4">
                <SkillsGrid 
                  skills={character.skills} 
                  attributes={attributes}
                  onRoll={handleSkillRoll}
                />
              </div>
            </TabsContent>

            <TabsContent value="powers" className="animate-fade-in">
              <div className="ordo-panel p-4 space-y-6">
                {/* Habilidades de Classe */}
                {character.abilities && character.abilities.length > 0 && (
                  <div>
                    <h3 className="font-display text-sm tracking-wider mb-4 text-primary">
                      HABILIDADES
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {character.abilities.map((ability, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-primary/20 text-primary text-sm rounded-lg"
                        >
                          {ability}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trilha de Classe */}
                {character.class_track && (() => {
                  const track = getTrackById(character.class_track);
                  if (!track) return null;
                  const unlockedAbilities = track.abilities.filter(a => a.minNex <= character.nex);
                  return (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h4 className="font-display text-lg text-primary">
                          Trilha: {track.name}
                        </h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{track.description}</p>
                      {unlockedAbilities.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-primary/70 uppercase tracking-wider">
                            Habilidades da Trilha (NEX {character.nex}%)
                          </p>
                          {unlockedAbilities.map((ability) => (
                            <div 
                              key={ability.id}
                              className="p-3 bg-primary/10 border border-primary/30 rounded-lg"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-primary">{ability.name}</span>
                                <span className="text-xs text-muted-foreground">NEX {ability.minNex}%</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{ability.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Poderes de Origem */}
                {character.powers.length > 0 && (
                  <div>
                    <h3 className="font-display text-sm tracking-wider mb-4 text-paranormal">
                      PODERES DE ORIGEM
                    </h3>
                    <div className="space-y-3">
                      {character.powers.map((power, i) => (
                        <div 
                          key={i}
                          className="p-4 bg-paranormal/5 border border-paranormal/20 rounded-lg"
                        >
                          <h4 className="font-display text-lg text-paranormal">{power.name}</h4>
                          {power.description && (
                            <p className="text-sm text-muted-foreground mt-1 font-ritual italic">
                              {power.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rituais */}
                {character.rituals && character.rituals.length > 0 && (
                  <div>
                    <h3 className="font-display text-sm tracking-wider mb-4 text-paranormal">
                      RITUAIS ({character.rituals.length})
                    </h3>
                    <div className="space-y-2">
                      {character.rituals.map((ritualId, i) => {
                        const ritual = ALL_RITUALS.find(r => r.id === ritualId);
                        if (!ritual) return null;
                        return (
                          <div 
                            key={i}
                            className="flex items-center justify-between p-3 bg-paranormal/10 border border-paranormal/30 rounded-lg"
                          >
                            <div>
                              <span className="font-medium">{ritual.name}</span>
                              <p className="text-xs text-muted-foreground">
                                {ritual.execution} • {ritual.range} • {ritual.cost} PE
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-paranormal/20 text-paranormal capitalize">
                                {ritual.element}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {ritual.circle}º Círculo
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mensagem vazia */}
                {(!character.powers || character.powers.length === 0) && 
                 (!character.abilities || character.abilities.length === 0) &&
                 (!character.rituals || character.rituals.length === 0) && (
                  <p className="text-muted-foreground">Nenhum poder ou habilidade registrado.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="animate-fade-in">
              <div className="ordo-panel p-4">
                <InventoryPanel
                  inventory={character.inventory.map((item, i) => ({
                    id: `item-${i}`,
                    name: item.name,
                    category: (item.category as InventoryItem['category']) || '0',
                    slots: item.slots,
                    quantity: 1,
                    itemType: (item.itemType as any) || 'misc',
                    isEquipped: item.isEquipped || false,
                    equipSlot: item.equipSlot as any,
                  }))}
                  strength={character.strength}
                  patent={character.patent}
                  onInventoryChange={async (newInventory) => {
                    const updatedInventory = newInventory.map(item => ({
                      name: item.name,
                      category: item.category,
                      slots: item.slots,
                      itemType: item.itemType,
                      isEquipped: item.isEquipped,
                      equipSlot: item.equipSlot,
                    }));
                    
                    const { error } = await supabase
                      .from('characters')
                      .update({ inventory: updatedInventory })
                      .eq('id', character.id);

                    if (!error) {
                      setCharacter(prev => prev ? {
                        ...prev,
                        inventory: updatedInventory,
                      } : null);
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="background" className="animate-fade-in">
              <div className="ordo-panel p-4">
                {character.background ? (
                  <>
                    <h3 className="font-display text-sm tracking-wider mb-3 text-primary">
                      HISTÓRIA DO PERSONAGEM
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {character.background}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Nenhuma história registrada. Clique em "Editar" para adicionar.
                  </p>
                )}
                
                {character.notes && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="font-display text-sm tracking-wider mb-3 text-secondary">
                      NOTAS
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {character.notes}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
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
    </div>
  );
}