// Step 1: Informações básicas da campanha
// Nome, descrição e imagem de capa

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Sparkles, Upload, Loader2 } from '@/components/icons/ordem-icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CampaignFormData } from '@/pages/CampaignCreate';

interface StepCampaignInfoProps {
  formData: CampaignFormData;
  updateFormData: (updates: Partial<CampaignFormData>) => void;
}

// Imagens de capa pré-definidas (URLs de exemplo)
const COVER_PRESETS = [
  { id: 'city', url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80', label: 'Cidade' },
  { id: 'forest', url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&q=80', label: 'Floresta' },
  { id: 'mansion', url: 'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800&q=80', label: 'Mansão' },
  { id: 'ruins', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80', label: 'Ruínas' },
];

export function StepCampaignInfo({ formData, updateFormData }: StepCampaignInfoProps) {
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Upload de imagem para o storage
  const handleFileUpload = async (file: File) => {
    // Validação de tipo e tamanho
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use JPG, PNG, WebP ou GIF.', variant: 'destructive' });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'O tamanho máximo é 100MB.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filePath = `campaign-covers/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-assets')
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-assets')
        .getPublicUrl(filePath);

      updateFormData({ coverImageUrl: publicUrl });
      setShowCoverPicker(false);
      toast({ title: 'Imagem enviada!', description: 'A capa foi carregada com sucesso.' });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Suporte a drag & drop no placeholder
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Seleciona uma capa pré-definida
  const selectPresetCover = (url: string) => {
    updateFormData({ coverImageUrl: url });
    setShowCoverPicker(false);
  };
  
  // Remove a capa
  const removeCover = () => {
    updateFormData({ coverImageUrl: '' });
  };
  
  // Aplica URL customizada
  const applyCustomUrl = () => {
    if (customUrl.trim()) {
      updateFormData({ coverImageUrl: customUrl.trim() });
      setCustomUrl('');
      setShowCoverPicker(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Título do step */}
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl tracking-wider mb-2">INFORMAÇÕES DA CAMPANHA</h2>
        <p className="text-muted-foreground">
          Dê um nome marcante e descreva a premissa da sua história.
        </p>
      </div>
      
      {/* Imagem de capa */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Imagem de Capa (opcional)</Label>
        
        {formData.coverImageUrl ? (
          <div className="relative aspect-video rounded-lg overflow-hidden border border-border">
            <img 
              src={formData.coverImageUrl} 
              alt="Capa da campanha"
              className="w-full h-full object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removeCover}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="aspect-video rounded-lg border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            onClick={() => setShowCoverPicker(true)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 text-primary mb-3 animate-spin" />
                <p className="text-sm text-muted-foreground">Enviando imagem...</p>
              </>
            ) : (
              <>
                <ImagePlus className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Clique para escolher ou arraste uma imagem</p>
              </>
            )}
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onFileInputChange}
        />

        {/* Picker de capas */}
        {showCoverPicker && (
          <div className="ordo-panel p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Escolha uma capa</span>
              <Button variant="ghost" size="sm" onClick={() => setShowCoverPicker(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Botão de upload */}
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Fazer upload de imagem (max 100MB)</>
              )}
            </Button>
            
            {/* Presets */}
            <div className="grid grid-cols-2 gap-3">
              {COVER_PRESETS.map(preset => (
                <div
                  key={preset.id}
                  className="aspect-video rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-colors"
                  onClick={() => selectPresetCover(preset.url)}
                >
                  <img 
                    src={preset.url} 
                    alt={preset.label}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            
            {/* URL customizada */}
            <div className="flex gap-2">
              <Input
                placeholder="Ou cole uma URL de imagem..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1"
              />
              <Button variant="secondary" onClick={applyCustomUrl} disabled={!customUrl.trim()}>
                Aplicar
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Nome da campanha */}
      <div className="space-y-2">
        <Label htmlFor="campaign-name" className="text-sm font-medium">
          Nome da Campanha <span className="text-destructive">*</span>
        </Label>
        <Input
          id="campaign-name"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          placeholder="Ex: O Mistério de Silent Hill"
          className="font-display text-lg tracking-wide"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          Mínimo de 3 caracteres. Seja criativo!
        </p>
      </div>
      
      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="campaign-description" className="text-sm font-medium">
          Descrição (opcional)
        </Label>
        <Textarea
          id="campaign-description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Uma breve sinopse da campanha... O que os jogadores podem esperar?"
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.description.length}/500
        </p>
      </div>
      
      {/* Dica */}
      <div className="ordo-panel p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary">Dica de Mestre</p>
            <p className="text-sm text-muted-foreground">
              Uma boa descrição ajuda os jogadores a entenderem o tom da campanha. 
              Mencione o estilo (horror, investigação, ação) e o cenário principal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
