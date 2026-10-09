/**
 * MapPinDialog - Modal para criar/editar/visualizar pins no mapa (Fase F)
 * 
 * Suporta:
 * - Criar nota (título + conteúdo)
 * - Vincular handout existente
 * - Editar e deletar
 * - Controle de visibilidade (mestre/todos)
 */

import { memo, useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, MapPin, Eye, EyeOff, FileText, StickyNote } from '@/components/icons/ordem-icons';
import { cn } from '@/lib/utils';
import type { MapPin as MapPinType, CreateMapPinData } from '@/hooks/campaign/useMapPins';

// Ícones disponíveis para pins
const PIN_ICONS = ['📌', '⚠️', '❗', '💀', '🔮', '🗡️', '🛡️', '📍', '🏠', '🌲', '🔥', '💎'];
const PIN_COLORS = ['#fbbf24', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#6b7280'];

interface MapPinDialogProps {
  /** Se o dialog está aberto */
  open: boolean;
  /** Fechar o dialog */
  onClose: () => void;
  /** Pin existente para editar/visualizar (null = criar) */
  pin?: MapPinType | null;
  /** Coordenadas para novo pin */
  createAt?: { x: number; y: number } | null;
  /** Se é mestre */
  isMaster: boolean;
  /** Se é o dono do pin (pode editar) */
  isOwner?: boolean;
  /** Handouts disponíveis para vincular */
  handouts?: Array<{ id: string; title: string }>;
  /** Callbacks */
  onCreatePin?: (data: CreateMapPinData) => Promise<MapPinType | null>;
  onUpdatePin?: (pinId: string, data: Partial<CreateMapPinData>) => Promise<boolean>;
  onDeletePin?: (pinId: string) => Promise<boolean>;
}

export const MapPinDialog = memo(function MapPinDialog({
  open,
  onClose,
  pin,
  createAt,
  isMaster,
  isOwner = false,
  handouts = [],
  onCreatePin,
  onUpdatePin,
  onDeletePin,
}: MapPinDialogProps) {
  const isEditing = !!pin;
  const canEdit = isEditing ? (isOwner || isMaster) : true;

  // Estado do formulário
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState('#fbbf24');
  const [visibility, setVisibility] = useState<'all' | 'master'>('all');
  const [pinType, setPinType] = useState<'note' | 'handout'>('note');
  const [handoutId, setHandoutId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      if (pin) {
        setTitle(pin.title);
        setContent(pin.content || '');
        setIcon(pin.icon);
        setColor(pin.color);
        setVisibility(pin.visibility as 'all' | 'master');
        setPinType(pin.pin_type as 'note' | 'handout');
        setHandoutId(pin.handout_id || '');
      } else {
        setTitle('');
        setContent('');
        setIcon('📌');
        setColor('#fbbf24');
        setVisibility('all');
        setPinType('note');
        setHandoutId('');
      }
    }
  }, [open, pin]);

  // Criar pin
  const handleCreate = useCallback(async () => {
    if (!createAt || !onCreatePin || !title.trim()) return;
    setSaving(true);
    await onCreatePin({
      x: createAt.x,
      y: createAt.y,
      pin_type: pinType,
      title: title.trim(),
      content: pinType === 'note' ? content : undefined,
      handout_id: pinType === 'handout' ? handoutId || undefined : undefined,
      icon,
      color,
      visibility,
    });
    setSaving(false);
    onClose();
  }, [createAt, title, content, icon, color, visibility, pinType, handoutId, onCreatePin, onClose]);

  // Atualizar pin
  const handleUpdate = useCallback(async () => {
    if (!pin || !onUpdatePin || !title.trim()) return;
    setSaving(true);
    await onUpdatePin(pin.id, {
      title: title.trim(),
      content: pinType === 'note' ? content : undefined,
      icon,
      color,
      visibility,
    });
    setSaving(false);
    onClose();
  }, [pin, title, content, icon, color, visibility, pinType, onUpdatePin, onClose]);

  // Deletar pin
  const handleDelete = useCallback(async () => {
    if (!pin || !onDeletePin) return;
    setSaving(true);
    await onDeletePin(pin.id);
    setSaving(false);
    onClose();
  }, [pin, onDeletePin, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-500" />
            {isEditing ? (canEdit ? 'Editar Pin' : 'Visualizar Pin') : 'Criar Pin no Mapa'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing
              ? `Posição: (${pin?.x}, ${pin?.y})`
              : `Posição: (${createAt?.x}, ${createAt?.y})`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Tipo de pin (apenas na criação) */}
          {!isEditing && handouts.length > 0 && (
            <div className="flex gap-1">
              <button
                className={cn(
                  'flex-1 h-8 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
                  pinType === 'note'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
                onClick={() => setPinType('note')}
              >
                <StickyNote className="h-3.5 w-3.5" />
                Nota
              </button>
              <button
                className={cn(
                  'flex-1 h-8 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
                  pinType === 'handout'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
                onClick={() => setPinType('handout')}
              >
                <FileText className="h-3.5 w-3.5" />
                Handout
              </button>
            </div>
          )}

          {/* Título */}
          <div className="space-y-1">
            <Label className="text-xs">Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do pin..."
              className="h-8 text-sm"
              disabled={!canEdit}
              maxLength={60}
            />
          </div>

          {/* Conteúdo (apenas para notas) */}
          {pinType === 'note' && (
            <div className="space-y-1">
              <Label className="text-xs">Conteúdo</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descrição, anotações..."
                className="text-sm min-h-[80px] max-h-[200px]"
                disabled={!canEdit}
                maxLength={500}
              />
            </div>
          )}

          {/* Handout (apenas para tipo handout) */}
          {pinType === 'handout' && !isEditing && handouts.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Handout vinculado</Label>
              <Select value={handoutId} onValueChange={setHandoutId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecionar handout..." />
                </SelectTrigger>
                <SelectContent>
                  {handouts.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Ícone */}
          {canEdit && (
            <div className="space-y-1">
              <Label className="text-xs">Ícone</Label>
              <div className="flex gap-1 flex-wrap">
                {PIN_ICONS.map(i => (
                  <button
                    key={i}
                    className={cn(
                      'w-7 h-7 rounded text-base flex items-center justify-center transition-all',
                      icon === i
                        ? 'bg-primary/20 ring-1 ring-primary scale-110'
                        : 'bg-muted/30 hover:bg-muted/50 hover:scale-105'
                    )}
                    onClick={() => setIcon(i)}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cor */}
          {canEdit && (
            <div className="space-y-1">
              <Label className="text-xs">Cor</Label>
              <div className="flex gap-1.5">
                {PIN_COLORS.map(c => (
                  <button
                    key={c}
                    className={cn(
                      'w-5 h-5 rounded-full border-2 transition-all',
                      color === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Visibilidade (apenas mestre) */}
          {isMaster && canEdit && (
            <div className="space-y-1">
              <Label className="text-xs">Visibilidade</Label>
              <div className="flex gap-1">
                <button
                  className={cn(
                    'flex-1 h-7 rounded text-[10px] font-medium flex items-center justify-center gap-1 transition-colors',
                    visibility === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                  onClick={() => setVisibility('all')}
                >
                  <Eye className="h-3 w-3" />
                  Todos
                </button>
                <button
                  className={cn(
                    'flex-1 h-7 rounded text-[10px] font-medium flex items-center justify-center gap-1 transition-colors',
                    visibility === 'master'
                      ? 'bg-amber-600 text-white'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                  onClick={() => setVisibility('master')}
                >
                  <EyeOff className="h-3 w-3" />
                  Só Mestre
                </button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-1">
          {/* Deletar (editando e com permissão) */}
          {isEditing && canEdit && onDeletePin && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto"
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Deletar
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            {canEdit ? 'Cancelar' : 'Fechar'}
          </Button>

          {canEdit && (
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={isEditing ? handleUpdate : handleCreate}
              disabled={saving || !title.trim()}
            >
              {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Pin'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default MapPinDialog;
