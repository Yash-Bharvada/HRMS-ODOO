export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  jwtExpirationTime: parseInt(process.env.JWT_EXPIRATION_TIME || "3600", 10),
};
