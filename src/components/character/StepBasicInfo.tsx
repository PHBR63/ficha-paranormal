import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CharacterFormData } from '@/pages/CharacterCreate';

interface StepBasicInfoProps {
  formData: CharacterFormData;
  updateFormData: (updates: Partial<CharacterFormData>) => void;
}

export function StepBasicInfo({ formData, updateFormData }: StepBasicInfoProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl tracking-wider mb-2">IDENTIFICAÇÃO DO AGENTE</h2>
        <p className="text-muted-foreground text-sm">
          Preencha as informações básicas do seu personagem.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-muted-foreground">
            NOME DO PERSONAGEM *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Nome do agente"
            className="bg-muted/50 border-border focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">
            O nome pelo qual seu personagem é conhecido.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="playerName" className="text-muted-foreground">
            NOME DO JOGADOR
          </Label>
          <Input
            id="playerName"
            value={formData.playerName}
            onChange={(e) => updateFormData({ playerName: e.target.value })}
            placeholder="Seu nome"
            className="bg-muted/50 border-border focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">
            Opcional. Seu nome real para identificação.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="background" className="text-muted-foreground">
          HISTÓRICO / ANOTAÇÕES
        </Label>
        <Textarea
          id="background"
          value={formData.background}
          onChange={(e) => updateFormData({ background: e.target.value })}
          placeholder="Conte a história do seu personagem, suas motivações, medos..."
          className="bg-muted/50 border-border focus:border-primary min-h-[120px] font-ritual"
        />
        <p className="text-xs text-muted-foreground">
          Opcional. Adicione detalhes sobre o passado e personalidade do seu agente.
        </p>
      </div>

      <div className="ordo-panel p-4 bg-primary/5 border-primary/20">
        <p className="text-sm text-muted-foreground">
          <span className="text-primary font-medium">DICA:</span> Um bom histórico ajuda a dar vida ao seu personagem 
          e pode fornecer ganchos para o mestre criar missões personalizadas.
        </p>
      </div>
    </div>
  );
}
