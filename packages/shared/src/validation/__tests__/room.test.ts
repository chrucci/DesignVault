import { describe, it, expect } from 'vitest';
import { roomSchema, roomProductSchema } from '../room';

describe('roomSchema', () => {
  it('validates a room with name only', () => {
    const result = roomSchema.safeParse({ name: 'Master Bathroom' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort_order).toBe(0); // default
    }
  });

  it('rejects empty room name', () => {
    const result = roomSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('coerces string sort_order to number', () => {
    const result = roomSchema.safeParse({ name: 'Kitchen', sort_order: '3' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort_order).toBe(3);
    }
  });
});

describe('roomProductSchema', () => {
  it('validates a room product assignment', () => {
    const result = roomProductSchema.safeParse({
      product_id: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 2,
    });
    expect(result.success).toBe(true);
  });

  it('defaults quantity to 1', () => {
    const result = roomProductSchema.safeParse({
      product_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });

  it('rejects quantity of 0', () => {
    const result = roomProductSchema.safeParse({
      product_id: '550e8400-e29b-41d4-a716-446655440000',
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid product_id', () => {
    const result = roomProductSchema.safeParse({
      product_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});
