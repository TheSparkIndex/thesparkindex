export type PaginationOpts = { page?: number; perPage?: number };

export function paginationArgs(opts: PaginationOpts, defaultPerPage: number) {
  return {
    page: Math.max(1, opts.page ?? 1),
    perPage: opts.perPage ?? defaultPerPage,
  };
}

export function paginationMeta(total: number, page: number, perPage: number) {
  return { page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}