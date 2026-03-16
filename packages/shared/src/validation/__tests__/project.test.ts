import { describe, it, expect } from 'vitest';
import { projectSchema, projectStatusSchema } from '../project';

describe('projectStatusSchema', () => {
  it('accepts valid statuses', () => {
    expect(projectStatusSchema.parse('active')).toBe('active');
    expect(projectStatusSchema.parse('completed')).toBe('completed');
    expect(projectStatusSchema.parse('archived')).toBe('archived');
  });

  it('rejects invalid status', () => {
    expect(() => projectStatusSchema.parse('deleted')).toThrow();
  });
});

describe('projectSchema', () => {
  it('validates a minimal project', () => {
    const result = projectSchema.safeParse({ name: 'Smith Kitchen Remodel' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('active'); // default
    }
  });

  it('validates a full project', () => {
    const result = projectSchema.safeParse({
      name: 'Jones Master Bath',
      client_name: 'Sarah Jones',
      status: 'completed',
      notes: 'Completed March 2026',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty project name', () => {
    const result = projectSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});
