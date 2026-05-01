export function toCacheKey(prefix: string, input: unknown): string {
  return `${prefix}:${JSON.stringify(input)}`;
}
