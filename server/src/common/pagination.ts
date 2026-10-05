/**
 * Offset pagination for list endpoints: `?page=&perPage=`.
 *
 * Every list keeps its original response key (`orders`, `products`, …) and
 * adds a `pagination` block, so clients that ignore it still get page 1 at
 * the endpoint's old size. perPage is clamped, and pages past MAX_PAGE are
 * refused so a crafted `?page=` can't force a huge OFFSET scan.
 */
export const MAX_PAGE = 1000;

export type PageParams = {
  page: number;
  perPage: number;
  skip: number;
  take: number;
};

export type Pagination = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export function pageParams(
  query: { page?: string; perPage?: string },
  defaults: { perPage: number; maxPerPage?: number },
): PageParams {
  const max = defaults.maxPerPage ?? 200;
  const page = Math.min(
    MAX_PAGE,
    Math.max(1, Math.floor(Number(query.page)) || 1),
  );
  const perPage = Math.min(
    max,
    Math.max(1, Math.floor(Number(query.perPage)) || defaults.perPage),
  );
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

export function pagination(p: PageParams, total: number): Pagination {
  return {
    page: p.page,
    perPage: p.perPage,
    total,
    totalPages: Math.max(1, Math.min(MAX_PAGE, Math.ceil(total / p.perPage))),
  };
}
