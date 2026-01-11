/**
 * MacrosPanel - Painel de gerenciamento de macros de rolagem
 * 
 * Permite criar, editar, executar e organizar macros de rolagem.
 * Integra com o sistema de chat da campanha.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dices,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload,
  RotateCcw,
  ChevronDown,
  Sword,
  Shield,
  Target,
  Heart,
  Sparkles,
  Zap,
  Play,
} from 'lucide-react';
import { useMacros } from '@/hooks/campaign/useMacros';
import { MacroEditor, type RollMacro, type MacroType } from '@/components/combat/MacroEditor';
import { useToast } from '@/hooks/use-toast';

// Mapa de ícones
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  dices: Dices,
  sword: Sword,
  shield: Shield,
  target: Target,
  heart: Heart,
  sparkles: Sparkles,
  zap: Zap,
};

// Mapa de cores
const COLOR_MAP: Record<string, string> = {
  default: 'bg-accent',
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
};

// Nomes dos tipos
const TYPE_NAMES: Record<MacroType, string> = {
  skill: 'Testes de Perícia',
  attack: 'Ataques',
  damage: 'Dano',
  save: 'Resistências',
  custom: 'Personalizados',
};

interface MacrosPanelProps {
  characterId: string;
  onRoll: (formula: string, label: string, type: string) => void;
  className?: string;
}

export function MacrosPanel({ characterId, onRoll, className }: MacrosPanelProps) {
  const { toast } = useToast();
  const {
    macros,
    isLoading,
    addMacro,
    updateMacro,
    deleteMacro,
    duplicateMacro,
    exportMacros,
    importMacros,
    resetToDefaults,
  } = useMacros({ characterId });

  // Estados locais
  const [searchQuery, setSearchQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMacro, setEditingMacro] = useState<RollMacro | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<MacroType[]>(['skill', 'attack', 'save']);

  // Filtra e agrupa macros
  const filteredMacros = useMemo(() => {
    const filtered = macros.filter(m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.label?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Agrupa por tipo
    const grouped: Record<MacroType, RollMacro[]> = {
      skill: [],
      attack: [],
      damage: [],
      save: [],
      custom: [],
    };

    filtered.forEach(m => {
      grouped[m.type].push(m);
    });

    return grouped;
  }, [macros, searchQuery]);

  // Executa rolagem
  const handleRoll = (macro: RollMacro) => {
    const formula = `${macro.diceCount}d${macro.diceType}${macro.bonus > 0 ? `+${macro.bonus}` : macro.bonus < 0 ? macro.bonus : ''}`;
    const label = macro.label || macro.name;
    onRoll(formula, label, macro.type);
    
    toast({
      title: `🎲 ${macro.name}`,
      description: `Rolando ${formula}...`,
      duration: 2000,
    });
  };

  // Editar macro
  const handleEdit = (macro: RollMacro) => {
    setEditingMacro(macro);
    setEditorOpen(true);
  };

  // Nova macro
  const handleNew = () => {
    setEditingMacro(null);
    setEditorOpen(true);
  };

  // Salvar macro
  const handleSave = (macroData: Omit<RollMacro, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingMacro) {
      updateMacro(editingMacro.id, macroData);
      toast({ title: 'Macro atualizada', description: `"${macroData.name}" foi salva.` });
    } else {
      addMacro(macroData);
      toast({ title: 'Macro criada', description: `"${macroData.name}" foi adicionada.` });
    }
  };

  // Deletar macro
  const handleDelete = (macroId: string) => {
    const macro = macros.find(m => m.id === macroId);
    deleteMacro(macroId);
    toast({ title: 'Macro excluída', description: `"${macro?.name}" foi removida.` });
  };

  // Duplicar macro
  const handleDuplicate = (macroId: string) => {
    const duplicate = duplicateMacro(macroId);
    if (duplicate) {
      toast({ title: 'Macro duplicada', description: `"${duplicate.name}" foi criada.` });
    }
  };

  // Exportar
  const handleExport = () => {
    const json = exportMacros();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macros-${characterId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Macros exportadas', description: `${macros.length} macros salvas.` });
  };

  // Importar
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const count = importMacros(reader.result as string);
          toast({ title: 'Macros importadas', description: `${count} macros adicionadas.` });
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Resetar
  const handleReset = () => {
    resetToDefaults();
    toast({ title: 'Macros restauradas', description: 'Macros padrão foram restauradas.' });
  };

  // Toggle de categoria expandida
  const toggleType = (type: MacroType) => {
    setExpandedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Dices className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Dices className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg tracking-wider">MACROS</h3>
          <Badge variant="secondary" className="ml-1">
            {macros.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleNew} className="gap-1">
            <Plus className="w-4 h-4" />
            Nova
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImport}>
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleReset} className="text-destructive">
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar Padrão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Busca */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar macros..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Lista de Macros */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {(Object.keys(filteredMacros) as MacroType[]).map((type) => {
            const typeMacros = filteredMacros[type];
            if (typeMacros.length === 0) return null;

            const isExpanded = expandedTypes.includes(type);

            return (
              <Collapsible
                key={type}
                open={isExpanded}
                onOpenChange={() => toggleType(type)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <span className="text-sm font-medium text-muted-foreground">
                    {TYPE_NAMES[type]}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {typeMacros.length}
                    </Badge>
                    <ChevronDown className={cn(
                      'w-4 h-4 transition-transform',
                      isExpanded && 'rotate-180'
                    )} />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-1 space-y-1">
                    <AnimatePresence mode="popLayout">
                      {typeMacros.map((macro) => (
                        <MacroItem
                          key={macro.id}
                          macro={macro}
                          onRoll={() => handleRoll(macro)}
                          onEdit={() => handleEdit(macro)}
                          onDelete={() => handleDelete(macro.id)}
                          onDuplicate={() => handleDuplicate(macro.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}

          {macros.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Dices className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma macro criada</p>
              <Button
                variant="link"
                size="sm"
                onClick={handleNew}
                className="mt-2"
              >
                Criar primeira macro
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Editor Dialog */}
      <MacroEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        macro={editingMacro}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

// Componente de item de macro
interface MacroItemProps {
  macro: RollMacro;
  onRoll: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function MacroItem({ macro, onRoll, onEdit, onDelete, onDuplicate }: MacroItemProps) {
  const IconComponent = ICON_MAP[macro.icon || 'dices'] || Dices;
  const colorClass = COLOR_MAP[macro.color || 'default'] || COLOR_MAP.default;
  
  const formula = `${macro.diceCount}d${macro.diceType}${macro.bonus > 0 ? `+${macro.bonus}` : macro.bonus < 0 ? macro.bonus : ''}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="group flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
    >
      {/* Ícone colorido */}
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg text-white shrink-0',
        colorClass
      )}>
        <IconComponent className="w-4 h-4" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{macro.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{formula}</p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRoll}
              >
                <Play className="w-3.5 h-3.5 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rolar</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRoll}>
              <Play className="w-4 h-4 mr-2" />
              Rolar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export default MacrosPanel;
