import { useOnlineStatus } from '@/hooks';
import { WifiOff, RefreshCw, Skull } from '@/components/icons/ordem-icons';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineIndicator() {
  const { isOnline, isChecking, checkRealConnectivity } = useOnlineStatus();

  const handleRetry = async () => {
    const online = await checkRealConnectivity();
    if (online) {
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm"
        >
          <div className="relative flex flex-col items-center gap-6 p-8 max-w-md text-center">
            {/* Animated skull icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <div className="absolute inset-0 bg-destructive/20 blur-xl rounded-full" />
              <Skull className="w-20 h-20 text-destructive relative" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground tracking-wider">
                CONEXÃO PERDIDA
              </h2>
              <p className="text-sm text-muted-foreground uppercase tracking-widest">
                Interferência Paranormal Detectada
              </p>
            </div>

            <div className="h-px w-32 bg-gradient-to-r from-transparent via-destructive/50 to-transparent" />

            <p className="text-muted-foreground text-sm max-w-xs">
              A comunicação com a Central da Ordo Realitas foi interrompida. 
              Verifique sua conexão e tente restabelecer o contato.
            </p>

            <Button
              onClick={handleRetry}
              disabled={isChecking}
              variant="outline"
              className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              {isChecking ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              {isChecking ? 'Verificando...' : 'Reconectar'}
            </Button>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-destructive"
              />
              Modo Offline Ativo
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
