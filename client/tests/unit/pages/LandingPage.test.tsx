import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import LandingPage from '../../../src/pages/LandingPage';

// Mock child components
vi.mock('../../../src/components/layout/LandingNavbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>
}));
vi.mock('../../../src/components/ui/FeatureSection', () => ({
  default: () => <div data-testid="feature-section">Features</div>
}));
vi.mock('../../../src/components/ui/Pricing', () => ({
  default: () => <div data-testid="pricing">Pricing</div>
}));
vi.mock('../../../src/components/ui/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>
}));
vi.mock('../../../src/components/ui/IconsIntegration', () => ({
  default: () => <div data-testid="icons">Icons</div>
}));

describe('LandingPage Component', () => {
  it('renders correctly', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Trust, but/i)).toBeInTheDocument();
    expect(screen.getByText(/Verify/i)).toBeInTheDocument();
  });

  it('renders interactive accordion sections', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Disposable Email Detection/i)).toBeInTheDocument();
    expect(screen.getByText(/Syntax & Typo Checking/i)).toBeInTheDocument();
    expect(screen.getByText(/Role-Based Address Filtering/i)).toBeInTheDocument();
  });
});
