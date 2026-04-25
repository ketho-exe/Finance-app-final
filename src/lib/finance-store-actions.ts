export type Identified = { id: string };

export function upsertById<T extends Identified>(items: T[], nextItem: T) {
  const exists = items.some((item) => item.id === nextItem.id);

  if (!exists) {
    return [nextItem, ...items];
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

export function removeById<T extends Identified>(items: T[], id: string) {
  return items.filter((item) => item.id !== id);
}
