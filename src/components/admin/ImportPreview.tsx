/**
 * Componente de preview para itens a serem importados
 * Mostra validação, erros e warnings de cada item
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, AlertTriangle, FileSearch } from '@/components/icons/ordem-icons';
import type { ValidatedItem } from '@/lib/import-validators';

interface ImportPreviewProps<T> {
  items: ValidatedItem<T>[];
  renderItem: (item: T) => string;
}

export function ImportPreview<T>({ items, renderItem }: ImportPreviewProps<T>) {
  // Contadores
  const validCount = items.filter(i => i.validation.valid).length;
  const invalidCount = items.filter(i => !i.validation.valid).length;
  const warningCount = items.filter(i => i.validation.warnings.length > 0).length;

  if (items.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <FileSearch className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">Cole ou carregue um JSON para ver o preview</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-primary" />
            Preview dos Dados ({items.length} {items.length === 1 ? 'item' : 'itens'})
          </span>
          <div className="flex gap-2">
            {validCount > 0 && (
              <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                {validCount} válido{validCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {invalidCount > 0 && (
              <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                <XCircle className="h-3 w-3 mr-1" />
                {invalidCount} inválido{invalidCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {warningCount} aviso{warningCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-md border ${
                  item.validation.valid
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-destructive/20 bg-destructive/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.validation.valid ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">
                      {renderItem(item.data)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      #{item.index + 1}
                    </Badge>
                  </div>
                </div>

                {/* Erros */}
                {item.validation.errors.length > 0 && (
                  <div className="mt-2 ml-6 space-y-1">
                    {item.validation.errors.map((error, errorIdx) => (
                      <p key={errorIdx} className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {error}
                      </p>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {item.validation.warnings.length > 0 && (
                  <div className="mt-2 ml-6 space-y-1">
                    {item.validation.warnings.map((warning, warnIdx) => (
                      <p key={warnIdx} className="text-xs text-yellow-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {warning}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
