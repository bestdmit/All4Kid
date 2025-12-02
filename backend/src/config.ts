export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    accessExpiresIn: '15m',  // Короткоживущий токен
    refreshExpiresIn: '7d',   // Долгоживущий токен
  },
  bcryptRounds: 10,
};