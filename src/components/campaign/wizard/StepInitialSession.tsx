// Step 3: Primeira sessão
// Agendamento opcional da primeira sessão de jogo

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Timer, Info } from '@/components/icons/ordem-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CampaignFormData } from '@/pages/CampaignCreate';

interface StepInitialSessionProps {
  formData: CampaignFormData;
  updateFormData: (updates: Partial<CampaignFormData>) => void;
}

// Durações comuns de sessão
const DURATION_PRESETS = [
  { hours: 2, label: '2 horas' },
  { hours: 3, label: '3 horas' },
  { hours: 4, label: '4 horas' },
  { hours: 5, label: '5 horas' },
  { hours: 6, label: '6 horas' },
];

export function StepInitialSession({ formData, updateFormData }: StepInitialSessionProps) {
  // Limpa a data selecionada
  const clearDate = () => {
    updateFormData({ firstSessionDate: null });
  };

  return (
    <div className="space-y-8">
      {/* Título do step */}
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl tracking-wider mb-2">PRIMEIRA SESSÃO</h2>
        <p className="text-muted-foreground">
          Agende a primeira sessão de jogo. Este passo é opcional.
        </p>
      </div>
      
      {/* Aviso opcional */}
      <div className="ordo-panel p-4 bg-muted/20 border-muted">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">
              Você pode pular este passo e agendar sessões depois. 
              Basta deixar a data em branco.
            </p>
          </div>
        </div>
      </div>
      
      {/* Seletor de data */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Data da Primeira Sessão</Label>
        
        <div className="flex gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'flex-1 justify-start text-left font-normal',
                  !formData.firstSessionDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.firstSessionDate ? (
                  format(formData.firstSessionDate, "PPP", { locale: ptBR })
                ) : (
                  'Selecione uma data'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.firstSessionDate || undefined}
                onSelect={(date) => updateFormData({ firstSessionDate: date || null })}
                disabled={(date) => date < new Date()}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          
          {formData.firstSessionDate && (
            <Button variant="ghost" onClick={clearDate}>
              Limpar
            </Button>
          )}
        </div>
      </div>
      
      {/* Horário e duração - só aparecem se tiver data */}
      {formData.firstSessionDate && (
        <>
          {/* Horário */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Horário de Início</Label>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <Input
                type="time"
                value={formData.firstSessionTime}
                onChange={(e) => updateFormData({ firstSessionTime: e.target.value })}
                className="w-32"
              />
            </div>
          </div>
          
          {/* Duração */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Duração Estimada</Label>
            <div className="flex items-center gap-3 flex-wrap">
              <Timer className="w-5 h-5 text-muted-foreground" />
              {DURATION_PRESETS.map(preset => (
                <Button
                  key={preset.hours}
                  variant={formData.sessionDuration === preset.hours ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFormData({ sessionDuration: preset.hours })}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Resumo */}
          <div className="ordo-panel p-4 bg-primary/5 border-primary/20">
            <p className="text-sm font-medium text-primary mb-2">Sessão 1 Agendada</p>
            <p className="text-sm text-muted-foreground">
              {format(formData.firstSessionDate, "EEEE, d 'de' MMMM", { locale: ptBR })} às {formData.firstSessionTime}
              <br />
              Duração estimada: {formData.sessionDuration} horas
            </p>
          </div>
        </>
      )}
      
      {/* Se não tiver data, mostra placeholder */}
      {!formData.firstSessionDate && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Nenhuma sessão agendada.<br />
            Você pode agendar depois na página da campanha.
          </p>
        </div>
      )}
    </div>
  );
}
