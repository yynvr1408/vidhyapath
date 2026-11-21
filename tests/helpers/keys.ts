/** Returns the paths of every object key (at any depth) whose name is in `names`. */
export function findKeysNamed(value: unknown, names: string[], path = '$'): string[] {
  const wanted = new Set(names.map((n) => n.toLowerCase()));
  const hits: string[] = [];
  if (Array.isArray(value)) {
    value.forEach((v, i) => hits.push(...findKeysNamed(v, names, `${path}[${i}]`)));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (wanted.has(k.toLowerCase())) hits.push(`${path}.${k}`);
      hits.push(...findKeysNamed(v, names, `${path}.${k}`));
    }
  }
  return hits;
}
