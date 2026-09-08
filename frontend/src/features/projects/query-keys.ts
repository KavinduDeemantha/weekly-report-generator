export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: { page: number; limit: number; isActive?: boolean }) =>
    [...projectKeys.lists(), filters] as const,
};
