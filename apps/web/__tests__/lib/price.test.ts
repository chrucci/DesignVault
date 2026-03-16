import { describe, it, expect } from 'vitest';

// Price calculation logic mirrors the DB generated column:
// retail_price = wholesale_price * (1 + markup_percent / 100)
function calculateRetailPrice(wholesalePrice: number, markupPercent: number): number {
  return wholesalePrice * (1 + markupPercent / 100);
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

describe('calculateRetailPrice', () => {
  it('calculates with default 55% markup', () => {
    expect(calculateRetailPrice(100, 55)).toBe(155);
  });

  it('calculates with 0% markup', () => {
    expect(calculateRetailPrice(100, 0)).toBe(100);
  });

  it('calculates with 100% markup', () => {
    expect(calculateRetailPrice(250, 100)).toBe(500);
  });

  it('handles decimal wholesale prices', () => {
    const result = calculateRetailPrice(99.99, 55);
    expect(result).toBeCloseTo(154.9845, 2);
  });

  it('handles zero wholesale price', () => {
    expect(calculateRetailPrice(0, 55)).toBe(0);
  });
});

describe('formatPrice', () => {
  it('formats whole dollar amounts', () => {
    expect(formatPrice(100)).toBe('$100.00');
  });

  it('formats cents', () => {
    expect(formatPrice(99.99)).toBe('$99.99');
  });

  it('formats large amounts with commas', () => {
    expect(formatPrice(12500)).toBe('$12,500.00');
  });

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});
