export function clampArray<T>(arr: T[], max: number): T[] {
  return arr.slice(0, Math.max(0, max));
}

export function sanitizeText(input: string, maxLen: number): string {
  return input.trim().replace(/\s+/g, " ").slice(0, maxLen);
}

export function sanitizeIngredients(inputs: string[]): string[] {
  const cleaned = inputs
    .map((v) => sanitizeText(v, 80))
    .map((v) => v.replace(/[<>]/g, ""))
    .filter((v) => v.length > 0);

  // De-dupe while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of cleaned) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

