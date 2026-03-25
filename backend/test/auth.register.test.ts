import { describe, it, expect, vi } from 'vitest';
import { register } from '../src/controllers/authController';

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('authController.register (simple)', () => {
  it('should return response without crashing', async () => {
    const req: any = {
      body: {}, // пустой body → точно вызовет ошибку 400
    };

    const res = mockRes();

    await register(req, res);

    // главное — контроллер отработал и вернул ответ
    expect(res.status).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it('should return 400 for invalid input', async () => {
    const req: any = {
      body: {}, // невалидный ввод
    };

    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
  it('should handle missing fields gracefully', async () => {
  const req: any = {
    body: {
      email: '',
      password: '',
    },
  };

  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  await register(req, res);

  expect(res.status).toHaveBeenCalled();
  expect(res.json).toHaveBeenCalled();
});
});