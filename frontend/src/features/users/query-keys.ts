export const userKeys = {
  all: ['users'] as const,
  list: (filters: { page: number; limit: number }) =>
    [...userKeys.all, 'list', filters] as const,
};
