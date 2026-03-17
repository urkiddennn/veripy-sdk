import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Docs from './pages/Docs';

describe('Docs Component', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <Docs />
      </MemoryRouter>
    );
    expect(screen.getByText(/Veripy Documentation/i)).toBeInTheDocument();
    expect(screen.getByText(/Spam Defense/i)).toBeInTheDocument();
    expect(screen.getByText(/Rate Limiting/i)).toBeInTheDocument();
  });
});
