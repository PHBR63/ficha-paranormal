import { useState, useCallback } from 'react';
import { Dices, User, Sparkles, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ui/image-uploader';
import { rollAge } from '@/lib/character-builder-engine';
import { motion } from 'framer-motion';
import type { CharacterFormData } from '@/pages/CharacterCreate';
import { RuleBookTip } from './RuleBookTip';
import { getRulebookContent } from '@/lib/rulebook-content';
import { conceptFieldsSchema, type ConceptFields } from '@/lib/validation-schemas';

type FieldErrors = Partial<Record<keyof ConceptFields, string>>;

interface StepConceptProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

const CONCEPT_SUGGESTIONS = [
  'Ex-policial assombrado pelo caso que não conseguiu resolver',
  'Médica que testemunhou algo que a ciência não explica',
  'Jornalista investigativo que foi longe demais',
  'Veterano de guerra com memórias perturbadoras',
  'Padre que perdeu a fé após um exorcismo fracassado',
  'Hacker que descobriu segredos que não deveria',
];

export function StepConcept({ formData, updateFormData }: StepConceptProps) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Valida um campo específico e retorna o valor sanitizado
  const validateAndUpdate = useCallback((
    field: keyof ConceptFields,
    value: string
  ) => {
    // Valida apenas o campo específico
    const fieldSchema = conceptFieldsSchema.shape[field];
    const result = fieldSchema.safeParse(value);
    
    if (!result.success) {
      const errorMessage = result.error.errors[0]?.message || 'Campo inválido';
      setFieldErrors(prev => ({ ...prev, [field]: errorMessage }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Atualiza o formData mesmo com erro (para permitir correção)
    updateFormData({ [field]: value });
  }, [updateFormData]);

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

  const handleSuggestionClick = () => {
    const randomSuggestion = CONCEPT_SUGGESTIONS[Math.floor(Math.random() * CONCEPT_SUGGESTIONS.length)];
    validateAndUpdate('concept', randomSuggestion);
  };

  // Componente de erro inline
  const FieldError = ({ field }: { field: keyof FieldErrors }) => {
    const error = fieldErrors[field];
    if (!error) return null;
    return (
      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    );
  };

  // Conteúdo educativo do livro
  const rulebookContent = getRulebookContent('concept');

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2 text-foreground">CONCEITO DO AGENTE</h2>
        <p className="text-muted-foreground text-sm">
          Comece definindo quem é seu personagem. O nome e o conceito guiarão suas escolhas.
        </p>
      </div>

      {/* Painel educativo do livro de regras */}
      {rulebookContent && (
        <RuleBookTip section={rulebookContent} defaultExpanded={false} />
      )}

      {/* Photo and Name row */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Photo Upload */}
        <motion.div 
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-foreground">Foto</label>
          <ImageUploader
            value={formData.photoUrl}
            onChange={handlePhotoChange}
            size="lg"
            shape="square"
            placeholder="Adicionar foto"
          />
        </motion.div>

        {/* Name fields */}
        <motion.div 
          className="flex-1 space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Nome do Personagem <span className="text-destructive">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => validateAndUpdate('name', e.target.value)}
                placeholder="Ex: João Silva"
                className={`bg-card border-border ${fieldErrors.name ? 'border-destructive' : ''}`}
                maxLength={100}
              />
              <FieldError field="name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Nome do Jogador</label>
              <Input
                value={formData.playerName}
                onChange={(e) => validateAndUpdate('playerName', e.target.value)}
                placeholder="Seu nome"
                className={`bg-card border-border ${fieldErrors.playerName ? 'border-destructive' : ''}`}
                maxLength={100}
              />
              <FieldError field="playerName" />
            </div>
          </div>

          {/* Conceito */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                Conceito <span className="text-muted-foreground text-xs">(uma frase que define seu personagem)</span>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSuggestionClick}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Sugestão
              </Button>
            </div>
            <Input
              value={formData.concept || ''}
              onChange={(e) => validateAndUpdate('concept', e.target.value)}
              placeholder='Ex: "Ex-policial assombrado pelo caso que não conseguiu resolver"'
              className={`bg-card border-border ${fieldErrors.concept ? 'border-destructive' : ''}`}
              maxLength={200}
            />
            <FieldError field="concept" />
          </div>
        </motion.div>
      </div>

      {/* Idade e Gênero */}
      <motion.div 
        className="grid md:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
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
            onChange={(e) => validateAndUpdate('gender', e.target.value)}
            placeholder="Ex: Masculino, Feminino, Não-binário..."
            className={`bg-card border-border ${fieldErrors.gender ? 'border-destructive' : ''}`}
            maxLength={50}
          />
          <FieldError field="gender" />
        </div>
      </motion.div>

      {/* Aparência e Personalidade */}
      <motion.div 
        className="grid md:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Aparência <span className="text-muted-foreground text-xs">({(formData.appearance || '').length}/500)</span>
          </label>
          <Textarea
            value={formData.appearance || ''}
            onChange={(e) => validateAndUpdate('appearance', e.target.value)}
            placeholder="Descreva a aparência física do seu personagem..."
            className={`bg-card border-border h-24 resize-none ${fieldErrors.appearance ? 'border-destructive' : ''}`}
            maxLength={500}
          />
          <FieldError field="appearance" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Personalidade <span className="text-muted-foreground text-xs">({(formData.personality || '').length}/500)</span>
          </label>
          <Textarea
            value={formData.personality || ''}
            onChange={(e) => validateAndUpdate('personality', e.target.value)}
            placeholder="Descreva os traços de personalidade..."
            className={`bg-card border-border h-24 resize-none ${fieldErrors.personality ? 'border-destructive' : ''}`}
            maxLength={500}
          />
          <FieldError field="personality" />
        </div>
      </motion.div>

      {/* Background / Histórico */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <label className="block text-sm font-medium mb-2 text-foreground">
          Histórico <span className="text-muted-foreground text-xs">(opcional - {(formData.background || '').length}/2000)</span>
        </label>
        <Textarea
          value={formData.background || ''}
          onChange={(e) => validateAndUpdate('background', e.target.value)}
          placeholder="Conte a história do seu personagem... Como ele descobriu o paranormal? O que o motivou a se juntar à Ordo Realitas?"
          className={`bg-card border-border h-32 resize-none ${fieldErrors.background ? 'border-destructive' : ''}`}
          maxLength={2000}
        />
        <FieldError field="background" />
      </motion.div>

      {/* Preview */}
      {formData.name && (
        <motion.div 
          className="ordo-panel p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
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
        </motion.div>
      )}
    </div>
  );
}
