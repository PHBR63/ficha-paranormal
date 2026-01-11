// Modal de Edição Completa do Personagem
// Permite alterar atributos, perícias e características

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MobileModal,
  MobileModalContent,
  MobileModalHeader,
  MobileModalBody,
  MobileModalFooter,
  MobileModalTitle,
} from '@/components/ui/mobile-modal';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
// ScrollArea removido - MobileModalBody já inclui
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
  HelpCircle,
} from 'lucide-react';
import { ORIGINS, SKILLS, CLASSES, calculateDerivedStats, countTranscender } from '@/lib/character-data';
import { ImageUploader } from '@/components/ui/image-uploader';
import { supabase } from '@/integrations/supabase/client';

// Tooltips explicativos para cada campo
const FIELD_TOOLTIPS = {
  photo: 'Imagem do personagem. Clique para fazer upload de uma foto.',
  name: 'Nome pelo qual o personagem é conhecido no mundo do jogo.',
  playerName: 'Seu nome real como jogador, para identificação na mesa.',
  age: 'Idade do personagem em anos. Afeta como NPCs podem reagir a ele.',
  gender: 'Identidade de gênero do personagem. Livre para personalização.',
  defense: 'Valor base de defesa. Representa o quão difícil é acertar o personagem. DEF = 10 + AGI + Equipamento.',
  appearance: 'Descrição física: altura, peso, cabelo, olhos, cicatrizes, tatuagens, estilo de roupa, etc.',
  personality: 'Traços de personalidade, manias, vícios, medos, objetivos e como o personagem interage com outros.',
  background: 'A história de vida do personagem: onde nasceu, como cresceu, eventos marcantes e como se envolveu com o Outro Lado.',
  notes: 'Anotações pessoais, lembretes, itens especiais, contatos, missões e qualquer informação adicional.',
  agility: 'Reflexos, coordenação e velocidade. Afeta Defesa, iniciativa e perícias como Acrobacia e Furtividade.',
  strength: 'Força física bruta. Afeta dano corpo a corpo e perícias como Atletismo e Luta.',
  intellect: 'Capacidade mental, memória e raciocínio. Afeta PE Máximo e perícias como Investigação e Ciências.',
  presence: 'Força de vontade e carisma. Afeta SAN Máxima e perícias como Intimidação e Diplomacia.',
  vigor: 'Resistência física e saúde. Afeta PV Máximo e perícias como Fortitude.',
  skills: 'Perícias treinadas concedem +5 de bônus. Clique para treinar/destreinar.',
};

