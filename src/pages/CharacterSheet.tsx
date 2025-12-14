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
  Shield, 
  Heart, 
  Zap, 
  Brain,
  Edit2,
  Trash2,
  Save,
  Dices,
  Swords,
  Package,
  Sparkles,
  BookOpen,
  ArrowUp,
  Moon,
} from 'lucide-react';
import { ORIGINS, SKILLS, CLASSES, getPatentByNex, calculateDerivedStats, getTrackById } from '@/lib/character-data';
import { ALL_RITUALS } from '@/lib/rituals-data';
import { getPELimitByNex } from '@/lib/dice-roller';
import { Input } from '@/components/ui/input';
import { DiceRoller3D } from '@/components/dice/DiceRoller3D';
import { cn } from '@/lib/utils';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { ConditionList } from '@/components/ui/condition-badge';
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
  movement: number; // Deslocamento base
  skills: Record<string, number>;
  powers: Array<{ name: string; description: string }>;
  abilities: string[];
  inventory: Array<{ name: string; category: string; slots: number; itemType?: string; isEquipped?: boolean; equipSlot?: string }>;
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

  const handleAttributeRoll = (attributeValue: number, attributeName: string) => {
    setRollAttribute(attributeValue);
    setRollSkillName(attributeName);
    setDiceRollerOpen(true);
  };

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

    // Combina habilidades existentes com novas
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

    // Atualiza estado local
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
      description: `${character.name} subiu de nível e ficou mais forte!`,
    });

    // Verifica se Ocultista ganhou novos slots de ritual
    if (character.class === 'Ocultista') {
      const ocultistClass = CLASSES.find(c => c.id === 'Ocultista') as any;
      const ritualsPerNex = ocultistClass?.ritualsPerNex || {};
      
      const oldRitualInfo = ritualsPerNex[character.nex] || { count: 0, maxCircle: 1 };
      const newRitualInfo = ritualsPerNex[newNex] || { count: 0, maxCircle: 1 };
      
      const newSlots = newRitualInfo.count - oldRitualInfo.count;
      
      if (newSlots > 0) {
        // Abre modal para escolher novos rituais
        setPendingRitualSlots(newSlots);
        setPendingMaxCircle(newRitualInfo.maxCircle);
        setRitualModalOpen(true);
      }
    }
  };

  // Handler para salvar novos rituais escolhidos
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
      description: `${selectedRituals.length} ritual(is) adicionado(s) ao seu grimório.`,
    });
  };

  // Handler para salvar edição completa do personagem
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

    // Recalcula stats derivados com os novos atributos
    const newStats = calculateDerivedStats(
      character.class,
      data.vigor,
      data.presence,
      character.nex,
      character.origin
    );

    // Registra alterações no histórico
    const changes: Array<{
      changeType: string;
      fieldName: string;
      oldValue: string | null;
      newValue: string | null;
      description?: string;
    }> = [];

    // Verifica mudanças em campos de informação
    if (data.name !== character.name) {
      changes.push({ changeType: 'info', fieldName: 'name', oldValue: character.name, newValue: data.name });
    }
    if ((data.player_name || '') !== (character.player_name || '')) {
      changes.push({ changeType: 'info', fieldName: 'player_name', oldValue: character.player_name, newValue: data.player_name });
    }
    if ((data.background || '') !== (character.background || '')) {
      changes.push({ changeType: 'info', fieldName: 'background', oldValue: character.background, newValue: data.background });
    }
    if ((data.notes || '') !== (character.notes || '')) {
      changes.push({ changeType: 'info', fieldName: 'notes', oldValue: character.notes, newValue: data.notes });
    }
    if (data.photo_url !== (character.photo_url || null)) {
      changes.push({ changeType: 'photo', fieldName: 'photo_url', oldValue: 'Foto anterior', newValue: 'Nova foto' });
    }

    // Verifica mudanças em atributos
    if (data.agility !== character.agility) {
      changes.push({ changeType: 'attribute', fieldName: 'agility', oldValue: String(character.agility), newValue: String(data.agility) });
    }
    if (data.strength !== character.strength) {
      changes.push({ changeType: 'attribute', fieldName: 'strength', oldValue: String(character.strength), newValue: String(data.strength) });
    }
    if (data.intellect !== character.intellect) {
      changes.push({ changeType: 'attribute', fieldName: 'intellect', oldValue: String(character.intellect), newValue: String(data.intellect) });
    }
    if (data.presence !== character.presence) {
      changes.push({ changeType: 'attribute', fieldName: 'presence', oldValue: String(character.presence), newValue: String(data.presence) });
    }
    if (data.vigor !== character.vigor) {
      changes.push({ changeType: 'attribute', fieldName: 'vigor', oldValue: String(character.vigor), newValue: String(data.vigor) });
    }
    if (data.defense !== character.defense) {
      changes.push({ changeType: 'defense', fieldName: 'defense', oldValue: String(character.defense), newValue: String(data.defense) });
    }

    // Verifica mudanças em perícias
    const oldSkillCount = Object.keys(character.skills).filter(k => character.skills[k] > 0).length;
    const newSkillCount = Object.keys(data.skills).filter(k => data.skills[k] > 0).length;
    if (oldSkillCount !== newSkillCount || !Object.keys(character.skills).filter(k => character.skills[k] > 0).every(k => data.skills[k])) {
      changes.push({ changeType: 'skill', fieldName: 'skills', oldValue: `${oldSkillCount} perícias`, newValue: `${newSkillCount} perícias` });
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

    // Registra alterações no histórico (após salvar com sucesso)
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
      description: 'As alterações foram salvas com sucesso.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!character) return null;

  const origin = ORIGINS.find(o => o.id === character.origin);
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="font-display text-xl tracking-wider">{character.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSelector />
              {editMode ? (
                <Button 
                  size="sm" 
                  onClick={handleSaveStats}
                  disabled={saving}
                  className="font-display"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  SALVAR
                </Button>
              ) : (
                <>
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
                    EDITAR FICHA
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEditMode(true)}
                    className="font-display text-muted-foreground"
                  >
                    STATUS
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* 2-Column Layout */}
        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Left Column - Character Info & Stats */}
          <div className="space-y-4">
            {/* Character Photo & Basic Info Card */}
            <div className="ordo-panel p-4">
              <div className="flex gap-4">
                {/* Photo */}
                <div className="w-24 h-24 rounded-lg bg-secondary/50 border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {character.photo_url ? (
                    <img 
                      src={character.photo_url} 
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Shield className="w-10 h-10 text-muted-foreground/50" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">CLASSE</p>
                  <p className="font-display text-lg">{character.class}</p>
                  <p className="text-xs text-muted-foreground mt-2">ORIGEM</p>
                  <p className="font-display">{origin?.name || character.origin}</p>
                </div>
                {/* NEX com botão de progressão */}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">NEX</p>
                  <p className="font-display text-3xl text-secondary">{character.nex}%</p>
                  <span className="patent-badge text-[10px]">{character.patent}</span>
                  {character.nex < 99 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNexModalOpen(true)}
                      className="mt-2 text-xs h-7 border-primary/50 text-primary hover:bg-primary/10"
                    >
                      <ArrowUp className="w-3 h-3 mr-1" />
                      SUBIR NEX
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Efetivos com Condições */}
            {character.conditions && character.conditions.length > 0 ? (
              <EffectiveStatsWidget
                baseDefense={character.defense}
                baseMovement={character.movement || 9}
                conditions={character.conditions}
              />
            ) : (
              <div className="ordo-panel p-4 space-y-4">
                {/* Defense sem modificadores */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">DEFESA</span>
                  </div>
                  <span className="font-display text-2xl">{character.defense}</span>
                </div>
              </div>
            )}

            {/* Status Bars - Vertical */}
            <div className="ordo-panel p-4 space-y-4">

              {/* HP */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-destructive" />
                    <span className="text-sm text-muted-foreground">PONTOS DE VIDA</span>
                  </div>
                  {editMode ? (
                    <Input
                      type="number"
                      value={hpCurrent}
                      onChange={(e) => setHpCurrent(Math.max(0, Math.min(character.hp_max, parseInt(e.target.value) || 0)))}
                      className="w-20 text-center font-display text-lg h-8 bg-transparent border-destructive/50"
                    />
                  ) : (
                    <span className="font-display text-xl text-destructive">{hpCurrent}/{character.hp_max}</span>
                  )}
                </div>
                <AnimatedProgress value={hpCurrent} max={character.hp_max} variant="hp" size="md" glow={hpCurrent / character.hp_max <= 0.25} />
              </div>

              {/* PE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-secondary" />
                    <span className="text-sm text-muted-foreground">PONTOS DE ESFORÇO</span>
                  </div>
                  {editMode ? (
                    <Input
                      type="number"
                      value={peCurrent}
                      onChange={(e) => setPeCurrent(Math.max(0, Math.min(character.pe_max, parseInt(e.target.value) || 0)))}
                      className="w-20 text-center font-display text-lg h-8 bg-transparent border-secondary/50"
                    />
                  ) : (
                    <span className="font-display text-xl text-secondary">{peCurrent}/{character.pe_max}</span>
                  )}
                </div>
                <AnimatedProgress value={peCurrent} max={character.pe_max} variant="pe" size="md" />
              </div>

              {/* SAN */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-paranormal" />
                    <span className="text-sm text-muted-foreground">SANIDADE</span>
                  </div>
                  {editMode ? (
                    <Input
                      type="number"
                      value={sanCurrent}
                      onChange={(e) => setSanCurrent(Math.max(0, Math.min(character.san_max, parseInt(e.target.value) || 0)))}
                      className="w-20 text-center font-display text-lg h-8 bg-transparent border-paranormal/50"
                    />
                  ) : (
                    <span className="font-display text-xl text-paranormal">{sanCurrent}/{character.san_max}</span>
                  )}
                </div>
                <AnimatedProgress value={sanCurrent} max={character.san_max} variant="san" size="md" glow={isSanLow} />
              </div>
            </div>

            {/* PE Tracker por Turno */}
            <TurnPETracker
              nex={character.nex}
              peCurrent={peCurrent}
              peMax={character.pe_max}
              onPEChange={(newPE) => {
                setPeCurrent(newPE);
              }}
            />

            {/* Rest Button */}
            <Button
              variant="outline"
              onClick={() => setRestModalOpen(true)}
              className="w-full font-display tracking-wider"
            >
              <Moon className="w-4 h-4 mr-2" />
              DESCANSAR
            </Button>

            {/* Conditions */}
            {character.conditions && character.conditions.length > 0 && (
              <div className="ordo-panel p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">CONDIÇÕES ATIVAS</p>
                <ConditionList conditions={character.conditions} size="md" />
              </div>
            )}

            {/* Attributes with Dice */}
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

          {/* Right Column - Skills, Powers, Inventory */}
          <div className="space-y-4">
            {/* Dice Roller (expandable) */}
            {diceRollerOpen && (
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
            )}

            {/* Quick Dice Button */}
            {!diceRollerOpen && (
              <Button
                variant="outline"
                onClick={() => {
                  setRollAttribute(character.agility);
                  setRollSkillName('Teste Geral');
                  setDiceRollerOpen(true);
                }}
                className="w-full font-display tracking-wider"
              >
                <Dices className="w-5 h-5 mr-2" />
                ROLAR DADOS
              </Button>
            )}

            {/* Tabs for Skills, Powers, Inventory */}
            <Tabs defaultValue="skills" className="space-y-4">
              <TabsList className="bg-card border border-border w-full justify-start">
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

                  {/* Rituais - agora usa IDs e busca dados completos */}
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

                  {/* Mensagem se não há nada */}
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
            </Tabs>

            {/* Background */}
            {character.background && (
              <div className="ordo-panel p-4">
                <h3 className="font-display text-sm tracking-wider mb-3 text-primary">
                  HISTÓRIA
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {character.background}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Progressão de NEX */}
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
      
      {/* Modal de seleção de rituais após progressão */}
      <RitualSelectionModal
        open={ritualModalOpen}
        onClose={() => setRitualModalOpen(false)}
        currentRituals={character.rituals}
        maxCircle={pendingMaxCircle}
        newSlots={pendingRitualSlots}
        onConfirm={handleRitualsConfirm}
      />
      
      {/* Modal de edição completa do personagem */}
      <CharacterEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        character={character}
        onSave={handleCharacterEdit}
      />
      
      {/* Modal de descanso */}
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
          // Atualiza no banco de dados
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

          // Atualiza estado local
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
