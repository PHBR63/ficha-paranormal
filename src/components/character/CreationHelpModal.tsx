/**
 * CreationHelpModal - Modal de ajuda rápida durante criação
 * 
 * Exibe glossário de termos e fórmulas rápidas do sistema.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, BookOpen, Calculator, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GLOSSARY, QUICK_FORMULAS } from '@/lib/rulebook-content';
import { cn } from '@/lib/utils';

interface CreationHelpModalProps {
  /** Botão customizado para abrir o modal */
  trigger?: React.ReactNode;
}

export function CreationHelpModal({ trigger }: CreationHelpModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  // Filtrar glossário por busca
  const filteredGlossary = Object.entries(GLOSSARY).filter(([term, definition]) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return term.toLowerCase().includes(query) || definition.toLowerCase().includes(query);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-paranormal/20 hover:bg-paranormal/30 border border-paranormal/50 shadow-lg shadow-paranormal/20"
            title="Ajuda"
          >
            <HelpCircle className="w-6 h-6 text-paranormal" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display tracking-wider">
            <BookOpen className="w-5 h-5 text-primary" />
            REFERÊNCIA RÁPIDA
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="glossary" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="glossary" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Glossário
            </TabsTrigger>
            <TabsTrigger value="formulas" className="gap-2">
              <Calculator className="w-4 h-4" />
              Fórmulas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Glossário */}
          <TabsContent value="glossary" className="mt-4">
            <div className="space-y-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar termo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Lista de termos */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {filteredGlossary.map(([term, definition], index) => (
                    <motion.div
                      key={term}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <h4 className="font-display text-sm tracking-wider text-primary mb-1">
                        {term}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {definition}
                      </p>
                    </motion.div>
                  ))}

                  {filteredGlossary.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhum termo encontrado para "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Tab: Fórmulas */}
          <TabsContent value="formulas" className="mt-4">
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-2">
                {QUICK_FORMULAS.map((formula, index) => (
                  <motion.div
                    key={formula.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {formula.name}
                    </span>
                    <code className="text-sm px-2 py-1 rounded bg-primary/10 text-primary font-mono">
                      {formula.formula}
                    </code>
                  </motion.div>
                ))}
              </div>

              {/* Regras importantes */}
              <div className="mt-6 p-4 rounded-lg bg-paranormal/10 border border-paranormal/30">
                <h4 className="font-display text-sm tracking-wider text-paranormal mb-3">
                  REGRAS IMPORTANTES
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-paranormal">•</span>
                    <span><strong className="text-foreground">Atributo 0:</strong> Rola 2d20 e pega o menor resultado (desvantagem)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-paranormal">•</span>
                    <span><strong className="text-foreground">Treinamento:</strong> +5 no teste da perícia</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-paranormal">•</span>
                    <span><strong className="text-foreground">Teste crítico:</strong> 20 natural = sucesso automático</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-paranormal">•</span>
                    <span><strong className="text-foreground">Falha crítica:</strong> 1 natural = falha automática</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-paranormal">•</span>
                    <span><strong className="text-foreground">PE a 0:</strong> Você fica fatigado (-2 em testes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-paranormal">•</span>
                    <span><strong className="text-foreground">SAN a 0:</strong> Seu personagem surta temporariamente</span>
                  </li>
                </ul>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Botão flutuante de ajuda para usar durante a criação
 */
export function CreationHelpButton() {
  return <CreationHelpModal />;
}

export default CreationHelpModal;
