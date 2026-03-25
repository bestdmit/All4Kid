import { describe, it, expect, vi } from 'vitest';
import { register } from '../src/controllers/authController';

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('authController (simple)', () => {
  it('should return 400 for empty body', async () => {
    const req: any = {
      body: {},
    };

    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it('should not crash on invalid input', async () => {
    const req: any = {
      body: null,
    };

    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalled();
  });
});