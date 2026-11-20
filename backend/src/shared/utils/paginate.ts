export type Paginated<T> = {
  data: T[];
  nextCursor: string | null;
};

export function paginate<T extends { id: string }>(
  items: T[],
  limit: number,
): Paginated<T> {
  if (items.length <= limit) {
    return { data: items, nextCursor: null };
  }

  const data = items.slice(0, limit);

  return { data, nextCursor: data[data.length - 1].id };
}
