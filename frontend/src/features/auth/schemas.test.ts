import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './schemas';

describe('auth schemas', () => {
  it('rejects an invalid login email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'Password123!',
    });

    expect(result.success).toBe(false);
  });

  it('requires matching registration passwords', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      confirmPassword: 'Different123!',
    });

    expect(result.success).toBe(false);
  });
});
