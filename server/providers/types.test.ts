import {describe,it,expect} from 'vitest';
import crypto from 'node:crypto';

describe('security primitives',()=>{
  it('generates non-sequential opaque values',()=>{const a=crypto.randomBytes(32).toString('base64url');const b=crypto.randomBytes(32).toString('base64url');expect(a).not.toBe(b);expect(a.length).toBeGreaterThan(40)});
  it('normalizes signed token material deterministically',()=>{const secret='test-secret';const body='abc.123';const a=crypto.createHmac('sha256',secret).update(body).digest('base64url');const b=crypto.createHmac('sha256',secret).update(body).digest('base64url');expect(a).toBe(b)});
});
