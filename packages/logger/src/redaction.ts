/**
 * Standard list of keys to automatically redact in all structured logs
 * to guarantee no secrets, credentials, or sensitive personal information leak.
 */
export const SENSITIVE_LOG_KEYS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'jwtSecret',
  'apiKey',
  'authorization',
  'cookie',
  'otp',
  'pin',
  'cvv',
  'panNumber',
  'aadhaarNumber',
  'ssn',
  'creditCard',
  'cardNumber',
  'privateKey',
  'clientSecret',
  'bankAccountNumber',
  'bankAccount',
  'accountNumber',
  'ifscCode',
  'upiPin',
  'rawToken',
  'passToken',
  'qrCode',
  'promptTokens',
];

export const PINO_REDACT_PATHS = [
  ...SENSITIVE_LOG_KEYS.map((k) => k),
  ...SENSITIVE_LOG_KEYS.map((k) => `*.${k}`),
  ...SENSITIVE_LOG_KEYS.map((k) => `*.*.${k}`),
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
];
