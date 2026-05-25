export function num(val: string | undefined, def: number): number {
  if (val === undefined || val === '') return def;
  const parsed = Number(val);
  return isNaN(parsed) ? def : parsed;
}
