/**
 * Test environment bootstrap — MUST be the first import of every test file
 * so env vars are set before lib/prisma.js and friends are evaluated.
 *
 * Local test database: `npm run test:db:start` (Prisma dev Postgres on :51214).
 */

process.env.NODE_ENV = process.env.NODE_ENV === 'production' ? 'test' : (process.env.NODE_ENV ?? 'test');

// pgbouncer=true disables named prepared statements — required for the Prisma
// dev proxy, which otherwise errors "prepared statement already exists" under a pool.
process.env.DATABASE_URL ??=
  'postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&pgbouncer=true&connection_limit=20&pool_timeout=120';

process.env.JWT_ACCESS_SECRET ??= 'test-jwt-access-secret-0123456789';
process.env.JWT_REFRESH_SECRET ??= 'test-jwt-refresh-secret-0123456789';

// Speed up external-API timeout/retry paths (defaults are 30s / 3 / 5s).
process.env.EXTERNAL_API_TIMEOUT_MS ??= '150';
process.env.EXTERNAL_API_RETRY_GAP_MS ??= '10';