// Componente de tooltip para campos
function FieldTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-foreground/60 hover:text-foreground cursor-help ml-1" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px] text-xs">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

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
  photo_url: string | null;
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
    photo_url?: string | null;
    abilities?: string[];
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

  // Foto do personagem
  const [photoUrl, setPhotoUrl] = useState<string | null>(character.photo_url || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Estado para confirmação de mudanças críticas
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Estado para erros de validação
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cálculos de pontos
  const totalAttributePoints = agility + strength + intellect + presence + vigor;
  const originData = ORIGINS.find(o => o.id === character.origin);

  // Conta perícias treinadas
  const trainedSkillCount = Object.keys(trainedSkills).length;

  // Stats originais do personagem
  const originalStats = useMemo(() => {
    const transcender = countTranscender(character.abilities as string[]);
    return calculateDerivedStats(
      character.class,
      character.vigor,
      character.presence,
      character.nex,
      character.origin,
      character.abilities as string[],
      transcender
    );
  }, [character]);

  // Calcula stats derivados para preview
  const derivedStats = useMemo(() => {
    const transcender = countTranscender(character.abilities as string[]);
    return calculateDerivedStats(
      character.class,
      vigor,
      presence,
      character.nex,
      character.origin,
      character.abilities as string[],
      transcender
    );
  }, [character.class, vigor, presence, character.nex, character.origin, character.abilities]);

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
    
    // Restaura foto
    setPhotoUrl(character.photo_url || null);
    setPhotoFile(null);
  };

  // Rastreia quais campos foram alterados
  const changedFields = useMemo(() => {
    const originalSkillKeys = Object.keys(character.skills).filter(k => character.skills[k] > 0);
    const currentSkillKeys = Object.keys(trainedSkills);
    const skillsChanged = originalSkillKeys.length !== currentSkillKeys.length || 
      !originalSkillKeys.every(k => trainedSkills[k]);

    return {
      name: name !== character.name,
      playerName: (playerName || '') !== (character.player_name || ''),
      age: String(age || '') !== String(character.age || ''),
      gender: (gender || '') !== (character.gender || ''),
      appearance: (appearance || '') !== (character.appearance || ''),
      personality: (personality || '') !== (character.personality || ''),
      background: (background || '') !== (character.background || ''),
      notes: (notes || '') !== (character.notes || ''),
      photo: photoFile !== null || photoUrl !== (character.photo_url || null),
      agility: agility !== character.agility,
      strength: strength !== character.strength,
      intellect: intellect !== character.intellect,
      presence: presence !== character.presence,
      vigor: vigor !== character.vigor,
      defense: defense !== character.defense,
      skills: skillsChanged,
    };
  }, [name, playerName, age, gender, appearance, personality, background, notes, photoFile, photoUrl, agility, strength, intellect, presence, vigor, defense, trainedSkills, character]);

  // Verifica se há qualquer mudança
  const hasAnyChanges = useMemo(() => {
    return Object.values(changedFields).some(Boolean);
  }, [changedFields]);

  // Classe CSS para campos alterados
  const getFieldClass = (isChanged: boolean) => 
    isChanged ? 'ring-2 ring-warning/50 bg-warning/5' : '';

  // Função de validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validação do nome (obrigatório)
    if (!name.trim()) {
      newErrors.name = 'O nome do personagem é obrigatório.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'O nome deve ter pelo menos 2 caracteres.';
    } else if (name.trim().length > 100) {
      newErrors.name = 'O nome deve ter no máximo 100 caracteres.';
    }

    // Validação da idade (se preenchida)
    if (age) {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
        newErrors.age = 'A idade deve estar entre 1 e 150 anos.';
      }
    }

    // Validação da defesa
    if (defense < 0) {
      newErrors.defense = 'A defesa não pode ser negativa.';
    } else if (defense > 99) {
      newErrors.defense = 'A defesa deve ser no máximo 99.';
    }

    // Validação dos atributos
    const attrs = { agility, strength, intellect, presence, vigor };
    Object.entries(attrs).forEach(([attr, val]) => {
      if (val < MIN_ATTRIBUTE || val > MAX_ATTRIBUTE) {
        newErrors[attr] = `O atributo deve estar entre ${MIN_ATTRIBUTE} e ${MAX_ATTRIBUTE}.`;
      }
    });

    // Validação de campos de texto longos
    if (appearance.length > 1000) {
      newErrors.appearance = 'A aparência deve ter no máximo 1000 caracteres.';
    }
    if (personality.length > 1000) {
      newErrors.personality = 'A personalidade deve ter no máximo 1000 caracteres.';
    }
    if (background.length > 2000) {
      newErrors.background = 'A história deve ter no máximo 2000 caracteres.';
    }
    if (notes.length > 2000) {
      newErrors.notes = 'As notas devem ter no máximo 2000 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Limpa erro específico quando usuário começa a digitar
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTrySave = () => {
    // Valida o formulário antes de salvar
    if (!validateForm()) {
      // Se houver erro no nome, vai para a aba INFO
      if (errors.name) {
        setActiveTab('info');
      }
      return;
    }
    
    // Se houver mudanças significativas, mostra confirmação
    if (hasSignificantChanges) {
      setShowConfirmDialog(true);
    } else {
      handleSave();
    }
  };

  // Handler para upload de foto
  const handlePhotoChange = (url: string | null, file?: File) => {
    setPhotoUrl(url);
    setPhotoFile(file || null);
  };

  // Upload foto para Supabase Storage
  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return photoUrl; // Retorna URL existente se não houver novo arquivo
    
    setUploadingPhoto(true);
    
    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${character.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('character-avatars')
        .upload(filePath, photoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('character-avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      return photoUrl; // Mantém URL existente em caso de erro
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handler para salvar
  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    setShowConfirmDialog(false);
    
    try {
      // Upload da foto primeiro se houver
      const finalPhotoUrl = await uploadPhoto();
      
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
        photo_url: finalPhotoUrl,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar personagem:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileModal open={open} onOpenChange={onClose}>
      <MobileModalContent size="lg" className="p-0 gap-0">
        <MobileModalHeader bordered className="p-4 sm:p-6 pb-2">
          <MobileModalTitle className="font-display tracking-wider text-center">
            EDITAR PERSONAGEM
          </MobileModalTitle>
        </MobileModalHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid grid-cols-4 w-full shrink-0 mx-4 sm:mx-6 mt-3 sm:mt-4" style={{ width: 'calc(100% - 2rem)' }}>
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

          <MobileModalBody className="mt-3 sm:mt-4">
            <div className="px-4 sm:px-6 pb-4">
            {/* INFO TAB */}
            <TabsContent value="info" className="space-y-4 mt-0">
              {/* Foto e nome */}
              <div className="flex gap-4">
                <div className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-all ${changedFields.photo ? 'ring-2 ring-warning/50 bg-warning/5' : ''}`}>
                  <Label className="text-center flex items-center gap-1">
                    Foto
                    {changedFields.photo && <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
                    <FieldTooltip content={FIELD_TOOLTIPS.photo} />
                  </Label>
                  <ImageUploader
                    value={photoUrl}
                    onChange={handlePhotoChange}
                    size="lg"
                    shape="square"
                    placeholder="Foto do personagem"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1">
                      Nome do Personagem *
                      {changedFields.name && <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
                      <FieldTooltip content={FIELD_TOOLTIPS.name} />
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearError('name');
                      }}
                      placeholder="Nome do personagem"
                      maxLength={100}
                      className={`${getFieldClass(changedFields.name)} ${errors.name ? 'ring-2 ring-destructive border-destructive' : ''}`}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="playerName" className="flex items-center gap-1">
                      Nome do Jogador
                      {changedFields.playerName && <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
                      <FieldTooltip content={FIELD_TOOLTIPS.playerName} />
                    </Label>
                    <Input
                      id="playerName"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Seu nome"
                      maxLength={100}
                      className={getFieldClass(changedFields.playerName)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-1">
                    Idade
                    {changedFields.age && <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
                    <FieldTooltip content={FIELD_TOOLTIPS.age} />
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      clearError('age');
                    }}
                    placeholder="30"
                    min={1}
                    max={150}
                    className={`${getFieldClass(changedFields.age)} ${errors.age ? 'ring-2 ring-destructive border-destructive' : ''}`}
                  />
                  {errors.age && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.age}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="flex items-center gap-1">
                    Gênero
                    {changedFields.gender && <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
                    <FieldTooltip content={FIELD_TOOLTIPS.gender} />
                  </Label>
                  <Input
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="Ex: Masculino"
                    maxLength={50}
                    className={getFieldClass(changedFields.gender)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Defesa Base
                    {changedFields.defense && <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
                    <FieldTooltip content={FIELD_TOOLTIPS.defense} />
                  </Label>
                  <Input
                    type="number"
                    value={defense}
                    onChange={(e) => {
                      setDefense(Math.max(0, parseInt(e.target.value) || 0));
                      clearError('defense');
                    }}
                    min={0}
                    max={99}
                    className={`${getFieldClass(changedFields.defense)} ${errors.defense ? 'ring-2 ring-destructive border-destructive' : ''}`}
                  />
                  {errors.defense && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.defense}
                    </p>
                  )}
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
                    <p className="font-display text-xl text-pe">{derivedStats.pe}</p>
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
                  isChanged={changedFields.agility}
                  tooltip={FIELD_TOOLTIPS.agility}
                />
                <AttributeEditor
                  label="FORÇA"
                  abbr="FOR"
                  value={strength}
                  color="hsl(var(--destructive))"
                  onDecrease={() => handleAttributeChange('strength', -1)}
                  onIncrease={() => handleAttributeChange('strength', 1)}
                  isChanged={changedFields.strength}
                  tooltip={FIELD_TOOLTIPS.strength}
                />
                <AttributeEditor
                  label="INTELECTO"
                  abbr="INT"
                  value={intellect}
                  color="hsl(var(--primary))"
                  onDecrease={() => handleAttributeChange('intellect', -1)}
                  onIncrease={() => handleAttributeChange('intellect', 1)}
                  isChanged={changedFields.intellect}
                  tooltip={FIELD_TOOLTIPS.intellect}
                />
                <AttributeEditor
                  label="PRESENÇA"
                  abbr="PRE"
                  value={presence}
                  color="hsl(var(--paranormal))"
                  onDecrease={() => handleAttributeChange('presence', -1)}
                  onIncrease={() => handleAttributeChange('presence', 1)}
                  isChanged={changedFields.presence}
                  tooltip={FIELD_TOOLTIPS.presence}
                />
                <AttributeEditor
                  label="VIGOR"
                  abbr="VIG"
                  value={vigor}
                  color="hsl(var(--success))"
                  onDecrease={() => handleAttributeChange('vigor', -1)}
                  onIncrease={() => handleAttributeChange('vigor', 1)}
                  isChanged={changedFields.vigor}
                  tooltip={FIELD_TOOLTIPS.vigor}
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
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  Perícias Treinadas:{' '}
                  <span className="font-display text-lg text-primary">{trainedSkillCount}</span>
                  {changedFields.skills && (
                    <span className="text-xs text-warning flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                      Alterado
                    </span>
                  )}
                  <FieldTooltip content={FIELD_TOOLTIPS.skills} />
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="appearance" className="flex items-center gap-1">
                    Aparência
                    {changedFields.appearance && <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
                    <FieldTooltip content={FIELD_TOOLTIPS.appearance} />
                  </Label>
                  <span className={`text-xs ${appearance.length > 900 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {appearance.length}/1000
                  </span>
                </div>
                <Textarea
                  id="appearance"
                  value={appearance}
                  onChange={(e) => {
                    setAppearance(e.target.value);
                    clearError('appearance');
                  }}
                  placeholder="Descreva a aparência física do personagem..."
                  rows={3}
                  maxLength={1000}
                  className={`${getFieldClass(changedFields.appearance)} ${errors.appearance ? 'ring-2 ring-destructive border-destructive' : ''}`}
                />
                {errors.appearance && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.appearance}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="personality" className="flex items-center gap-1">
                    Personalidade
                    {changedFields.personality && <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
                    <FieldTooltip content={FIELD_TOOLTIPS.personality} />
                  </Label>
                  <span className={`text-xs ${personality.length > 900 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {personality.length}/1000
                  </span>
                </div>
                <Textarea
                  id="personality"
                  value={personality}
                  onChange={(e) => {
                    setPersonality(e.target.value);
                    clearError('personality');
                  }}
                  placeholder="Como o personagem age e se comporta..."
                  rows={3}
                  maxLength={1000}
                  className={`${getFieldClass(changedFields.personality)} ${errors.personality ? 'ring-2 ring-destructive border-destructive' : ''}`}
                />
                {errors.personality && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.personality}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="background" className="flex items-center gap-1">
                    História
                    {changedFields.background && <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
                    <FieldTooltip content={FIELD_TOOLTIPS.background} />
                  </Label>
                  <span className={`text-xs ${background.length > 1800 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {background.length}/2000
                  </span>
                </div>
                <Textarea
                  id="background"
                  value={background}
                  onChange={(e) => {
                    setBackground(e.target.value);
                    clearError('background');
                  }}
                  placeholder="A história e background do personagem..."
                  rows={4}
                  maxLength={2000}
                  className={`${getFieldClass(changedFields.background)} ${errors.background ? 'ring-2 ring-destructive border-destructive' : ''}`}
                />
                {errors.background && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.background}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notes" className="flex items-center gap-1">
                    Notas do Jogador
                    {changedFields.notes && <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
                    <FieldTooltip content={FIELD_TOOLTIPS.notes} />
                  </Label>
                  <span className={`text-xs ${notes.length > 1800 ? 'text-warning' : 'text-muted-foreground'}`}>
                    {notes.length}/2000
                  </span>
                </div>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    clearError('notes');
                  }}
                  placeholder="Anotações pessoais, lembretes, itens especiais..."
                  rows={3}
                  maxLength={2000}
                  className={`${getFieldClass(changedFields.notes)} ${errors.notes ? 'ring-2 ring-destructive border-destructive' : ''}`}
                />
                {errors.notes && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.notes}
                  </p>
                )}
              </div>
            </TabsContent>
            </div>
          </MobileModalBody>
        </Tabs>

        {/* Resumo de erros */}
        {Object.keys(errors).length > 0 && (
          <div className="mx-4 sm:mx-6 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="text-xs text-destructive">
              <p className="font-medium">Corrija os erros antes de salvar:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {Object.values(errors).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <MobileModalFooter bordered className="gap-2 p-4 sm:p-6">
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
            disabled={saving}
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
        </MobileModalFooter>
      </MobileModalContent>

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
    </MobileModal>
  );
}

// Componente de editor de atributo com indicador de alteração e tooltip
function AttributeEditor({
  label,
  abbr,
  value,
  color,
  onDecrease,
  onIncrease,
  isChanged = false,
  tooltip,
}: {
  label: string;
  abbr: string;
  value: number;
  color: string;
  onDecrease: () => void;
  onIncrease: () => void;
  isChanged?: boolean;
  tooltip?: string;
}) {
  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isChanged ? 'ring-2 ring-warning/50' : ''}`}
      style={{ 
        backgroundColor: isChanged ? 'hsl(var(--warning) / 0.1)' : `${color}10`,
        borderColor: isChanged ? 'hsl(var(--warning) / 0.5)' : `${color}30`,
      }}
    >
      <div className="flex items-center gap-3">
        <span 
          className="font-display text-lg font-bold w-12 drop-shadow-sm"
          style={{ color }}
        >
          {abbr}
        </span>
        <span className="text-sm text-foreground/80 font-medium flex items-center gap-1">
          {label}
          {isChanged && <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
          {tooltip && <FieldTooltip content={tooltip} />}
        </span>
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
