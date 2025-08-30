export function getBearerToken(cookies: any, field = "user") {
  const token = cookies?.[field];
  if (!token) return null;
  if (!token.startsWith("Bearer ")) return null;
  return token.slice(7);
}
