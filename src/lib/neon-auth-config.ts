/* Single source of truth for the Neon Managed Better Auth gateway URL.
 *
 * This URL is public (it appears in the CSP connect-src header and the client
 * bundle), so a built-in default is safe and means a deployment works without
 * any environment configuration. NEON_AUTH_URL (server) and VITE_NEON_AUTH_URL
 * (client, baked at build time) remain available as overrides.
 */
export const NEON_AUTH_URL_DEFAULT =
  "https://ep-soft-hat-b4451rsm.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth";
