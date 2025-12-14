import { Dices, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">CONCEITO DO AGENTE</h2>
        <p className="text-muted-foreground text-sm">
          Comece definindo quem é seu personagem. O nome e o conceito guiarão suas escolhas.
        </p>
      </div>

      {/* Nome e Jogador */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nome do Personagem <span className="text-destructive">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Ex: João Silva"
            className="bg-background"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Nome do Jogador</label>
          <Input
            value={formData.playerName}
            onChange={(e) => updateFormData({ playerName: e.target.value })}
            placeholder="Seu nome"
            className="bg-background"
          />
        </div>
      </div>

      {/* Conceito */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Conceito <span className="text-muted-foreground text-xs">(uma frase que define seu personagem)</span>
        </label>
        <Input
          value={formData.concept || ''}
          onChange={(e) => updateFormData({ concept: e.target.value })}
          placeholder='Ex: "Ex-policial assombrado pelo caso que não conseguiu resolver"'
          className="bg-background"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Este conceito serve como âncora para suas escolhas de origem e classe.
        </p>
      </div>

      {/* Idade e Gênero */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Idade</label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={15}
              max={99}
              value={formData.age || ''}
              onChange={(e) => updateFormData({ age: parseInt(e.target.value) || null })}
              placeholder="17-27"
              className="bg-background"
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
          <label className="block text-sm font-medium mb-2">Gênero</label>
          <Input
            value={formData.gender || ''}
            onChange={(e) => updateFormData({ gender: e.target.value })}
            placeholder="Ex: Masculino, Feminino, Não-binário..."
            className="bg-background"
          />
        </div>
      </div>

      {/* Aparência e Personalidade */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Aparência</label>
          <Textarea
            value={formData.appearance || ''}
            onChange={(e) => updateFormData({ appearance: e.target.value })}
            placeholder="Descreva a aparência física do seu personagem..."
            className="bg-background h-24 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Personalidade</label>
          <Textarea
            value={formData.personality || ''}
            onChange={(e) => updateFormData({ personality: e.target.value })}
            placeholder="Descreva os traços de personalidade..."
            className="bg-background h-24 resize-none"
          />
        </div>
      </div>

      {/* Preview */}
      {formData.name && (
        <div className="ordo-panel p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-sm bg-muted flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
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
