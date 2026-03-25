import { describe, it, expect, vi, beforeEach } from 'vitest';

// мок базы
vi.mock('../src/database/db', () => ({
  query: vi.fn(),
}));

import { query } from '../src/database/db';
import {
  getAllCategories,
  getCategoryBySlug,
} from '../src/controllers/categoriesController';

// helper для res
const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('categoriesController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all categories', async () => {
    (query as any).mockResolvedValue({
      rows: [{ id: 1, name: 'Test', slug: 'test' }],
      rowCount: 1,
    });

    const req: any = {};
    const res = mockRes();

    await getAllCategories(req, res);

    expect(query).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: 1, name: 'Test', slug: 'test' }],
      total: 1,
    });
  });

  it('should return category by slug', async () => {
    (query as any).mockResolvedValue({
      rows: [{ id: 1, name: 'Test', slug: 'test' }],
    });

    const req: any = { params: { slug: 'test' } };
    const res = mockRes();

    await getCategoryBySlug(req, res);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE slug = $1'),
      ['test']
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1, name: 'Test', slug: 'test' },
    });
  });

  it('should return 404 if category not found', async () => {
    (query as any).mockResolvedValue({
      rows: [],
    });

    const req: any = { params: { slug: 'not-found' } };
    const res = mockRes();

    await getCategoryBySlug(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
  success: false,
  message: 'Категория не найдена',
    });
  });
});