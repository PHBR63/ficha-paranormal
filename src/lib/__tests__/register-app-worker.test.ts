import { describe, expect, it, vi } from 'vitest';
import { registerAppWorker } from '../register-app-worker';
const fake = vi.hoisted(() => ({ register: vi.fn(), activate: vi.fn() }));
describe('Atualização sem interromper uma ação', () => {
  it('oferece nova versão sem ativação ou recarregamento automático', () => {
    fake.register.mockReturnValue(fake.activate);
    const notice = vi.fn();
    window.addEventListener('app-update-available',notice);
    try {
      registerAppWorker(fake.register);
      fake.register.mock.calls[0][0].onNeedRefresh();
      expect(notice).toHaveBeenCalledTimes(1);
      expect(fake.activate).not.toHaveBeenCalled();
    } finally { window.removeEventListener('app-update-available',notice); }
  });
});
