import bcrypt from "bcryptjs";

export function getBearerToken(authHeader?: string) {
  if (!authHeader) return null;
  const token = authHeader;
  if (!token) return null;
  if (!token.startsWith("Bearer ")) return null;
  return token.slice(7);
}

/**
 * @shu-vro generated code
 * @param password raw password
 * @returns hashed password
 */
export function passwordHash(password: string) {
  return bcrypt.hash(password, 20);
}

/**
 * @shu-vro generated code for password comparing...
 *
 * @param password user wrote this in input field
 * @param hash this thing in database
 * @returns boolean
 */
export function passwordCompare(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
