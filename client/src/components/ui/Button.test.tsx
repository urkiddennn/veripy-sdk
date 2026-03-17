import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from './Button';
import { Mail } from 'lucide-react';

describe('Button Component', () => {
  it('renders correctly with given text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /Click Me/i })).toBeInTheDocument();
  });

  it('applies primary variant styles by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole('button', { name: /Primary/i });
    expect(button).toHaveClass('bg-white');
  });

  it('renders with an icon if provided', () => {
    render(<Button icon={<Mail data-testid="mail-icon" />}>Email</Button>);
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
  });

  it('disables the button when loading is true', () => {
    render(<Button loading>Loading...</Button>);
    const button = screen.getByRole('button', { name: /Loading/i });
    expect(button).toBeDisabled();
    // Loader should be present, not children
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
