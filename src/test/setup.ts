/**
 * Setup de Testes - Vitest
 * 
 * Configuração global para execução de testes no projeto
 * Ordem Paranormal RPG
 */

import '@testing-library/jest-dom';

// No Node recente, o localStorage global pode existir sem armazenamento.
// Em testes de navegador, use sempre a implementação isolada do jsdom.
declare const jsdom: { window: Window & typeof globalThis };
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: jsdom.window.localStorage });
Object.defineProperty(globalThis, 'Storage', { configurable: true, value: jsdom.window.Storage });

// Mock do matchMedia para testes de componentes responsivos
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock do ResizeObserver para componentes que usam
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverMock,
});

// Mock do IntersectionObserver
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: IntersectionObserverMock,
});
