import dotenv from "dotenv";
import { validateDatabaseUrl } from "./databaseUrl";
dotenv.config({ override: true });

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required. Set it in the .env file.");
  }
  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error("JWT_SECRET must have at least 32 characters in production.");
  }
  return secret;
}

function getDataEncryptionKey() {
  const key = process.env.DATA_ENCRYPTION_KEY || "";
  if (!key && process.env.NODE_ENV === "production") {
    throw new Error("DATA_ENCRYPTION_KEY is required in production.");
  }
  if (key && Buffer.from(key, "base64").length !== 32) {
    throw new Error("DATA_ENCRYPTION_KEY must be 32 bytes encoded in base64.");
  }
  return key;
}

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  DATABASE_URL: validateDatabaseUrl(process.env.DATABASE_URL),
  JWT_SECRET: getJwtSecret(),
  DATA_ENCRYPTION_KEY: getDataEncryptionKey(),
  NODE_ENV: process.env.NODE_ENV || "development",
  
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "465", 10),
  SMTP_SECURE: process.env.SMTP_SECURE !== "false",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || "GoEats",

  // OAuth Credentials
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || "",
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || "",

  // Gmail API OAuth2
  GMAIL_USER: process.env.GMAIL_USER || "",
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID || "",
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET || "",
  GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN || "",
};

