import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Login from './Login';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient('https://mock.convex.cloud');

// Mock convex useMutation
vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    useMutation: () => vi.fn().mockResolvedValue("mock_user_id"),
  };
});

describe('Login Component', () => {
  it('renders login form correctly', () => {
    render(
      <ConvexProvider client={convex}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </ConvexProvider>
    );
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('allows user to type in fields', () => {
    render(
      <ConvexProvider client={convex}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </ConvexProvider>
    );
    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });
});
