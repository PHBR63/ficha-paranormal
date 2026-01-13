/**
 * Modal para Salvar Personagem como Template
 * Permite ao usuário criar um template a partir de um personagem existente
 * 
 * @module components/templates/TemplateSaveModal
 */

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Save, Loader2, X, Shield, Sword, Sparkles, Brain, AlertTriangle } from 'lucide-react';
import { useCreateTemplate } from '@/hooks/useTemplates';
import { useToast } from '@/hooks/use-toast';
import type { CharacterTemplateData, TemplateDifficulty, TemplateClassPower, TemplateEquipment } from '@/types/templates';
import { ROLE_TAGS, STYLE_TAGS, THEME_TAGS } from '@/types/templates';
import { cn } from '@/lib/utils';

// Tipo do personagem vindo do CharacterSheet
interface CharacterData {
  id: string;
  name: string;
  origin: string;
  class: string;
  class_track?: string | null;
  elemental_affinity?: string | null;
  nex: number;
  agility: number;
  strength: number;
  intellect: number;
  vigor: number;
  presence: number;
  skills: Record<string, number>;
  abilities: Array<{ id: string; name: string }>;
  general_powers?: Array<{ id: string; name: string }>;
  paranormal_powers?: Array<{ id: string; name: string; element: string }>;
  rituals?: string[];
  inventory?: Array<{ id?: string; name: string; itemType?: string; isEquipped?: boolean }>;
}

interface TemplateSaveModalProps {
  /** Se o modal está aberto */
  open: boolean;
  /** Callback para fechar o modal */
  onOpenChange: (open: boolean) => void;
  /** Dados do personagem a ser convertido em template */
  character: CharacterData;
}

// Níveis de dificuldade
const DIFFICULTY_OPTIONS: { value: TemplateDifficulty; label: string; description: string }[] = [
  { value: 'beginner', label: 'Iniciante', description: 'Fácil de jogar, poucas mecânicas complexas' },
  { value: 'intermediate', label: 'Intermediário', description: 'Requer algum conhecimento do sistema' },
  { value: 'advanced', label: 'Avançado', description: 'Mecânicas complexas, muitas opções' },
];

export function TemplateSaveModal({ open, onOpenChange, character }: TemplateSaveModalProps) {
  const { toast } = useToast();
  const createTemplate = useCreateTemplate();
  
  // Estados do formulário
  const [name, setName] = useState(`Template: ${character.name}`);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [difficulty, setDifficulty] = useState<TemplateDifficulty>('intermediate');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Converte o personagem para dados de template
  const templateData = useMemo((): CharacterTemplateData => {
    // Extrai perícias treinadas (valor >= 5)
    const trainedSkills = Object.entries(character.skills || {})
      .filter(([_, value]) => value >= 5)
      .map(([key]) => key);
    
    // Extrai poderes de classe
    const classPowers: TemplateClassPower[] = (character.abilities || []).map(ability => ({
      powerId: ability.id,
      nex: character.nex,
    }));
    
    // Extrai equipamento
    const equipment: TemplateEquipment = {
      weapons: [],
      items: [],
    };
    
    (character.inventory || []).forEach(item => {
      if (item.itemType === 'weapon' && item.isEquipped) {
        equipment.weapons.push({ id: item.id || item.name, quantity: 1 });
      } else if (item.itemType === 'armor' && item.isEquipped) {
        equipment.armor = item.id || item.name;
      }
    });
    
    return {
      origin: character.origin,
      classId: character.class,
      classTrack: character.class_track || null,
      elementalAffinity: character.elemental_affinity || undefined,
      attributes: {
        strength: character.strength,
        agility: character.agility,
        vigor: character.vigor,
        intellect: character.intellect,
        presence: character.presence,
        distribution_strategy: 'custom',
        notes: `Baseado no personagem ${character.name}`,
      },
      trainedSkills,
      classPowers,
      paranormalPowers: (character.paranormal_powers || []).map(p => ({
        powerId: p.id,
        nex: character.nex,
      })),
      generalPowers: (character.general_powers || []).map(p => p.id),
      initialRituals: character.rituals || [],
      equipment,
      appearance: {
        suggested_concept: `Baseado em ${character.name}`,
      },
      schema_version: 1,
    };
  }, [character]);
  
  // Toggle de tag
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  // Submissão do formulário
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Insira um nome para o template.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await createTemplate.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
        tags: selectedTags,
        difficulty_level: difficulty,
        template_data: templateData,
        min_nex: 5,
        max_nex: 99,
      });
      
      toast({
        title: 'Template criado!',
        description: isPublic 
          ? 'Seu template foi publicado na galeria.' 
          : 'Seu template foi salvo na sua coleção.',
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro ao criar template',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-3 font-display text-xl tracking-wider">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-foreground">SALVAR COMO TEMPLATE</span>
              <DialogDescription className="text-sm font-normal text-muted-foreground mt-0.5">
                Crie um modelo reutilizável baseado em {character.name}
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Nome do Template *</Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Guerreiro Tanque, Ocultista de Sangue..."
                  className="font-display"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-description">Descrição</Label>
                <Textarea
                  id="template-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva a estratégia, pontos fortes e estilo de jogo..."
                  rows={3}
                />
              </div>
            </div>
            
            {/* Preview do que será salvo */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <h4 className="font-display text-sm tracking-wider text-muted-foreground">O QUE SERÁ SALVO</h4>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Origem: <span className="text-foreground font-medium">{character.origin}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Sword className="w-4 h-4 text-primary" />
                  <span>Classe: <span className="text-foreground font-medium">{character.class}</span></span>
                </div>
                {character.class_track && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Trilha: <span className="text-foreground font-medium">{character.class_track}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span>Atributos: <span className="text-foreground font-medium">
                    AGI {character.agility} | FOR {character.strength} | INT {character.intellect} | PRE {character.presence} | VIG {character.vigor}
                  </span></span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5 pt-2">
                {templateData.trainedSkills.slice(0, 6).map(skill => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {templateData.trainedSkills.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{templateData.trainedSkills.length - 6}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Nível de dificuldade */}
            <div className="space-y-3">
              <Label>Nível de Dificuldade</Label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDifficulty(option.value)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      difficulty === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="font-display text-sm block">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tags */}
            <div className="space-y-3">
              <Label>Tags (opcional)</Label>
              
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Função</span>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_TAGS.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Estilo</span>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_TAGS.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Temática</span>
                <div className="flex flex-wrap gap-1.5">
                  {THEME_TAGS.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Visibilidade */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="public-toggle" className="cursor-pointer">Publicar na Galeria</Label>
                <p className="text-xs text-muted-foreground">
                  Outros jogadores poderão usar seu template
                </p>
              </div>
              <Switch
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
            
            {isPublic && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-amber-200/80">
                  Templates públicos podem ser usados por qualquer jogador. Certifique-se de que não contém informações pessoais ou de campanha.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createTemplate.isPending || !name.trim()}
          >
            {createTemplate.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
