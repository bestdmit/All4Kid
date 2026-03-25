import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/database/db', () => ({
  query: vi.fn(),
}));

import { query } from '../src/database/db';
import { getSpecialistReviews } from '../src/controllers/reviewsController';

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('reviewsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error for invalid specialist id', async () => {
    const req: any = {
      params: {},
    };
    const res = mockRes();

    await getSpecialistReviews(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Некорректный id специалиста',
    });
  });

  it('should not query db for invalid specialist id', async () => {
    const req: any = {
      params: {},
    };
    const res = mockRes();

    await getSpecialistReviews(req, res);

    expect(query).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });
});