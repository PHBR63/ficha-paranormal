import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
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
  BookOpen
} from 'lucide-react';
import { ORIGINS, SKILLS, getPatentByNex, calculateDerivedStats } from '@/lib/character-data';
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

interface Character {
  id: string;
  name: string;
  player_name: string | null;
  origin: string;
  class: string;
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
  skills: Record<string, number>;
  powers: Array<{ name: string; description: string }>;
  inventory: Array<{ name: string; category: string; slots: number }>;
  rituals: Array<{ name: string; circle: number; element: string }>;
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditMode(true)}
                  className="font-display"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  EDITAR
                </Button>
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
                {/* NEX */}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">NEX</p>
                  <p className="font-display text-3xl text-secondary">{character.nex}%</p>
                  <span className="patent-badge text-[10px]">{character.patent}</span>
                </div>
              </div>
            </div>

            {/* Status Bars - Vertical */}
            <div className="ordo-panel p-4 space-y-4">
              {/* Defense */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">DEFESA</span>
                </div>
                <span className="font-display text-2xl">{character.defense}</span>
              </div>

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
                <AnimatedProgress value={hpCurrent} max={character.hp_max} variant="health" size="md" glow={hpCurrent / character.hp_max <= 0.25} />
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
                <AnimatedProgress value={peCurrent} max={character.pe_max} variant="energy" size="md" />
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
                <AnimatedProgress value={sanCurrent} max={character.san_max} variant="sanity" size="md" glow={isSanLow} />
              </div>
            </div>

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
                <div className="ordo-panel p-4">
                  <h3 className="font-display text-sm tracking-wider mb-4 text-primary">
                    PODERES E HABILIDADES
                  </h3>
                  {character.powers.length > 0 ? (
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
                  ) : (
                    <p className="text-muted-foreground">Nenhum poder registrado.</p>
                  )}

                  {/* Rituals */}
                  {character.rituals && character.rituals.length > 0 && (
                    <>
                      <h3 className="font-display text-sm tracking-wider mt-6 mb-4 text-paranormal">
                        RITUAIS
                      </h3>
                      <div className="space-y-2">
                        {character.rituals.map((ritual, i) => (
                          <div 
                            key={i}
                            className="flex items-center justify-between p-3 bg-paranormal/10 border border-paranormal/30 rounded-lg"
                          >
                            <span className="font-medium">{ritual.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-paranormal/20 text-paranormal">
                                {ritual.element}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Círculo {ritual.circle}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
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
                    }))}
                    strength={character.strength}
                    patent={character.patent}
                    onInventoryChange={async (newInventory) => {
                      const updatedInventory = newInventory.map(item => ({
                        name: item.name,
                        category: item.category,
                        slots: item.slots,
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
    </div>
  );
}
