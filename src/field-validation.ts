export function isValidFieldReferenceName(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_.]*$/.test(name);
}
