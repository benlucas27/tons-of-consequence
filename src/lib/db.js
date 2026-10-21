/** The review database (Neon Postgres, added through Vercel). Returns null when it is not configured, so pages and routes fail soft. */
import { neon } from '@neondatabase/serverless';

let cached = null;
export const dbUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
export function sql() {
  const url = dbUrl();
  if (!url) return null;
  if (!cached) cached = neon(url);
  return cached;
}
/** The secret used to hash visitors' addresses: its own setting if present, otherwise derived from the database address. */
export const hashSecret = () => process.env.CHALLENGE_SALT || dbUrl() || '';
