/**
 * MapImageUploader - Componente de upload de imagem para mapas táticos
 * 
 * Permite:
 * - Upload direto de arquivos (arrastar ou clicar)
 * - URL externa (validada contra domínios permitidos)
 * 
 * SEGURANÇA: URLs externas são validadas via urlValidator
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, Link, Loader2, X, Image, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { validateImageUrl, getAllowedDomainsList } from '@/lib/security/urlValidator';
import { toast } from 'sonner';

// Constantes de validação de arquivo
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB para mapas (maiores que avatares)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Dados retornados ao selecionar uma imagem */
export interface MapImageData {
  file?: File;
  url?: string;
  previewUrl: string;
  /** Largura natural da imagem em pixels */
  imageWidth?: number;
  /** Altura natural da imagem em pixels */
  imageHeight?: number;
}

interface MapImageUploaderProps {
  /** Callback quando imagem é selecionada */
  onImageSelect: (data: MapImageData) => void;
  /** Se está em estado de loading */
  isLoading?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

export function MapImageUploader({ 
  onImageSelect, 
  isLoading = false,
  className 
}: MapImageUploaderProps) {
  // Estados
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Valida arquivo selecionado
   */
  const validateFile = useCallback((file: File): boolean => {
    // Verifica tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG, WebP ou GIF.');
      return false;
    }

    // Verifica tamanho
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return false;
    }

    return true;
  }, []);

  /**
   * Processa arquivo selecionado
   */
  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) return;

    // Cria preview local e extrai dimensões naturais da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        setPreviewUrl(dataUrl);
        setSelectedFile(file);
        onImageSelect({
          file,
          previewUrl: dataUrl,
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight,
        });
      };
      img.onerror = () => {
        setPreviewUrl(dataUrl);
        setSelectedFile(file);
        onImageSelect({ file, previewUrl: dataUrl });
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      toast.error('Erro ao ler arquivo');
    };
    reader.readAsDataURL(file);
  }, [validateFile, onImageSelect]);

  /**
   * Handler de input de arquivo
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handlers de drag & drop
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Valida e aplica URL externa
   */
  const handleUrlSubmit = useCallback(async () => {
    if (!urlInput.trim()) {
      setUrlError('Digite uma URL');
      return;
    }

    setIsValidatingUrl(true);
    setUrlError(null);

    // Valida URL contra lista de domínios permitidos
    const validation = validateImageUrl(urlInput);
    
    if (!validation.isValid) {
      setUrlError(validation.error || 'URL inválida');
      setIsValidatingUrl(false);
      return;
    }

    // Tenta carregar a imagem para verificar se é acessível
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    
    const timeoutId = setTimeout(() => {
      setUrlError('Tempo esgotado ao carregar imagem');
      setIsValidatingUrl(false);
    }, 10000);

    img.onload = () => {
      clearTimeout(timeoutId);
      const normalizedUrl = validation.normalizedUrl || urlInput;
      setPreviewUrl(normalizedUrl);
      setSelectedFile(null);
      onImageSelect({
        url: normalizedUrl,
        previewUrl: normalizedUrl,
        imageWidth: img.naturalWidth,
        imageHeight: img.naturalHeight,
      });
      setIsValidatingUrl(false);
      toast.success('Imagem carregada com sucesso');
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      setUrlError('Não foi possível carregar a imagem. Verifique a URL.');
      setIsValidatingUrl(false);
    };

    img.src = validation.normalizedUrl || urlInput;
  }, [urlInput, onImageSelect]);

  /**
   * Limpa seleção atual
   */
  const handleClear = useCallback(() => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setUrlInput('');
    setUrlError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  // Formata tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <Link className="w-4 h-4" />
            URL Externa
          </TabsTrigger>
        </TabsList>

        {/* Tab de Upload */}
        <TabsContent value="upload" className="mt-4">
          {previewUrl && selectedFile ? (
            // Preview do arquivo selecionado
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img 
                src={previewUrl} 
                alt="Preview do mapa" 
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                  <span className="text-muted-foreground">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClear}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            // Área de drop
            <div
              className={cn(
                'relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer',
                'hover:border-primary/50 hover:bg-primary/5',
                isDragging && 'border-primary bg-primary/10',
                'border-border'
              )}
              onClick={() => inputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange}
                disabled={isLoading}
              />

              <div className="flex flex-col items-center justify-center text-center">
                {isLoading ? (
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                ) : (
                  <Image className="w-10 h-10 text-muted-foreground mb-3" />
                )}
                <p className="font-medium mb-1">
                  {isDragging ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
                </p>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG, WebP ou GIF • Máximo 10MB
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab de URL */}
        <TabsContent value="url" className="mt-4 space-y-4">
          {previewUrl && !selectedFile ? (
            // Preview da URL
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img 
                src={previewUrl} 
                alt="Preview do mapa" 
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <Check className="w-4 h-4" />
                  <span>Imagem carregada</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClear}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Input de URL */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setUrlError(null);
                    }}
                    placeholder="https://exemplo.com/mapa.jpg"
                    disabled={isValidatingUrl || isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUrlSubmit();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleUrlSubmit} 
                    disabled={isValidatingUrl || isLoading || !urlInput.trim()}
                  >
                    {isValidatingUrl ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Carregar'
                    )}
                  </Button>
                </div>
                
                {/* Erro de URL */}
                {urlError && (
                  <div className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{urlError}</span>
                  </div>
                )}
              </div>

              {/* Domínios permitidos */}
              <div className="rounded-lg bg-muted/30 p-3 text-xs">
                <p className="text-muted-foreground mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Domínios permitidos por segurança:
                </p>
                <div className="flex flex-wrap gap-1">
                  {getAllowedDomainsList().slice(0, 8).map(domain => (
                    <span 
                      key={domain} 
                      className="bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                    >
                      {domain}
                    </span>
                  ))}
                  {getAllowedDomainsList().length > 8 && (
                    <span className="text-muted-foreground">
                      +{getAllowedDomainsList().length - 8} mais
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
