import { useState } from 'react';
import { Dices, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ui/image-uploader';
import { rollAge } from '@/lib/character-builder-engine';
import type { CharacterFormData } from '@/pages/CharacterCreate';

interface StepConceptProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

export function StepConcept({ formData, updateFormData }: StepConceptProps) {
  const handleRollAge = () => {
    const { result } = rollAge();
    updateFormData({ age: result });
  };

  const handlePhotoChange = (url: string | null, file?: File) => {
    updateFormData({ 
      photoUrl: url,
      photoFile: file || null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2 text-foreground">CONCEITO DO AGENTE</h2>
        <p className="text-muted-foreground text-sm">
          Comece definindo quem é seu personagem. O nome e o conceito guiarão suas escolhas.
        </p>
      </div>

      {/* Photo and Name row */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Photo Upload */}
        <div className="flex flex-col items-center gap-2">
          <label className="block text-sm font-medium text-foreground">Foto</label>
          <ImageUploader
            value={formData.photoUrl}
            onChange={handlePhotoChange}
            size="lg"
            shape="square"
            placeholder="Adicionar foto"
          />
        </div>

        {/* Name fields */}
        <div className="flex-1 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Nome do Personagem <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="Ex: João Silva"
                className="bg-card border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Nome do Jogador</label>
              <Input
                value={formData.playerName}
                onChange={(e) => updateFormData({ playerName: e.target.value })}
                placeholder="Seu nome"
                className="bg-card border-border"
              />
            </div>
          </div>

          {/* Conceito */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Conceito <span className="text-muted-foreground text-xs">(uma frase que define seu personagem)</span>
            </label>
            <Input
              value={formData.concept || ''}
              onChange={(e) => updateFormData({ concept: e.target.value })}
              placeholder='Ex: "Ex-policial assombrado pelo caso que não conseguiu resolver"'
              className="bg-card border-border"
            />
          </div>
        </div>
      </div>

      {/* Idade e Gênero */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Idade</label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={15}
              max={99}
              value={formData.age || ''}
              onChange={(e) => updateFormData({ age: parseInt(e.target.value) || null })}
              placeholder="17-27"
              className="bg-card border-border"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleRollAge}
              className="shrink-0"
              title="Rolar idade (2d6+15)"
            >
              <Dices className="w-4 h-4 mr-2" />
              2d6+15
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            A idade padrão é 2d6+15 (17-27 anos).
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Gênero</label>
          <Input
            value={formData.gender || ''}
            onChange={(e) => updateFormData({ gender: e.target.value })}
            placeholder="Ex: Masculino, Feminino, Não-binário..."
            className="bg-card border-border"
          />
        </div>
      </div>

      {/* Aparência e Personalidade */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Aparência</label>
          <Textarea
            value={formData.appearance || ''}
            onChange={(e) => updateFormData({ appearance: e.target.value })}
            placeholder="Descreva a aparência física do seu personagem..."
            className="bg-card border-border h-24 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Personalidade</label>
          <Textarea
            value={formData.personality || ''}
            onChange={(e) => updateFormData({ personality: e.target.value })}
            placeholder="Descreva os traços de personalidade..."
            className="bg-card border-border h-24 resize-none"
          />
        </div>
      </div>

      {/* Preview */}
      {formData.name && (
        <div className="ordo-panel p-4">
          <div className="flex items-center gap-4">
            {formData.photoUrl ? (
              <img 
                src={formData.photoUrl} 
                alt="Preview" 
                className="w-16 h-16 rounded-lg object-cover border border-primary/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="font-display text-lg tracking-wider text-primary">{formData.name}</p>
              {formData.concept && (
                <p className="text-sm text-muted-foreground italic">"{formData.concept}"</p>
              )}
              <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                {formData.age && <span>{formData.age} anos</span>}
                {formData.age && formData.gender && <span>•</span>}
                {formData.gender && <span>{formData.gender}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
