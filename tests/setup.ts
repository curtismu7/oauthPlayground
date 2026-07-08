import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { configure } from '@testing-library/react'
import { vi } from 'vitest'

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

/** In-memory Storage for tests that read/write keys (localStorage/sessionStorage). */
function createInMemoryStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
}

const localStorageImpl = createInMemoryStorage()
const sessionStorageImpl = createInMemoryStorage()

function installWebStorage() {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageImpl,
    writable: true,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorageImpl,
    writable: true,
    configurable: true,
  })
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageImpl,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageImpl,
      writable: true,
      configurable: true,
    })
  }
}

installWebStorage()

// Mock window.matchMedia (only in DOM envs — node-env tests have no window)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}
