/**
 * Modal de Edição de Template
 * Permite editar metadados de um template existente
 * 
 * @module components/templates/TemplateEditModal
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Save, Loader2, X, Globe, Lock, Info, Tag } from '@/components/icons/ordem-icons';
import { useUpdateTemplate } from '@/hooks/useTemplates';
import type { CharacterTemplate, TemplateDifficulty, UpdateTemplateDto } from '@/types/templates';
import { ROLE_TAGS, STYLE_TAGS, THEME_TAGS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/types/templates';
import { cn } from '@/lib/utils';

interface TemplateEditModalProps {
  /** Template a ser editado */
  template: CharacterTemplate;
  /** Se o modal está aberto */
  open: boolean;
  /** Callback para fechar o modal */
  onOpenChange: (open: boolean) => void;
}

// Níveis de dificuldade
const DIFFICULTY_OPTIONS: { value: TemplateDifficulty; label: string; description: string }[] = [
  { value: 'beginner', label: 'Iniciante', description: 'Fácil de jogar, poucas mecânicas complexas' },
  { value: 'intermediate', label: 'Intermediário', description: 'Requer algum conhecimento do sistema' },
  { value: 'advanced', label: 'Avançado', description: 'Mecânicas complexas, muitas opções' },
];

export function TemplateEditModal({ template, open, onOpenChange }: TemplateEditModalProps) {
  const updateTemplate = useUpdateTemplate();
  
  // Estados do formulário
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || '');
  const [isPublic, setIsPublic] = useState(template.is_public);
  const [difficulty, setDifficulty] = useState<TemplateDifficulty>(
    template.difficulty_level as TemplateDifficulty || 'intermediate'
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(template.tags || []);
  const [minNex, setMinNex] = useState(template.min_nex);
  const [maxNex, setMaxNex] = useState(template.max_nex);
  
  // Reset ao abrir com novo template
  useEffect(() => {
    setName(template.name);
    setDescription(template.description || '');
    setIsPublic(template.is_public);
    setDifficulty(template.difficulty_level as TemplateDifficulty || 'intermediate');
    setSelectedTags(template.tags || []);
    setMinNex(template.min_nex);
    setMaxNex(template.max_nex);
  }, [template]);
  
  // Toggle de tag
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  // Submissão
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    const dto: UpdateTemplateDto = {
      name: name.trim(),
      description: description.trim() || undefined,
      is_public: isPublic,
      difficulty_level: difficulty,
      tags: selectedTags,
      min_nex: minNex,
      max_nex: maxNex,
    };
    
    await updateTemplate.mutateAsync({ id: template.id, dto });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-3 font-display text-xl tracking-wider">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-foreground">EDITAR TEMPLATE</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                Atualize as informações do seu template
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 px-6">
            <Tabs defaultValue="info" className="py-4">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="info" className="gap-2">
                  <Info className="w-4 h-4" />
                  <span className="hidden sm:inline">Informações</span>
                </TabsTrigger>
                <TabsTrigger value="tags" className="gap-2">
                  <Tag className="w-4 h-4" />
                  <span className="hidden sm:inline">Tags</span>
                </TabsTrigger>
                <TabsTrigger value="visibility" className="gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Visibilidade</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Tab: Informações Básicas */}
              <TabsContent value="info" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Template *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Combatente Tanque Iniciante"
                    maxLength={100}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {name.length}/100 caracteres
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o conceito do template, estilo de jogo e dicas..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length}/500 caracteres
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Dificuldade</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDifficulty(opt.value)}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-all',
                          difficulty === opt.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <Badge className={cn('mb-2', DIFFICULTY_COLORS[opt.value])}>
                          {opt.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {opt.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minNex">NEX Mínimo</Label>
                    <Input
                      id="minNex"
                      type="number"
                      value={minNex}
                      onChange={(e) => setMinNex(parseInt(e.target.value) || 5)}
                      min={5}
                      max={99}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxNex">NEX Máximo</Label>
                    <Input
                      id="maxNex"
                      type="number"
                      value={maxNex}
                      onChange={(e) => setMaxNex(parseInt(e.target.value) || 99)}
                      min={5}
                      max={99}
                      step={5}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Tab: Tags */}
              <TabsContent value="tags" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Função/Role</Label>
                    <div className="flex flex-wrap gap-2">
                      {ROLE_TAGS.map((tag) => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                          className={cn(
                            'cursor-pointer transition-all',
                            selectedTags.includes(tag)
                              ? 'bg-primary'
                              : 'hover:bg-primary/20'
                          )}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                          {selectedTags.includes(tag) && (
                            <X className="w-3 h-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Estilo de Jogo</Label>
                    <div className="flex flex-wrap gap-2">
                      {STYLE_TAGS.map((tag) => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                          className={cn(
                            'cursor-pointer transition-all',
                            selectedTags.includes(tag)
                              ? 'bg-primary'
                              : 'hover:bg-primary/20'
                          )}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                          {selectedTags.includes(tag) && (
                            <X className="w-3 h-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Tema</Label>
                    <div className="flex flex-wrap gap-2">
                      {THEME_TAGS.map((tag) => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                          className={cn(
                            'cursor-pointer transition-all',
                            selectedTags.includes(tag)
                              ? 'bg-primary'
                              : 'hover:bg-primary/20'
                          )}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                          {selectedTags.includes(tag) && (
                            <X className="w-3 h-3 ml-1" />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {selectedTags.length} tags selecionadas
                  </p>
                </div>
              </TabsContent>
              
              {/* Tab: Visibilidade */}
              <TabsContent value="visibility" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      {isPublic ? (
                        <Globe className="w-5 h-5 text-green-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {isPublic ? 'Template Público' : 'Template Privado'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {isPublic 
                            ? 'Outros jogadores podem ver e usar este template'
                            : 'Apenas você pode ver e usar este template'
                          }
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                  </div>
                  
                  {isPublic && (
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-sm text-muted-foreground">
                        <strong>Dica:</strong> Templates públicos podem receber avaliações 
                        de outros jogadores. Certifique-se de que a descrição está clara 
                        e as tags estão corretas para ajudar outros a encontrarem seu template.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
          
          <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateTemplate.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || updateTemplate.isPending}
            >
              {updateTemplate.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
