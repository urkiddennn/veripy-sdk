import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Login from '../../../src/pages/Login';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient('https://mock.convex.cloud');

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
    expect(screen.getByRole('button', { name: /Continue with GitHub/i })).toBeInTheDocument();
  });
});
