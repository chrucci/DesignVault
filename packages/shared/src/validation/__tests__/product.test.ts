import { describe, it, expect } from 'vitest';
import { productSchema, clipProductSchema, stockStatusSchema } from '../product';

describe('stockStatusSchema', () => {
  it('accepts valid stock statuses', () => {
    expect(stockStatusSchema.parse('in_stock')).toBe('in_stock');
    expect(stockStatusSchema.parse('out_of_stock')).toBe('out_of_stock');
    expect(stockStatusSchema.parse('special_order')).toBe('special_order');
    expect(stockStatusSchema.parse('unknown')).toBe('unknown');
  });

  it('rejects invalid stock status', () => {
    expect(() => stockStatusSchema.parse('discontinued')).toThrow();
  });
});

describe('productSchema', () => {
  it('validates a minimal product (name only)', () => {
    const result = productSchema.safeParse({ name: 'Kohler Faucet' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Kohler Faucet');
      expect(result.data.markup_percent).toBe(55); // default
      expect(result.data.stock_status).toBe('unknown'); // default
      expect(result.data.shipping_cost).toBe(0); // default
    }
  });

  it('validates a fully-populated product', () => {
    const result = productSchema.safeParse({
      name: 'Luxury Sofa',
      brand: 'Restoration Hardware',
      model_sku: 'RH-SOFA-001',
      source_url: 'https://rh.com/sofa',
      wholesale_price: 2500,
      markup_percent: 60,
      dimensions_width: '84"',
      dimensions_depth: '38"',
      dimensions_height: '34"',
      dimensions_text: '84" W x 38" D x 34" H',
      materials: 'Belgian Linen',
      color: 'Fog',
      stock_status: 'in_stock',
      shipping_cost: 250,
      notes: 'Client loves this one',
      install_notes: 'White glove delivery required',
      spec_url: 'https://rh.com/sofa/spec',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty product name', () => {
    const result = productSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing product name', () => {
    const result = productSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects negative wholesale price', () => {
    const result = productSchema.safeParse({ name: 'Test', wholesale_price: -10 });
    expect(result.success).toBe(false);
  });

  it('rejects markup over 999%', () => {
    const result = productSchema.safeParse({ name: 'Test', markup_percent: 1000 });
    expect(result.success).toBe(false);
  });

  it('coerces string prices to numbers', () => {
    const result = productSchema.safeParse({ name: 'Test', wholesale_price: '99.99' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.wholesale_price).toBe(99.99);
    }
  });

  it('accepts empty string for source_url', () => {
    const result = productSchema.safeParse({ name: 'Test', source_url: '' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid source_url', () => {
    const result = productSchema.safeParse({ name: 'Test', source_url: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});

describe('clipProductSchema', () => {
  it('extends productSchema with image_urls and assignment fields', () => {
    const result = clipProductSchema.safeParse({
      name: 'Clipped Product',
      image_urls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      project_id: '550e8400-e29b-41d4-a716-446655440000',
      room_id: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid image URLs', () => {
    const result = clipProductSchema.safeParse({
      name: 'Test',
      image_urls: ['not-a-url'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for project_id', () => {
    const result = clipProductSchema.safeParse({
      name: 'Test',
      project_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});
