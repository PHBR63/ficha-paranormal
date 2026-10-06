import type { registerSW } from 'virtual:pwa-register';

/** Registra o cache offline e avisa a interface; a detecção nunca recarrega uma ação em andamento. */
export function registerAppWorker(register: typeof registerSW): void {
  register({ immediate: true, onNeedRefresh() {
    window.dispatchEvent(new Event('app-update-available'));
  } });
}
