const DEFAULT_SECRET = 'hoa-management-test-secret';
let cachedSecret = null;

function resolveSecret() {
  if (cachedSecret) return cachedSecret;

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length > 0) {
    cachedSecret = process.env.JWT_SECRET;
    return cachedSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be defined in production environment.');
  }

  console.warn('JWT_SECRET not set; falling back to development/test default secret.');
  cachedSecret = DEFAULT_SECRET;
  return cachedSecret;
}

module.exports = {
  jwtSecret: resolveSecret(),
};
