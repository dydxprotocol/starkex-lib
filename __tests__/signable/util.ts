/**
 * Return a new hex string which is different from the original hex string at the specified index.
 */
export function mutateHexStringAt(s: string, i: number): string {
  const newChar = ((Number.parseInt(s[i], 16) + 1) % 16).toString(16);
  const newString = `${s.slice(0, i)}${newChar}${s.slice(i + 1)}`;
  return newString;
}
