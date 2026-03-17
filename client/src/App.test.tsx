import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient('https://mock.convex.cloud');

// Mock convex useQuery
vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    useQuery: () => null,
  };
});

describe('App Component', () => {
  it('renders without crashing', () => {
    render(
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
