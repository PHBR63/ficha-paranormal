// Modal de Edição Completa do Personagem
// Permite alterar atributos, perícias e características

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Save,
  Loader2,
  User,
  Dices,
  BookOpen,
  FileText,
  Plus,
  Minus,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  RotateCcw,
} from 'lucide-react';
import { ORIGINS, SKILLS, CLASSES, calculateDerivedStats } from '@/lib/character-data';

// Limite de pontos de atributos
const MIN_ATTRIBUTE = 1;
const MAX_ATTRIBUTE = 5;

interface CharacterEditData {
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
}

interface CharacterEditModalProps {
  open: boolean;
  onClose: () => void;
  character: {
    id: string;
    name: string;
    player_name: string | null;
    age?: number | null;
    gender?: string | null;
    appearance?: string | null;
    personality?: string | null;
    background: string | null;
    notes: string | null;
    class: string;
    origin: string;
    nex: number;
    agility: number;
    strength: number;
    intellect: number;
    presence: number;
    vigor: number;
    skills: Record<string, number>;
    defense: number;
  };
  onSave: (data: CharacterEditData) => Promise<void>;
}

export function CharacterEditModal({
  open,
  onClose,
  character,
  onSave,
}: CharacterEditModalProps) {
  // Estados de edição
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Dados do formulário
  const [name, setName] = useState(character.name);
  const [playerName, setPlayerName] = useState(character.player_name || '');
  const [age, setAge] = useState(character.age || '');
  const [gender, setGender] = useState(character.gender || '');
  const [appearance, setAppearance] = useState(character.appearance || '');
  const [personality, setPersonality] = useState(character.personality || '');
  const [background, setBackground] = useState(character.background || '');
  const [notes, setNotes] = useState(character.notes || '');

  // Atributos
  const [agility, setAgility] = useState(character.agility);
  const [strength, setStrength] = useState(character.strength);
  const [intellect, setIntellect] = useState(character.intellect);
  const [presence, setPresence] = useState(character.presence);
  const [vigor, setVigor] = useState(character.vigor);

  // Perícias treinadas
  const [trainedSkills, setTrainedSkills] = useState<Record<string, number>>(() => {
    const skills: Record<string, number> = {};
    Object.keys(character.skills).forEach(key => {
      if (character.skills[key] > 0) {
        skills[key] = character.skills[key];
      }
    });
    return skills;
  });

  // Defesa base customizada
  const [defense, setDefense] = useState(character.defense);

  // Estado para confirmação de mudanças críticas
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Cálculos de pontos
  const totalAttributePoints = agility + strength + intellect + presence + vigor;
  const originData = ORIGINS.find(o => o.id === character.origin);

  // Conta perícias treinadas
  const trainedSkillCount = Object.keys(trainedSkills).length;

  // Stats originais do personagem
  const originalStats = useMemo(() => {
    return calculateDerivedStats(
      character.class,
      character.vigor,
      character.presence,
      character.nex,
      character.origin
    );
  }, [character]);

  // Calcula stats derivados para preview
  const derivedStats = useMemo(() => {
    return calculateDerivedStats(
      character.class,
      vigor,
      presence,
      character.nex,
      character.origin
    );
  }, [character.class, vigor, presence, character.nex, character.origin]);

  // Detecta se houve mudanças nos atributos
  const attributeChanges = useMemo(() => {
    const changes: Array<{ attr: string; from: number; to: number }> = [];
    
    if (agility !== character.agility) {
      changes.push({ attr: 'Agilidade', from: character.agility, to: agility });
    }
    if (strength !== character.strength) {
      changes.push({ attr: 'Força', from: character.strength, to: strength });
    }
    if (intellect !== character.intellect) {
      changes.push({ attr: 'Intelecto', from: character.intellect, to: intellect });
    }
    if (presence !== character.presence) {
      changes.push({ attr: 'Presença', from: character.presence, to: presence });
    }
    if (vigor !== character.vigor) {
      changes.push({ attr: 'Vigor', from: character.vigor, to: vigor });
    }
    
    return changes;
  }, [agility, strength, intellect, presence, vigor, character]);

  // Calcula impacto nos stats derivados
  const statsImpact = useMemo(() => {
    return {
      hp: derivedStats.hp - originalStats.hp,
      pe: derivedStats.pe - originalStats.pe,
      san: derivedStats.san - originalStats.san,
    };
  }, [derivedStats, originalStats]);

  const hasAttributeChanges = attributeChanges.length > 0;
  const hasSignificantChanges = statsImpact.hp !== 0 || statsImpact.pe !== 0 || statsImpact.san !== 0;

  // Handler para mudar atributo
  const handleAttributeChange = (
    attr: 'agility' | 'strength' | 'intellect' | 'presence' | 'vigor',
    delta: number
  ) => {
    const setters: Record<string, React.Dispatch<React.SetStateAction<number>>> = {
      agility: setAgility,
      strength: setStrength,
      intellect: setIntellect,
      presence: setPresence,
      vigor: setVigor,
    };
    const values: Record<string, number> = { agility, strength, intellect, presence, vigor };
    
    const newValue = values[attr] + delta;
    if (newValue >= MIN_ATTRIBUTE && newValue <= MAX_ATTRIBUTE) {
      setters[attr](newValue);
    }
  };

  // Handler para toggle de perícia
  const handleSkillToggle = (skillId: string) => {
    setTrainedSkills(prev => {
      const newSkills = { ...prev };
      if (newSkills[skillId]) {
        delete newSkills[skillId];
      } else {
        newSkills[skillId] = 5; // Bônus de treino padrão
      }
      return newSkills;
    });
  };

  // Handler para resetar todos os valores
  const handleReset = () => {
    // Restaura informações básicas
    setName(character.name);
    setPlayerName(character.player_name || '');
    setAge(character.age || '');
    setGender(character.gender || '');
    setAppearance(character.appearance || '');
    setPersonality(character.personality || '');
    setBackground(character.background || '');
    setNotes(character.notes || '');
    
    // Restaura atributos
    setAgility(character.agility);
    setStrength(character.strength);
    setIntellect(character.intellect);
    setPresence(character.presence);
    setVigor(character.vigor);
    
    // Restaura perícias
    const skills: Record<string, number> = {};
    Object.keys(character.skills).forEach(key => {
      if (character.skills[key] > 0) {
        skills[key] = character.skills[key];
      }
    });
    setTrainedSkills(skills);
    
    // Restaura defesa
    setDefense(character.defense);
  };

  // Verifica se há qualquer mudança
  const hasAnyChanges = useMemo(() => {
    if (name !== character.name) return true;
    if ((playerName || '') !== (character.player_name || '')) return true;
    if (agility !== character.agility) return true;
    if (strength !== character.strength) return true;
    if (intellect !== character.intellect) return true;
    if (presence !== character.presence) return true;
    if (vigor !== character.vigor) return true;
    if (defense !== character.defense) return true;
    if ((background || '') !== (character.background || '')) return true;
    if ((notes || '') !== (character.notes || '')) return true;
    
    // Verifica perícias
    const originalSkillKeys = Object.keys(character.skills).filter(k => character.skills[k] > 0);
    const currentSkillKeys = Object.keys(trainedSkills);
    if (originalSkillKeys.length !== currentSkillKeys.length) return true;
    if (!originalSkillKeys.every(k => trainedSkills[k])) return true;
    
    return false;
  }, [name, playerName, agility, strength, intellect, presence, vigor, defense, background, notes, trainedSkills, character]);

  const handleTrySave = () => {
    if (!name.trim()) return;
    
    // Se houver mudanças significativas, mostra confirmação
    if (hasSignificantChanges) {
      setShowConfirmDialog(true);
    } else {
      handleSave();
    }
  };

  // Handler para salvar
  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    setShowConfirmDialog(false);
    
    try {
      await onSave({
        name: name.trim(),
        player_name: playerName.trim() || null,
        age: age ? Number(age) : null,
        gender: gender.trim() || null,
        appearance: appearance.trim() || null,
        personality: personality.trim() || null,
        background: background.trim() || null,
        notes: notes.trim() || null,
        agility,
        strength,
        intellect,
        presence,
        vigor,
        skills: trainedSkills,
        defense,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar personagem:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-center">
            EDITAR PERSONAGEM
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="info" className="font-display text-xs">
              <User className="w-4 h-4 mr-1.5" />
              INFO
            </TabsTrigger>
            <TabsTrigger value="attributes" className="font-display text-xs">
              <Dices className="w-4 h-4 mr-1.5" />
              ATRIBUTOS
            </TabsTrigger>
            <TabsTrigger value="skills" className="font-display text-xs">
              <BookOpen className="w-4 h-4 mr-1.5" />
              PERÍCIAS
            </TabsTrigger>
            <TabsTrigger value="bio" className="font-display text-xs">
              <FileText className="w-4 h-4 mr-1.5" />
              BIOGRAFIA
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4 pr-4">
            {/* INFO TAB */}
            <TabsContent value="info" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Personagem *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome do personagem"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playerName">Nome do Jogador</Label>
                  <Input
                    id="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Seu nome"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="30"
                    min={1}
                    max={150}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero</Label>
                  <Input
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="Ex: Masculino"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Defesa Base</Label>
                  <Input
                    type="number"
                    value={defense}
                    onChange={(e) => setDefense(Math.max(0, parseInt(e.target.value) || 0))}
                    min={0}
                  />
                </div>
              </div>

              {/* Informações fixas */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Informações Fixas (não editáveis)
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Classe:</span>{' '}
                    <span className="font-medium">{character.class}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Origem:</span>{' '}
                    <span className="font-medium">{originData?.name || character.origin}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">NEX:</span>{' '}
                    <span className="font-medium text-primary">{character.nex}%</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ATTRIBUTES TAB */}
            <TabsContent value="attributes" className="space-y-4 mt-0">
              {/* Aviso */}
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Alterar atributos afeta os stats derivados (PV, PE, SAN). 
                  Discuta com o mestre antes de fazer alterações significativas.
                </p>
              </div>

              {/* Preview de stats derivados */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs text-primary uppercase tracking-wider mb-3">
                  Preview de Stats (baseado nos atributos)
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">PV Máx</p>
                    <p className="font-display text-xl text-destructive">{derivedStats.hp}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">PE Máx</p>
                    <p className="font-display text-xl text-secondary">{derivedStats.pe}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SAN Máx</p>
                    <p className="font-display text-xl text-paranormal">{derivedStats.san}</p>
                  </div>
                </div>
              </div>

              {/* Atributos */}
              <div className="space-y-3">
                <AttributeEditor
                  label="AGILIDADE"
                  abbr="AGI"
                  value={agility}
                  color="hsl(var(--accent))"
                  onDecrease={() => handleAttributeChange('agility', -1)}
                  onIncrease={() => handleAttributeChange('agility', 1)}
                />
                <AttributeEditor
                  label="FORÇA"
                  abbr="FOR"
                  value={strength}
                  color="hsl(var(--destructive))"
                  onDecrease={() => handleAttributeChange('strength', -1)}
                  onIncrease={() => handleAttributeChange('strength', 1)}
                />
                <AttributeEditor
                  label="INTELECTO"
                  abbr="INT"
                  value={intellect}
                  color="hsl(var(--primary))"
                  onDecrease={() => handleAttributeChange('intellect', -1)}
                  onIncrease={() => handleAttributeChange('intellect', 1)}
                />
                <AttributeEditor
                  label="PRESENÇA"
                  abbr="PRE"
                  value={presence}
                  color="hsl(var(--paranormal))"
                  onDecrease={() => handleAttributeChange('presence', -1)}
                  onIncrease={() => handleAttributeChange('presence', 1)}
                />
                <AttributeEditor
                  label="VIGOR"
                  abbr="VIG"
                  value={vigor}
                  color="hsl(var(--success))"
                  onDecrease={() => handleAttributeChange('vigor', -1)}
                  onIncrease={() => handleAttributeChange('vigor', 1)}
                />
              </div>

              {/* Total de pontos */}
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Total de Pontos em Atributos:{' '}
                  <span className="font-display text-lg text-foreground">{totalAttributePoints}</span>
                </p>
              </div>
            </TabsContent>

            {/* SKILLS TAB */}
            <TabsContent value="skills" className="space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Perícias Treinadas:{' '}
                  <span className="font-display text-lg text-primary">{trainedSkillCount}</span>
                </p>
                <Badge variant="outline" className="text-xs">
                  +5 de bônus por treino
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {SKILLS.map((skill) => {
                  const isTrained = !!trainedSkills[skill.id];
                  const attrLabels: Record<string, string> = {
                    agility: 'AGI',
                    strength: 'FOR',
                    intellect: 'INT',
                    presence: 'PRE',
                    vigor: 'VIG',
                  };
                  
                  return (
                    <motion.div
                      key={skill.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                        ${isTrained 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-muted/20 border border-transparent hover:bg-muted/40'
                        }
                      `}
                      onClick={() => handleSkillToggle(skill.id)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Checkbox 
                        checked={isTrained} 
                        onCheckedChange={() => handleSkillToggle(skill.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${isTrained ? 'font-medium' : ''}`}>
                          {skill.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {attrLabels[skill.attribute]}
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            {/* BIO TAB */}
            <TabsContent value="bio" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="appearance">Aparência</Label>
                <Textarea
                  id="appearance"
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                  placeholder="Descreva a aparência física do personagem..."
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personality">Personalidade</Label>
                <Textarea
                  id="personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="Como o personagem age e se comporta..."
                  rows={3}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="background">História</Label>
                <Textarea
                  id="background"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="A história e background do personagem..."
                  rows={4}
                  maxLength={2000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas do Jogador</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações pessoais, lembretes, itens especiais..."
                  rows={3}
                  maxLength={2000}
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="gap-2 mt-4">
          {/* Botão de Reset */}
          {hasAnyChanges && (
            <Button 
              variant="ghost" 
              onClick={handleReset} 
              disabled={saving}
              className="mr-auto text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restaurar Original
            </Button>
          )}
          
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleTrySave} 
            disabled={saving || !name.trim()}
            className={hasSignificantChanges ? 'bg-warning hover:bg-warning/90 text-warning-foreground' : ''}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : hasSignificantChanges ? (
              <AlertTriangle className="w-4 h-4 mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {hasSignificantChanges ? 'Revisar Mudanças' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Dialog de confirmação para mudanças significativas */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              CONFIRMAR MUDANÇAS NOS ATRIBUTOS
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Você está prestes a alterar atributos que afetam os stats derivados do personagem.
                </p>

                {/* Lista de mudanças nos atributos */}
                {attributeChanges.length > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Alterações nos Atributos
                    </p>
                    {attributeChanges.map((change, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{change.attr}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{change.from}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className={change.to > change.from ? 'text-success' : 'text-destructive'}>
                            {change.to}
                          </span>
                          {change.to > change.from ? (
                            <ArrowUp className="w-3 h-3 text-success" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-destructive" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Impacto nos stats */}
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg space-y-2">
                  <p className="text-xs font-medium text-warning uppercase tracking-wider">
                    Impacto nos Stats Derivados
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {statsImpact.hp !== 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">PV Máx</p>
                        <p className={`font-display text-lg ${statsImpact.hp > 0 ? 'text-success' : 'text-destructive'}`}>
                          {statsImpact.hp > 0 ? '+' : ''}{statsImpact.hp}
                        </p>
                      </div>
                    )}
                    {statsImpact.pe !== 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">PE Máx</p>
                        <p className={`font-display text-lg ${statsImpact.pe > 0 ? 'text-success' : 'text-destructive'}`}>
                          {statsImpact.pe > 0 ? '+' : ''}{statsImpact.pe}
                        </p>
                      </div>
                    )}
                    {statsImpact.san !== 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">SAN Máx</p>
                        <p className={`font-display text-lg ${statsImpact.san > 0 ? 'text-success' : 'text-destructive'}`}>
                          {statsImpact.san > 0 ? '+' : ''}{statsImpact.san}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Discuta com o mestre antes de fazer alterações significativas.
                  Esta ação pode afetar o balanceamento do jogo.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSave}
              disabled={saving}
              className="bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Confirmar Mudanças
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

// Componente de editor de atributo
function AttributeEditor({
  label,
  abbr,
  value,
  color,
  onDecrease,
  onIncrease,
}: {
  label: string;
  abbr: string;
  value: number;
  color: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg border"
      style={{ 
        backgroundColor: `${color}10`,
        borderColor: `${color}30`,
      }}
    >
      <div className="flex items-center gap-3">
        <span 
          className="font-display text-lg w-12"
          style={{ color }}
        >
          {abbr}
        </span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDecrease}
          disabled={value <= MIN_ATTRIBUTE}
          className="w-8 h-8 p-0"
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <span 
          className="font-display text-2xl w-10 text-center"
          style={{ color }}
        >
          {value}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onIncrease}
          disabled={value >= MAX_ATTRIBUTE}
          className="w-8 h-8 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
