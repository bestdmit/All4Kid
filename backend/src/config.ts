export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    accessExpiresIn: '15m',  // Короткоживущий токен
    refreshExpiresIn: '7d',   // Долгоживущий токен
  },
  bcryptRounds: 10,
  emailValidation: {
    accessKey: process.env.EMAIL_VALIDATION_ACCESS_KEY || '',
    baseUrl: 'http://apilayer.net/api/check',
    timeoutMs: Number(process.env.EMAIL_VALIDATION_TIMEOUT_MS || 5000)
  }
};