import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RestoreDraftDialogProps {
  open: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  characterName?: string;
  savedAt?: number;
}

export function RestoreDraftDialog({
  open,
  onRestore,
  onDiscard,
  characterName,
  savedAt,
}: RestoreDraftDialogProps) {
  const timeAgo = savedAt
    ? formatDistanceToNow(new Date(savedAt), { addSuffix: true, locale: ptBR })
    : 'recentemente';

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display tracking-wider">
            Rascunho Encontrado
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Encontramos um rascunho de criação de personagem salvo {timeAgo}.
            </p>
            {characterName && (
              <p className="text-foreground font-medium">
                Personagem: {characterName}
              </p>
            )}
            <p>Deseja continuar de onde parou?</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard} className="font-display tracking-wider">
            DESCARTAR
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRestore} className="font-display tracking-wider">
            CONTINUAR
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
