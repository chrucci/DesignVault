import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/product-card';

// Mock next/link since we're not in a Next.js context
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ProductCard', () => {
  it('renders product name', () => {
    render(<ProductCard id="1" name="Kohler Faucet" />);
    expect(screen.getByText('Kohler Faucet')).toBeInTheDocument();
  });

  it('renders brand when provided', () => {
    render(<ProductCard id="1" name="Faucet" brand="Kohler" />);
    expect(screen.getByText('Kohler')).toBeInTheDocument();
  });

  it('does not render brand when null', () => {
    render(<ProductCard id="1" name="Faucet" brand={null} />);
    expect(screen.queryByText('Kohler')).not.toBeInTheDocument();
  });

  it('renders formatted retail price', () => {
    render(<ProductCard id="1" name="Sofa" retail_price={1550} />);
    expect(screen.getByText('$1,550.00')).toBeInTheDocument();
  });

  it('does not render price when null', () => {
    render(<ProductCard id="1" name="Sofa" retail_price={null} />);
    expect(screen.queryByText('$')).not.toBeInTheDocument();
  });

  it('links to product detail page', () => {
    render(<ProductCard id="abc-123" name="Table" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/abc-123');
  });

  it('renders image when primary_image_url provided', () => {
    render(<ProductCard id="1" name="Chair" primary_image_url="https://example.com/chair.jpg" />);
    const img = screen.getByAltText('Chair');
    expect(img).toHaveAttribute('src', 'https://example.com/chair.jpg');
  });
});
