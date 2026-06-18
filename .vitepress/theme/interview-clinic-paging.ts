export function clampPageIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(index, 0), total - 1);
}

export function nextPagedIndex(current: number, deltaY: number, total: number): number {
  if (total <= 1 || deltaY === 0) return clampPageIndex(current, total);
  return clampPageIndex(current + (deltaY > 0 ? 1 : -1), total);
}

export function nearestPagedIndex(scrollTop: number, itemTops: readonly number[]): number {
  if (itemTops.length === 0) return 0;

  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < itemTops.length; index += 1) {
    const distance = Math.abs(itemTops[index]! - scrollTop);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestIndex;
}
