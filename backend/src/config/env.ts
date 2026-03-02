import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

if (!process.env.EMAIL_USER) {
  throw new Error("EMAIL_USER is not set");
}

if (!process.env.EMAIL_PASSWORD) {
  throw new Error("EMAIL_PASSWORD is not set");
}

export const env = {
  port,
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  frontendOrigin: process.env.FRONTEND_ORIGIN,
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  backendUrl: process.env.BACKEND_URL || "http://localhost:4000",
};
