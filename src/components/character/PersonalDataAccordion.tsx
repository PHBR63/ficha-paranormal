/**
 * PersonalDataAccordion - Dados pessoais do personagem em acordeão colapsável
 */

import { motion } from 'framer-motion';
import { ChevronDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

interface PersonalData {
  name: string;
  playerName?: string | null;
  characterClass: string;
  origin: string;
  age?: number | null;
  gender?: string | null;
  appearance?: string | null;
  personality?: string | null;
}

interface PersonalDataAccordionProps {
  data: PersonalData;
  className?: string;
}

export function PersonalDataAccordion({ 
  data, 
  className 
}: PersonalDataAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Campos para exibir
  const fields = [
    { label: 'Nome', value: data.name },
    { label: 'Jogador', value: data.playerName || '—' },
    { label: 'Classe', value: data.characterClass },
    { label: 'Origem', value: data.origin },
    { label: 'Idade', value: data.age ? `${data.age} anos` : '—' },
    { label: 'Gênero', value: data.gender || '—' },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("sheet-panel", className)}>
        <CollapsibleTrigger asChild>
          <motion.div
            className={cn(
              "flex items-center justify-between p-4 cursor-pointer",
              "hover:bg-primary/5 transition-colors rounded-lg"
            )}
            whileHover={{ scale: 1.005 }}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="font-display text-sm tracking-wider text-primary uppercase">
                Dados Pessoais
              </span>
            </div>
            <ChevronDown 
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </motion.div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 pb-4 pt-2 grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {fields.map((field, index) => (
              <motion.div
                key={field.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {field.label}
                </p>
                <p className="text-sm font-medium truncate">{field.value}</p>
              </motion.div>
            ))}
            
            {/* Aparência (se existir) */}
            {data.appearance && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="col-span-full"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Aparência
                </p>
                <p className="text-sm text-muted-foreground">{data.appearance}</p>
              </motion.div>
            )}
            
            {/* Personalidade (se existir) */}
            {data.personality && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="col-span-full"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Personalidade
                </p>
                <p className="text-sm text-muted-foreground">{data.personality}</p>
              </motion.div>
            )}
          </motion.div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
