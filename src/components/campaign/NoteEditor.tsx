/**
 * NoteEditor - Editor de nota com auto-save
 * Suporta título, conteúdo e toggle de compartilhamento
 */
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Save,
  Loader2,
  Lock,
  Users,
  Check,
} from '@/components/icons/ordem-icons';

interface CampaignNote {
  id: string;
  campaign_id: string;
  user_id: string;
  session_id: string | null;
  title: string | null;
  content: string;
  note_type: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

interface NoteEditorProps {
  note: CampaignNote;
  isOwner: boolean;
  onUpdate: (noteId: string, updates: Partial<CampaignNote>) => Promise<void>;
}

export function NoteEditor({ note, isOwner, onUpdate }: NoteEditorProps) {
  const { toast } = useToast();
  
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content);
  const [isPrivate, setIsPrivate] = useState(note.is_private);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Atualiza estado quando nota muda
  useEffect(() => {
    setTitle(note.title || '');
    setContent(note.content);
    setIsPrivate(note.is_private);
    setHasChanges(false);
  }, [note.id]);

  // Marca que há mudanças
  useEffect(() => {
    const titleChanged = title !== (note.title || '');
    const contentChanged = content !== note.content;
    const privacyChanged = isPrivate !== note.is_private;
    setHasChanges(titleChanged || contentChanged || privacyChanged);
  }, [title, content, isPrivate, note]);

  // Auto-save com debounce
  useEffect(() => {
    if (!hasChanges || !isOwner) return;

    const timeout = setTimeout(() => {
      saveNote();
    }, 3000); // 3 segundos de debounce

    return () => clearTimeout(timeout);
  }, [title, content, isPrivate, hasChanges]);

  // Salva a nota
  const saveNote = useCallback(async () => {
    if (!isOwner || saving) return;

    setSaving(true);
    try {
      await onUpdate(note.id, {
        title: title || null,
        content,
        is_private: isPrivate,
      });
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (error) {
      // Erro já tratado em onUpdate
    } finally {
      setSaving(false);
    }
  }, [note.id, title, content, isPrivate, isOwner, saving, onUpdate]);

  // Salvar manualmente
  const handleManualSave = async () => {
    await saveNote();
    toast({ title: 'Nota salva!' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header do editor */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          {isPrivate ? (
            <Lock className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Users className="w-4 h-4 text-primary" />
          )}
          <span className="text-sm text-muted-foreground">
            {isPrivate ? 'Nota privada' : 'Compartilhada com a mesa'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Status de salvamento */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {saving && (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Salvando...</span>
              </>
            )}
            {!saving && lastSaved && !hasChanges && (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span>Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            )}
            {!saving && hasChanges && (
              <span className="text-yellow-500">Alterações não salvas</span>
            )}
          </div>

          {/* Botão de salvar */}
          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSave}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Campo de título - id/name adicionados para acessibilidade */}
      <Input
        id="note-title"
        name="note-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título da nota"
        disabled={!isOwner}
        aria-label="Título da nota"
        className="text-lg font-display mb-4 border-0 border-b border-border rounded-none px-0 focus-visible:ring-0"
      />

      {/* Conteúdo - id/name adicionados para acessibilidade */}
      <Textarea
        id="note-content"
        name="note-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escreva suas anotações aqui..."
        disabled={!isOwner}
        aria-label="Conteúdo da nota"
        className="flex-1 min-h-[300px] resize-none"
      />

      {/* Toggle de privacidade */}
      {isOwner && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Switch
              id="privacy"
              checked={!isPrivate}
              onCheckedChange={(checked) => setIsPrivate(!checked)}
            />
            <Label htmlFor="privacy" className="text-sm">
              Compartilhar com a mesa
            </Label>
          </div>

          <p className="text-xs text-muted-foreground">
            {isPrivate 
              ? 'Apenas você pode ver esta nota' 
              : 'Todos os membros da campanha podem ver'
            }
          </p>
        </div>
      )}
    </div>
  );
}
