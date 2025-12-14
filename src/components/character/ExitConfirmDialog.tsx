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

interface ExitConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: ExitConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display tracking-wider text-warning">
            Sair da Criação?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Seu progresso será salvo automaticamente e você poderá continuar depois.
            Deseja realmente sair?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} className="font-display tracking-wider">
            CONTINUAR CRIANDO
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="font-display tracking-wider">
            SAIR E SALVAR
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
