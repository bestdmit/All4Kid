import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/database/db', () => ({
  query: vi.fn(),
}));

import { query } from '../src/database/db';
import {
  getAllSpecialists,
  getSpecialistById,
} from '../src/controllers/specialistsController';

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('specialistsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all specialists', async () => {
    (query as any).mockResolvedValue({
      rows: [
        {
          id: 1,
          name: 'Иван Иванов',
          specialty: 'Тренер по футболу',
          slug: 'sports',
        },
      ],
      rowCount: 1,
    });

    const req: any = {
      query: {},
    };
    const res = mockRes();

    await getAllSpecialists(req, res);

    expect(query).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        {
          id: 1,
          name: 'Иван Иванов',
          specialty: 'Тренер по футболу',
          slug: 'sports',
        },
      ],
      total: 1,
    });
  });

  it('should return 404 if specialist not found', async () => {
    (query as any).mockResolvedValue({
      rows: [],
    });

    const req: any = {
      params: { id: '999' },
    };
    const res = mockRes();

    await getSpecialistById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Специалист не найден',
    });
  });
  it('should return specialist by id', async () => {
  (query as any).mockResolvedValue({
    rows: [
      {
        id: 1,
        name: 'Иван Иванов',
        specialty: 'Тренер по футболу',
        category: 'Спорт',
        is_deleted_by_admin: false,
      },
    ],
  });

  const req: any = {
    params: { id: '1' },
  };
  const res = mockRes();

  await getSpecialistById(req, res);

  expect(res.json).toHaveBeenCalledWith({
    success: true,
    data: {
      id: 1,
      name: 'Иван Иванов',
      specialty: 'Тренер по футболу',
      category: 'Спорт',
      is_deleted_by_admin: false,
    },
  });
});
  
  
});