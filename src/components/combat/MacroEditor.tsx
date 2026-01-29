/**
 * MacroEditor - Editor de macros de rolagem
 * 
 * Permite criar e editar macros personalizadas para rolagens rápidas.
 * Suporta dados, bônus, e labels personalizados.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dices,
  Save,
  X,
  Plus,
  Minus,
  Zap,
  Target,
  Shield,
  Sword,
  Heart,
  Sparkles,
} from 'lucide-react';

// Tipos de macro
export type MacroType = 'skill' | 'attack' | 'damage' | 'save' | 'custom';

// Interface da macro
export interface RollMacro {
  id: string;
  name: string;
  description?: string;
  type: MacroType;
  diceCount: number;
  diceType: number; // d20, d6, etc.
  bonus: number;
  label?: string;
  icon?: string;
  color?: string;
  showInBar: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Ícones disponíveis
const MACRO_ICONS = [
  { id: 'dices', icon: Dices, label: 'Dados' },
  { id: 'sword', icon: Sword, label: 'Ataque' },
  { id: 'shield', icon: Shield, label: 'Defesa' },
  { id: 'target', icon: Target, label: 'Alvo' },
  { id: 'heart', icon: Heart, label: 'Vida' },
  { id: 'sparkles', icon: Sparkles, label: 'Magia' },
  { id: 'zap', icon: Zap, label: 'Poder' },
];

// Cores disponíveis
const MACRO_COLORS = [
  { id: 'default', color: 'bg-accent', label: 'Padrão' },
  { id: 'red', color: 'bg-red-500', label: 'Vermelho' },
  { id: 'green', color: 'bg-green-500', label: 'Verde' },
  { id: 'blue', color: 'bg-blue-500', label: 'Azul' },
  { id: 'purple', color: 'bg-purple-500', label: 'Roxo' },
  { id: 'yellow', color: 'bg-yellow-500', label: 'Amarelo' },
  { id: 'orange', color: 'bg-orange-500', label: 'Laranja' },
];

interface MacroEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  macro?: RollMacro | null;
  onSave: (macro: Omit<RollMacro, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDelete?: (macroId: string) => void;
}

export function MacroEditor({
  open,
  onOpenChange,
  macro,
  onSave,
  onDelete,
}: MacroEditorProps) {
  const isEditing = !!macro;

  // Estado do formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<MacroType>('skill');
  const [diceCount, setDiceCount] = useState(1);
  const [diceType, setDiceType] = useState(20);
  const [bonus, setBonus] = useState(0);
  const [label, setLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('dices');
  const [selectedColor, setSelectedColor] = useState('default');
  const [showInBar, setShowInBar] = useState(true);
  
  // Handlers estáveis para Selects do Radix (evita loop #185)
  const handleTypeChange = useCallback((value: string) => {
    setType(value as MacroType);
  }, []);
  
  const handleDiceTypeChange = useCallback((value: string) => {
    setDiceType(parseInt(value));
  }, []);

  // Preenche formulário ao editar
  useEffect(() => {
    if (macro) {
      setName(macro.name);
      setDescription(macro.description || '');
      setType(macro.type);
      setDiceCount(macro.diceCount);
      setDiceType(macro.diceType);
      setBonus(macro.bonus);
      setLabel(macro.label || '');
      setSelectedIcon(macro.icon || 'dices');
      setSelectedColor(macro.color || 'default');
      setShowInBar(macro.showInBar);
    } else {
      // Reset para nova macro
      setName('');
      setDescription('');
      setType('skill');
      setDiceCount(1);
      setDiceType(20);
      setBonus(0);
      setLabel('');
      setSelectedIcon('dices');
      setSelectedColor('default');
      setShowInBar(true);
    }
  }, [macro, open]);

  // Formata a preview da rolagem
  const rollPreview = `${diceCount}d${diceType}${bonus > 0 ? `+${bonus}` : bonus < 0 ? bonus : ''}`;

  // Handler de salvamento
  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      diceCount,
      diceType,
      bonus,
      label: label.trim() || undefined,
      icon: selectedIcon,
      color: selectedColor,
      showInBar,
    });

    onOpenChange(false);
  };

  // Handler de exclusão
  const handleDelete = () => {
    if (macro && onDelete) {
      onDelete(macro.id);
      onOpenChange(false);
    }
  };

  const IconComponent = MACRO_ICONS.find(i => i.id === selectedIcon)?.icon || Dices;
  const colorClass = MACRO_COLORS.find(c => c.id === selectedColor)?.color || 'bg-accent';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-primary" />
            {isEditing ? 'Editar Macro' : 'Nova Macro de Rolagem'}
          </DialogTitle>
          <DialogDescription>
            Crie atalhos para suas rolagens mais frequentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview da macro */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center p-4 bg-secondary/50 rounded-lg border border-border"
          >
            <div className={cn(
              'flex items-center gap-3 px-4 py-2 rounded-lg text-white',
              colorClass
            )}>
              <IconComponent className="w-5 h-5" />
              <div className="text-center">
                <p className="font-medium">{name || 'Nome da Macro'}</p>
                <p className="text-sm opacity-80">{rollPreview}</p>
              </div>
            </div>
          </motion.div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="macro-name">Nome *</Label>
            <Input
              id="macro-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ataque com Espada"
              maxLength={30}
            />
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skill">Teste de Perícia</SelectItem>
                <SelectItem value="attack">Ataque</SelectItem>
                <SelectItem value="damage">Dano</SelectItem>
                <SelectItem value="save">Resistência</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dados */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setDiceCount(Math.max(1, diceCount - 1))}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  value={diceCount}
                  onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center h-9"
                  min={1}
                  max={10}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setDiceCount(Math.min(10, diceCount + 1))}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Dado</Label>
              <Select value={diceType.toString()} onValueChange={handleDiceTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">d4</SelectItem>
                  <SelectItem value="6">d6</SelectItem>
                  <SelectItem value="8">d8</SelectItem>
                  <SelectItem value="10">d10</SelectItem>
                  <SelectItem value="12">d12</SelectItem>
                  <SelectItem value="20">d20</SelectItem>
                  <SelectItem value="100">d100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bônus</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setBonus(bonus - 1)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <Input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(parseInt(e.target.value) || 0)}
                  className="text-center h-9"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setBonus(bonus + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Label personalizado */}
          <div className="space-y-2">
            <Label htmlFor="macro-label">Label (opcional)</Label>
            <Input
              id="macro-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Ataque com Espada Longa"
              maxLength={50}
            />
          </div>

          {/* Ícone e Cor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-1">
                {MACRO_ICONS.map(({ id, icon: Icon }) => (
                  <Button
                    key={id}
                    variant={selectedIcon === id ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedIcon(id)}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-1">
                {MACRO_COLORS.map(({ id, color }) => (
                  <button
                    key={id}
                    className={cn(
                      'w-8 h-8 rounded-lg border-2 transition-all',
                      color,
                      selectedColor === id ? 'border-foreground scale-110' : 'border-transparent'
                    )}
                    onClick={() => setSelectedColor(id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mostrar na barra */}
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div>
              <Label htmlFor="show-in-bar">Mostrar na Barra Rápida</Label>
              <p className="text-xs text-muted-foreground">
                Acesso rápido durante o jogo
              </p>
            </div>
            <Switch
              id="show-in-bar"
              checked={showInBar}
              onCheckedChange={setShowInBar}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="macro-description">Descrição (opcional)</Label>
            <Textarea
              id="macro-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas sobre quando usar esta macro..."
              className="h-20 resize-none"
              maxLength={200}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full sm:w-auto"
            >
              <X className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          )}
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 sm:flex-none gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
