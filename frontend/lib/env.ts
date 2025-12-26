export function env(key: string): string | null {
  const value = process.env[key];
  if (!value || value.trim() === "") return null;
  return value;
}
