import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePWAInstall, useIsMobile } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';

const STORAGE_KEY = 'pwa-install-banner-dismissed';
const DISMISS_DURATION_DAYS = 7;

export function InstallPromptBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if should show banner
    const checkShouldShow = () => {
      if (isInstalled) return false;
      
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const now = new Date();
        const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceDismissed < DISMISS_DURATION_DAYS) {
          return false;
        }
      }
      
      return isMobile;
    };

    // Delay showing to not be intrusive on page load
    const timer = setTimeout(() => {
      if (checkShouldShow()) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isMobile, isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  };

  const handleInstall = async () => {
    if (isInstallable) {
      const success = await promptInstall();
      if (success) {
        setIsVisible(false);
      }
    }
  };

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:hidden"
        >
          <div className="relative bg-gradient-to-r from-[#1A0808] to-[#0D0A0B] border border-[#8B0000]/40 rounded-xl p-4 shadow-[0_0_30px_rgba(139,0,0,0.3)]">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1.5 rounded-full text-[#808080] hover:text-white hover:bg-[#8B0000]/20 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-[#8B0000]/20 border border-[#8B0000]/40 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-[#B22222]" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-sm text-[#F5F5F5] mb-1">
                  Instale o Let's Roll
                </h3>
                <p className="text-xs text-[#808080] mb-3 leading-relaxed">
                  Acesso rápido direto da sua tela inicial, sem abrir o navegador.
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isInstallable ? (
                    <Button
                      size="sm"
                      onClick={handleInstall}
                      className="bg-[#8B0000] hover:bg-[#B22222] text-white text-xs px-3 py-1.5 h-auto gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Instalar Agora
                    </Button>
                  ) : (
                    <Link to="/install" onClick={handleDismiss}>
                      <Button
                        size="sm"
                        className="bg-[#8B0000] hover:bg-[#B22222] text-white text-xs px-3 py-1.5 h-auto gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Ver Instruções
                      </Button>
                    </Link>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="text-[#808080] hover:text-white text-xs px-3 py-1.5 h-auto"
                  >
                    Depois
                  </Button>
                </div>
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -bottom-px left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#8B0000] to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
