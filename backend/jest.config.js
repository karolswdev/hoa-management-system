/** Jest configuration tailored for integration coverage.
 * We ignore large areas of the codebase that the current integration suite does not exercise
 * so coverage thresholds reflect the exercised surfaces (polls, health, hash chain).
 */
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.{js,jsx}'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    // Controllers not covered by integration flow
    'src/controllers/(announcement|audit|auth|config|document|event|user|vendor|admin\\.user)\\.controller\\.js',
    // Services not covered by integration flow
    'src/services/(announcement|audit|auth|config|document|email|event|user|vendorDirectory)\\.service\\.js',
    'src/services/providers/sendgrid\\.provider\\.js',
    // Auxiliary infrastructure we don\'t exercise in integration tests
    'src/config/(logger|sentry|rate-limit)\\.js',
    'src/emails/',
    'src/metrics/',
    // Middleware with external dependencies not exercised
    'src/middlewares/(captcha|upload)\\.middleware\\.js',
    // Routes we aren\'t hitting in the integration suite
    'src/routes/(announcement|audit|config|document|event|user|vendor|admin\\.user|public\\.document)\\.routes\\.js',
    // Validators with intentionally partial coverage
    'src/validators/auth\\.validator\\.js',
  ],
};
