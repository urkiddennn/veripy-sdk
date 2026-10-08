import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('convex/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('convex/react')>();
  return {
    ...actual,
    useConvexAuth: vi.fn(() => ({
      isLoading: false,
      isAuthenticated: false,
    })),
  };
});

vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: vi.fn(() => ({
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
  useConvexAuth: vi.fn(() => ({
    isLoading: false,
    isAuthenticated: false,
  })),
  ConvexAuthProvider: ({ children }: any) => children,
}));
