export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function normalizePagination(page: number, limit: number): {
  page: number;
  limit: number;
  skip: number;
} {
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.min(Math.max(1, limit), 100);

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
  };
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
