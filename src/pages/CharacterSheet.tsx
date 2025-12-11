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
  Dices
} from 'lucide-react';
import { ORIGINS, SKILLS, getPatentByNex, calculateDerivedStats } from '@/lib/character-data';
import { getPELimitByNex } from '@/lib/dice-roller';
import { Input } from '@/components/ui/input';
import { DiceRoller } from '@/components/dice/DiceRoller';
import { DiceRoller3D } from '@/components/dice/DiceRoller3D';
import { rollSkillTest, DiceRollResult } from '@/lib/dice-roller';
import { cn } from '@/lib/utils';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { ConditionList } from '@/components/ui/condition-badge';

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
}

const ATTRIBUTE_LABELS: Record<string, string> = {
  agility: 'AGI',
  strength: 'FOR',
  intellect: 'INT',
  presence: 'PRE',
  vigor: 'VIG',
};

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
  const [showDiceRoller, setShowDiceRoller] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!character) return null;

  const origin = ORIGINS.find(o => o.id === character.origin);
  const trainedSkills = SKILLS.filter(s => character.skills[s.id] > 0);

  const sanPercentage = (sanCurrent / character.san_max) * 100;
  const isSanLow = sanPercentage < 30;

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
        {/* Top info bar */}
        <div className="ordo-panel p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-muted-foreground">CLASSE</p>
                <p className="font-display text-lg">{character.class}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ORIGEM</p>
                <p className="font-display text-lg">{origin?.name || character.origin}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">PATENTE</p>
                <p className="font-display text-lg">{character.patent}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">NEX</p>
              <p className="font-display text-4xl text-secondary">{character.nex}%</p>
            </div>
          </div>
        </div>

        {/* Main stats with animated progress */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="ordo-panel p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">DEFESA</p>
            <p className="font-display text-3xl">{character.defense}</p>
          </div>

          <div className="ordo-panel p-4 text-center border-destructive/30">
            <Heart className="w-6 h-6 mx-auto mb-2 text-destructive" />
            <p className="text-xs text-muted-foreground">PV</p>
            {editMode ? (
              <Input
                type="number"
                value={hpCurrent}
                onChange={(e) => setHpCurrent(Math.max(0, Math.min(character.hp_max, parseInt(e.target.value) || 0)))}
                className="text-center font-display text-2xl h-10 bg-transparent border-destructive/50"
              />
            ) : (
              <p className="font-display text-3xl text-destructive">{hpCurrent}</p>
            )}
            <p className="text-xs text-muted-foreground">/ {character.hp_max}</p>
            <AnimatedProgress
              value={hpCurrent}
              max={character.hp_max}
              variant="health"
              size="md"
              showLabel={false}
              className="mt-2"
            />
          </div>

          <div className="ordo-panel p-4 text-center border-secondary/30">
            <Zap className="w-6 h-6 mx-auto mb-2 text-secondary" />
            <p className="text-xs text-muted-foreground">PE</p>
            {editMode ? (
              <Input
                type="number"
                value={peCurrent}
                onChange={(e) => setPeCurrent(Math.max(0, Math.min(character.pe_max, parseInt(e.target.value) || 0)))}
                className="text-center font-display text-2xl h-10 bg-transparent border-secondary/50"
              />
            ) : (
              <p className="font-display text-3xl text-secondary">{peCurrent}</p>
            )}
            <p className="text-xs text-muted-foreground">/ {character.pe_max}</p>
            <AnimatedProgress
              value={peCurrent}
              max={character.pe_max}
              variant="energy"
              size="md"
              showLabel={false}
              className="mt-2"
            />
          </div>

          <div className={`ordo-panel p-4 text-center border-paranormal/30 ${isSanLow ? 'paranormal-glow' : ''}`}>
            <Brain className="w-6 h-6 mx-auto mb-2 text-paranormal" />
            <p className="text-xs text-muted-foreground">SAN</p>
            {editMode ? (
              <Input
                type="number"
                value={sanCurrent}
                onChange={(e) => setSanCurrent(Math.max(0, Math.min(character.san_max, parseInt(e.target.value) || 0)))}
                className="text-center font-display text-2xl h-10 bg-transparent border-paranormal/50"
              />
            ) : (
              <p className="font-display text-3xl text-paranormal">{sanCurrent}</p>
            )}
            <p className="text-xs text-muted-foreground">/ {character.san_max}</p>
            <AnimatedProgress
              value={sanCurrent}
              max={character.san_max}
              variant="sanity"
              size="md"
              showLabel={false}
              className="mt-2"
            />
          </div>
        </div>

        {/* Conditions */}
        {character.conditions && character.conditions.length > 0 && (
          <div className="ordo-panel p-4 mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">CONDIÇÕES ATIVAS</p>
            <ConditionList conditions={character.conditions} size="md" />
          </div>
        )}

        {/* 3D Dice Roller Button */}
        <div className="mb-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowDiceRoller(!showDiceRoller)}
            className="font-display tracking-wider"
          >
            <Dices className="w-5 h-5 mr-2" />
            {showDiceRoller ? 'OCULTAR DADOS' : 'ROLAR DADOS 3D'}
          </Button>
        </div>

        {showDiceRoller && (
          <div className="mb-6">
            <DiceRoller3D 
              attributeValue={character.agility} 
              skillName="Teste Geral"
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="attributes" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="attributes" className="font-display tracking-wider">ATRIBUTOS</TabsTrigger>
            <TabsTrigger value="skills" className="font-display tracking-wider">PERÍCIAS</TabsTrigger>
            <TabsTrigger value="powers" className="font-display tracking-wider">PODERES</TabsTrigger>
            <TabsTrigger value="inventory" className="font-display tracking-wider">INVENTÁRIO</TabsTrigger>
          </TabsList>

          <TabsContent value="attributes" className="animate-fade-in">
            <div className="ordo-panel p-6">
              <h3 className="font-display text-xl tracking-wider mb-4 text-primary dossier-header">
                ATRIBUTOS BASE
              </h3>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(ATTRIBUTE_LABELS).map(([key, label]) => {
                  const value = character[key as keyof Character] as number;
                  return (
                    <div key={key} className="text-center p-4 bg-muted/30 rounded-sm">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="font-display text-4xl">{value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="animate-fade-in">
            <div className="ordo-panel p-6">
              <h3 className="font-display text-xl tracking-wider mb-4 text-primary dossier-header">
                PERÍCIAS TREINADAS
              </h3>
              {trainedSkills.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-2">
                  {trainedSkills.map(skill => {
                    const attrValue = character[skill.attribute as keyof Character] as number;
                    const trainingBonus = 5;
                    const total = attrValue + trainingBonus;
                    return (
                      <div 
                        key={skill.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span>{skill.name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {ATTRIBUTE_LABELS[skill.attribute]}
                          </span>
                        </div>
                        <span className="font-display text-xl text-secondary">+{total}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhuma perícia treinada.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="powers" className="animate-fade-in">
            <div className="ordo-panel p-6">
              <h3 className="font-display text-xl tracking-wider mb-4 text-primary dossier-header">
                PODERES E HABILIDADES
              </h3>
              {character.powers.length > 0 ? (
                <div className="space-y-3">
                  {character.powers.map((power, i) => (
                    <div 
                      key={i}
                      className="p-4 bg-paranormal/5 border border-paranormal/20 rounded-sm"
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
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="animate-fade-in">
            <div className="ordo-panel p-6">
              <h3 className="font-display text-xl tracking-wider mb-4 text-primary dossier-header">
                INVENTÁRIO
              </h3>
              {character.inventory.length > 0 ? (
                <div className="space-y-2">
                  {character.inventory.map((item, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-sm"
                    >
                      <span>{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.category}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Inventário vazio.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Background */}
        {character.background && (
          <div className="ordo-panel p-6 mt-6">
            <h3 className="font-display text-xl tracking-wider mb-4 text-primary dossier-header">
              HISTÓRICO
            </h3>
            <p className="text-muted-foreground font-ritual italic whitespace-pre-wrap">
              {character.background}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
