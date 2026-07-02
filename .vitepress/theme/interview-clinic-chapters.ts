const SPECIAL_CHAPTERS: Record<
  string,
  { label: string; order: number; group: "special" | "course" }
> = {
  capstone: { label: "毕业项目", order: 900, group: "special" },
  "external-codefather": { label: "面试专题", order: 1000, group: "special" },
};

export function chapterDisplay(chapter: string): string {
  const special = SPECIAL_CHAPTERS[chapter];
  if (special) return special.label;
  return /^\d+$/.test(chapter) ? `第 ${chapter} 章` : chapter;
}

export function chapterGroup(chapter: string): "special" | "course" {
  return SPECIAL_CHAPTERS[chapter]?.group ?? "course";
}

export function compareChapters(left: string, right: string): number {
  const leftSpecial = SPECIAL_CHAPTERS[left];
  const rightSpecial = SPECIAL_CHAPTERS[right];
  if (leftSpecial && rightSpecial) return leftSpecial.order - rightSpecial.order;
  if (leftSpecial) return 1;
  if (rightSpecial) return -1;

  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
  if (Number.isFinite(leftNumber)) return -1;
  if (Number.isFinite(rightNumber)) return 1;
  return left.localeCompare(right);
}
