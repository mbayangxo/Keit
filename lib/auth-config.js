/** Server auth readiness — used by health checks and authVerify. */

export function jwtSecretConfigured(name) {
  return (process.env[name]?.trim().length ?? 0) >= 16;
}

export function authSecretsConfigured() {
  return jwtSecretConfigured('JWT_ACCESS_SECRET') && jwtSecretConfigured('JWT_REFRESH_SECRET');
}

export function authConfigStatus() {
  return {
    jwtAccess: jwtSecretConfigured('JWT_ACCESS_SECRET'),
    jwtRefresh: jwtSecretConfigured('JWT_REFRESH_SECRET'),
    email: Boolean(process.env.RESEND_API_KEY?.trim()),
    betaOtp: process.env.ALLOW_BETA_OTP === 'true',
  };
}

export function authNotConfiguredError() {
  const err = new Error('Auth secrets not configured on server');
  err.code = 'auth_not_configured';
  err.status = 503;
  return err;
}
