import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Input from './Input';
import { Mail } from 'lucide-react';

describe('Input Component', () => {
  it('renders input field correctly', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with a label if provided', () => {
    render(<Input label="Email Address" />);
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('renders with an icon if provided', () => {
    render(<Input icon={<Mail data-testid="mail-icon" />} />);
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
  });

  it('handles onChange events', () => {
    const handleChange = vi.fn();
    render(<Input placeholder="Type here" onChange={handleChange} />);
    
    const input = screen.getByPlaceholderText('Type here');
    fireEvent.change(input, { target: { value: 'hello' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
