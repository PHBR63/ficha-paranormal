import { useState, useRef } from 'react';
import { Camera, X, Loader2, Upload, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null, file?: File) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'square';
  placeholder?: string;
}

const sizeClasses = {
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-40 h-40',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/webm'];

export function ImageUploader({
  value,
  onChange,
  className,
  size = 'md',
  shape = 'circle',
  placeholder = 'Adicionar foto',
}: ImageUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Use apenas imagens JPG, PNG, WebP ou GIF.',
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5MB.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreviewUrl(url);
      onChange(url, file);
      setIsLoading(false);
      toast({
        title: 'Foto adicionada',
        description: 'A imagem foi carregada com sucesso.',
      });
    };
    reader.onerror = () => {
      setIsLoading(false);
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível ler o arquivo.',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div
      className={cn(
        'relative group cursor-pointer transition-all duration-200',
        sizeClasses[size],
        shape === 'circle' ? 'rounded-full' : 'rounded-lg',
        'border-2 border-dashed border-border hover:border-primary/50',
        isDragging && 'border-primary bg-primary/10',
        previewUrl && 'border-solid border-primary/30',
        className
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/webm"
        className="hidden"
        onChange={handleInputChange}
      />

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-inherit">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt="Preview"
            className={cn(
              'w-full h-full object-cover',
              shape === 'circle' ? 'rounded-full' : 'rounded-lg'
            )}
          />
          <div className={cn(
            'absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center',
            shape === 'circle' ? 'rounded-full' : 'rounded-lg'
          )}>
            <Camera className="w-6 h-6 text-foreground" />
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="w-3 h-3" />
          </Button>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          <Upload className="w-6 h-6 mb-1" />
          <span className="text-xs text-center px-2">{placeholder}</span>
          <span className="text-[10px] opacity-70 mt-1">Max 5MB</span>
        </div>
      )}
    </div>
  );
}
